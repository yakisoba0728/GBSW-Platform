import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertSuperAdmin,
  assertStudentExists,
  assertTeacherOrSuperAdmin,
} from './school-mileage.access';
import {
  toApiMileageType,
  toPrismaMileageType,
} from './school-mileage.mappers';
import {
  parseCreateRuleInput,
  parseRuleId,
  parseUpdateRuleInput,
} from './school-mileage.parsers';

@Injectable()
export class SchoolMileageRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRules(
    actorTeacherId: string | undefined,
    actorSuperAdminId?: string,
    actorSessionId?: string,
  ) {
    const isSuperAdminRequest =
      typeof actorSuperAdminId === 'string' &&
      actorSuperAdminId.trim().length > 0;

    await assertTeacherOrSuperAdmin(
      this.prisma,
      actorTeacherId,
      actorSuperAdminId,
      actorSessionId,
    );

    const rules = await this.prisma.schoolMileageRule.findMany({
      where: {
        isActive: isSuperAdminRequest ? undefined : true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
      select: {
        id: true,
        type: true,
        category: true,
        name: true,
        defaultScore: true,
        displayOrder: true,
        isActive: true,
      },
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

    const existingRule = await this.prisma.schoolMileageRule.findUnique({
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
    const nextType = toApiMileageType(existingRule.type);

    await this.assertRuleNameAvailable(
      nextType,
      nextCategory,
      nextName,
      existingRule.id,
    );

    try {
      await this.prisma.schoolMileageRule.update({
        where: {
          id: existingRule.id,
        },
        data: {
          category: input.category,
          name: input.name,
          defaultScore: input.defaultScore,
          displayOrder: input.displayOrder,
        },
      });
    } catch (error) {
      throwRuleConflictIfNeeded(error);
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

    const rule = await this.prisma.schoolMileageRule.findUnique({
      where: { id: ruleId },
      select: { id: true, isActive: true },
    });

    if (!rule) {
      throw new NotFoundException('상벌점 항목을 찾을 수 없습니다.');
    }

    const updated = await this.prisma.schoolMileageRule.update({
      where: { id: rule.id },
      data: { isActive: !rule.isActive },
      select: { isActive: true },
    });

    return {
      ok: true,
      message: updated.isActive
        ? '상벌점 항목이 활성화되었습니다.'
        : '상벌점 항목이 비활성화되었습니다.',
      isActive: updated.isActive,
    };
  }

  async getActiveRules(
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    await assertStudentExists(this.prisma, actorStudentId, actorSessionId);

    const rules = await this.prisma.schoolMileageRule.findMany({
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
    const result = await this.prisma.schoolMileageRule.aggregate({
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
        return await this.prisma.schoolMileageRule.create({
          data: {
            type: toPrismaMileageType(input.type),
            category: input.category,
            name: input.name,
            defaultScore: input.defaultScore,
            displayOrder,
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

        throwRuleConflictIfNeeded(error);
        throw error;
      }
    }

    throw new ConflictException(
      '표시 순서를 결정하지 못했습니다. 다시 시도해주세요.',
    );
  }

  private async assertRuleNameAvailable(
    type: ReturnType<typeof toApiMileageType>,
    category: string,
    name: string,
    excludeRuleId?: number,
  ) {
    const duplicatedRule = await this.prisma.schoolMileageRule.findFirst({
      where: {
        type: toPrismaMileageType(type),
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
} as const;

function mapRuleSummary(rule: {
  id: number;
  type: Parameters<typeof toApiMileageType>[0];
  category: string;
  name: string;
  defaultScore: number;
  displayOrder: number;
  isActive: boolean;
}) {
  return {
    id: rule.id,
    type: toApiMileageType(rule.type),
    category: rule.category,
    name: rule.name,
    defaultScore: rule.defaultScore,
    displayOrder: rule.displayOrder,
    isActive: rule.isActive,
  };
}

function throwRuleConflictIfNeeded(error: unknown): asserts error is never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      '같은 유형의 카테고리/항목명이 이미 존재합니다.',
    );
  }
}
