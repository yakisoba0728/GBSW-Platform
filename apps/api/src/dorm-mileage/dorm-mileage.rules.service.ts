import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, School } from '@prisma/client';
import { throwMileageRuleConflictIfNeeded } from '../common/rule-conflicts';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertStudentExists,
  assertSuperAdmin,
  assertTeacherExists,
} from './dorm-mileage.access';
import {
  toApiDormMileageType,
  toPrismaDormMileageType,
} from './dorm-mileage.mappers';
import {
  parseCreateRuleInput,
  parseRuleId,
  parseUpdateRuleInput,
} from './dorm-mileage.parsers';
import type { DormMileageRuleSummary } from './dorm-mileage.types';

@Injectable()
export class DormMileageRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRules(
    actorTeacherId: string | undefined,
    actorSuperAdminId?: string,
    actorSessionId?: string,
  ) {
    const isSuperAdminRequest =
      typeof actorSuperAdminId === 'string' &&
      actorSuperAdminId.trim().length > 0;

    if (isSuperAdminRequest) {
      await assertSuperAdmin(this.prisma, actorSuperAdminId, actorSessionId);
    } else {
      await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);
    }

    const rules = await this.prisma.dormMileageRule.findMany({
      where: {
        isActive: isSuperAdminRequest ? undefined : true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
      select: ruleSummarySelect,
    });

    return {
      rules: rules.map((rule) => ({
        ...mapRuleSummary(rule),
      })),
    };
  }

  async createRule(
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    await assertSuperAdmin(this.prisma, actorSuperAdminId, actorSessionId);
    const input = parseCreateRuleInput(body);

    await this.assertRuleNameAvailable(input.type, input.category, input.name);
    const createdRule = await this.createRuleWithRetry(input);

    return {
      id: createdRule.id,
      message: '규칙이 추가되었습니다.',
      rule: mapRuleSummary(createdRule),
    };
  }

  async updateRule(
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    await assertSuperAdmin(this.prisma, actorSuperAdminId, actorSessionId);
    const ruleId = parseRuleId(id);
    const input = parseUpdateRuleInput(body);

    const existingRule = await this.prisma.dormMileageRule.findUnique({
      where: {
        id: ruleId,
      },
      select: ruleSummarySelect,
    });

    if (!existingRule) {
      throw new NotFoundException('상벌점 항목을 찾을 수 없습니다.');
    }

    const nextCategory = input.category ?? existingRule.category;
    const nextName = input.name ?? existingRule.name;
    const nextType = toApiDormMileageType(existingRule.type);

    await this.assertRuleNameAvailable(
      nextType,
      nextCategory,
      nextName,
      existingRule.id,
    );

    try {
      await this.prisma.dormMileageRule.update({
        where: {
          id: existingRule.id,
        },
        data: {
          category: input.category,
          name: input.name,
          defaultScore: input.defaultScore,
          displayOrder: input.displayOrder,
          minScore: input.minScore,
          maxScore: input.maxScore,
        },
      });
    } catch (error) {
      throwMileageRuleConflictIfNeeded(error);
      throw error;
    }

    return {
      ok: true,
      message: '규칙이 수정되었습니다.',
    };
  }

  async toggleRule(
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
  ) {
    await assertSuperAdmin(this.prisma, actorSuperAdminId, actorSessionId);
    const ruleId = parseRuleId(id);

    const rule = await this.prisma.dormMileageRule.findUnique({
      where: { id: ruleId },
      select: { id: true, isActive: true },
    });

    if (!rule) {
      throw new NotFoundException('상벌점 항목을 찾을 수 없습니다.');
    }

    const updated = await this.prisma.dormMileageRule.update({
      where: { id: rule.id },
      data: { isActive: !rule.isActive },
      select: { isActive: true },
    });

    return {
      ok: true,
      message: updated.isActive
        ? '기숙사 상벌점 항목이 활성화되었습니다.'
        : '기숙사 상벌점 항목이 비활성화되었습니다.',
      isActive: updated.isActive,
    };
  }

  async getActiveRules(
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    const student = await assertStudentExists(
      this.prisma,
      actorStudentId,
      actorSessionId,
    );

    if (student.school !== School.GBSW) {
      return { rules: [] };
    }

    const rules = await this.prisma.dormMileageRule.findMany({
      where: { isActive: true },
      orderBy: {
        displayOrder: 'asc',
      },
      select: ruleSummarySelect,
    });

    return {
      rules: rules.map((rule) => mapRuleSummary(rule)),
    };
  }

  private async getNextDisplayOrder() {
    const result = await this.prisma.dormMileageRule.aggregate({
      _max: {
        displayOrder: true,
      },
    });

    return (result._max.displayOrder ?? 0) + 1;
  }

  private async createRuleWithRetry(
    input: ReturnType<typeof parseCreateRuleInput>,
  ) {
    const shouldAutoAssign = input.displayOrder === undefined;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const displayOrder =
        input.displayOrder ?? (await this.getNextDisplayOrder());

      try {
        return await this.prisma.dormMileageRule.create({
          data: {
            type: toPrismaDormMileageType(input.type),
            category: input.category,
            name: input.name,
            defaultScore: input.defaultScore,
            displayOrder,
            minScore: input.minScore ?? null,
            maxScore: input.maxScore ?? null,
          },
          select: ruleSummarySelect,
        });
      } catch (error) {
        if (
          shouldAutoAssign &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < 2
        ) {
          continue;
        }

        throwMileageRuleConflictIfNeeded(error);
        throw error;
      }
    }

    throw new ConflictException(
      '표시 순서를 결정하지 못했습니다. 다시 시도해주세요.',
    );
  }

  private async assertRuleNameAvailable(
    type: ReturnType<typeof toApiDormMileageType>,
    category: string,
    name: string,
    excludeRuleId?: number,
  ) {
    const duplicatedRule = await this.prisma.dormMileageRule.findFirst({
      where: {
        type: toPrismaDormMileageType(type),
        category,
        name,
        id:
          excludeRuleId !== undefined
            ? {
                not: excludeRuleId,
              }
            : undefined,
      },
      select: {
        id: true,
      },
    });

    if (duplicatedRule) {
      throw new ConflictException(
        '같은 유형의 카테고리/항목명이 이미 존재합니다.',
      );
    }
  }
}

const ruleSummarySelect = {
  id: true,
  type: true,
  category: true,
  name: true,
  defaultScore: true,
  displayOrder: true,
  isActive: true,
  minScore: true,
  maxScore: true,
} as const;

function mapRuleSummary(rule: {
  id: number;
  type: Parameters<typeof toApiDormMileageType>[0];
  category: string;
  name: string;
  defaultScore: number;
  displayOrder: number;
  isActive: boolean;
  minScore: number | null;
  maxScore: number | null;
}): DormMileageRuleSummary {
  return {
    id: rule.id,
    type: toApiDormMileageType(rule.type),
    category: rule.category,
    name: rule.name,
    defaultScore: rule.defaultScore,
    displayOrder: rule.displayOrder,
    isActive: rule.isActive,
    minScore: rule.minScore,
    maxScore: rule.maxScore,
  };
}
