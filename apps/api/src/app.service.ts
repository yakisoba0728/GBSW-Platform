import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'GBSW Platform API is running.';
  }

  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        database: 'ok',
        message: this.getHello(),
      };
    } catch {
      throw new ServiceUnavailableException(
        '데이터베이스 연결을 확인하지 못했습니다.',
      );
    }
  }
}
