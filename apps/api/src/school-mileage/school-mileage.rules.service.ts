import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertTeacherExists } from './school-mileage.access';
import { toApiMileageType } from './school-mileage.mappers';

@Injectable()
export class SchoolMileageRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRules(actorTeacherId: string | undefined) {
    await assertTeacherExists(this.prisma, actorTeacherId);

    const rules = await this.prisma.schoolMileageRule.findMany({
      where: {
        isActive: true,
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
        id: rule.id,
        type: toApiMileageType(rule.type),
        category: rule.category,
        name: rule.name,
        defaultScore: rule.defaultScore,
        displayOrder: rule.displayOrder,
        isActive: rule.isActive,
      })),
    };
  }
}
