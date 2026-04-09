import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MileageScope, Prisma, School } from '@prisma/client';
import {
  assertSuperAdmin,
  assertStudentExists,
  assertTeacherOrSuperAdmin,
} from '../common/auth-access';
import { throwMileageRuleConflictIfNeeded } from '../common/rule-conflicts';
import { PrismaService } from '../prisma/prisma.service';
import {
  mapRuleSummary,
  mileageRuleSummarySelect,
  toApiMileageType,
  toPrismaMileageType,
} from './mileage.mappers';
import {
  parseCreateRuleInput,
  parseRuleId,
  parseUpdateRuleInput,
  validateScoreWithinRange,
} from './mileage.parsers';

@Injectable()
export class MileageRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRules(
    scope: MileageScope,
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
      await assertTeacherOrSuperAdmin(
        this.prisma,
        actorTeacherId,
        actorSuperAdminId,
        actorSessionId,
      );
    }

    const rules = await this.prisma.mileageRule.findMany({
      where: {
        scope,
        isActive: isSuperAdminRequest ? undefined : true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
      select: mileageRuleSummarySelect,
    });

    return {
      rules: rules.map((rule) => ({
        ...mapRuleSummary(rule),
      })),
    };
  }

  async createRule(
    scope: MileageScope,
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    await assertSuperAdmin(this.prisma, actorSuperAdminId, actorSessionId);
    const input = parseCreateRuleInput(scope, body);

    await this.assertRuleNameAvailable(
      scope,
      input.type,
      input.category,
      input.name,
    );
    const createdRule = await this.createRuleWithRetry(scope, input);

    return {
      id: createdRule.id,
      message: '규칙이 추가되었습니다.',
      rule: mapRuleSummary(createdRule),
    };
  }

  async updateRule(
    scope: MileageScope,
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    await assertSuperAdmin(this.prisma, actorSuperAdminId, actorSessionId);
    const ruleId = parseRuleId(id);
    const input = parseUpdateRuleInput(scope, body);

    const existingRule = await this.prisma.mileageRule.findUnique({
      where: {
        id: ruleId,
      },
      select: {
        ...mileageRuleSummarySelect,
        scope: true,
      },
    });

    if (!existingRule || existingRule.scope !== scope) {
      throw new NotFoundException('상벌점 항목을 찾을 수 없습니다.');
    }

    const nextCategory = input.category ?? existingRule.category;
    const nextName = input.name ?? existingRule.name;
    const nextType = toApiMileageType(existingRule.type);
    const nextDefaultScore = input.defaultScore ?? existingRule.defaultScore;
    const nextMinScore =
      scope === MileageScope.DORM
        ? input.minScore !== undefined
          ? input.minScore
          : existingRule.minScore
        : undefined;
    const nextMaxScore =
      scope === MileageScope.DORM
        ? input.maxScore !== undefined
          ? input.maxScore
          : existingRule.maxScore
        : undefined;

    validateScoreWithinRange(
      nextDefaultScore,
      nextMinScore,
      nextMaxScore,
      '기본점수',
    );

    await this.assertRuleNameAvailable(
      scope,
      nextType,
      nextCategory,
      nextName,
      existingRule.id,
    );

    try {
      await this.prisma.mileageRule.update({
        where: {
          id: existingRule.id,
        },
        data: {
          category: input.category,
          name: input.name,
          defaultScore: input.defaultScore,
          displayOrder: input.displayOrder,
          minScore: scope === MileageScope.DORM ? input.minScore : undefined,
          maxScore: scope === MileageScope.DORM ? input.maxScore : undefined,
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
    scope: MileageScope,
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
  ) {
    await assertSuperAdmin(this.prisma, actorSuperAdminId, actorSessionId);
    const ruleId = parseRuleId(id);

    const rule = await this.prisma.mileageRule.findUnique({
      where: { id: ruleId },
      select: { id: true, scope: true, isActive: true },
    });

    if (!rule || rule.scope !== scope) {
      throw new NotFoundException('상벌점 항목을 찾을 수 없습니다.');
    }

    const updated = await this.prisma.mileageRule.update({
      where: { id: rule.id },
      data: { isActive: !rule.isActive },
      select: { isActive: true },
    });

    const label =
      scope === MileageScope.DORM ? '기숙사 상벌점 항목' : '상벌점 항목';

    return {
      ok: true,
      message: updated.isActive
        ? `${label}이 활성화되었습니다.`
        : `${label}이 비활성화되었습니다.`,
      isActive: updated.isActive,
    };
  }

  async getActiveRules(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    const student = await assertStudentExists(
      this.prisma,
      actorStudentId,
      actorSessionId,
    );

    if (scope === MileageScope.DORM && student.school !== School.GBSW) {
      return { rules: [] };
    }

    const rules = await this.prisma.mileageRule.findMany({
      where: { scope, isActive: true },
      orderBy: {
        displayOrder: 'asc',
      },
      select: mileageRuleSummarySelect,
    });

    return {
      rules: rules.map((rule) => mapRuleSummary(rule)),
    };
  }

  private async getNextDisplayOrder(scope: MileageScope) {
    const result = await this.prisma.mileageRule.aggregate({
      where: { scope },
      _max: {
        displayOrder: true,
      },
    });

    return (result._max.displayOrder ?? 0) + 1;
  }

  private async createRuleWithRetry(
    scope: MileageScope,
    input: ReturnType<typeof parseCreateRuleInput>,
  ) {
    const shouldAutoAssign = input.displayOrder === undefined;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const displayOrder =
        input.displayOrder ?? (await this.getNextDisplayOrder(scope));

      try {
        return await this.prisma.mileageRule.create({
          data: {
            scope,
            type: toPrismaMileageType(input.type),
            category: input.category,
            name: input.name,
            defaultScore: input.defaultScore,
            displayOrder,
            minScore: input.minScore ?? null,
            maxScore: input.maxScore ?? null,
          },
          select: mileageRuleSummarySelect,
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
    scope: MileageScope,
    type: ReturnType<typeof toApiMileageType>,
    category: string,
    name: string,
    excludeRuleId?: number,
  ) {
    const duplicatedRule = await this.prisma.mileageRule.findFirst({
      where: {
        scope,
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
