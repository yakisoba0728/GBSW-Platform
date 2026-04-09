import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { DbService } from './db.service';

describe('DbService', () => {
  it('orders paginated table rows by the primary key', async () => {
    const queryRawUnsafe = vi.fn((sql: string) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();

      if (normalized.includes('FROM pg_tables')) {
        return Promise.resolve([{ tablename: 'students' }]);
      }

      if (normalized.includes('FROM information_schema.columns')) {
        return Promise.resolve([
          {
            column_name: 'studentId',
            data_type: 'text',
            is_nullable: 'NO',
          },
          {
            column_name: 'name',
            data_type: 'text',
            is_nullable: 'YES',
          },
        ]);
      }

      if (normalized.includes('PRIMARY KEY')) {
        return Promise.resolve([{ column_name: 'studentId' }]);
      }

      if (normalized.includes('COUNT(*)')) {
        return Promise.resolve([{ count: '2' }]);
      }

      if (normalized.includes('ORDER BY "studentId" ASC LIMIT 20 OFFSET 40')) {
        return Promise.resolve([
          {
            studentId: 'GB260101',
            name: '홍길동',
          },
        ]);
      }

      throw new Error(`unexpected SQL: ${normalized}`);
    });

    const service = new DbService({
      $queryRawUnsafe: queryRawUnsafe,
    } as PrismaService);

    const result = await service.getTableData('students', {
      page: '3',
      limit: '20',
    });

    expect(result.pkColumn).toBe('studentId');
    expect(result.total).toBe(2);
    expect(result.rows).toEqual([['GB260101', '홍길동']]);

    const selectCall = queryRawUnsafe.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        String(sql).replace(/\s+/g, ' ').includes('ORDER BY "studentId" ASC'),
    );

    expect(selectCall).toBeDefined();
    expect(selectCall?.[0]).toContain('LIMIT 20');
    expect(String(selectCall?.[0]).replace(/\s+/g, ' ')).toContain(
      'ORDER BY "studentId" ASC LIMIT 20 OFFSET 40',
    );
  });

  it('throws a sanitized error when raw SQL execution fails', async () => {
    const queryRawUnsafe = vi
      .fn()
      .mockRejectedValue(new Error('relation "secret_table" does not exist'));
    const executeRawUnsafe = vi.fn().mockResolvedValue(0);
    const transaction = vi.fn(
      async (
        callback: (db: {
          $queryRawUnsafe: typeof queryRawUnsafe;
          $executeRawUnsafe: typeof executeRawUnsafe;
        }) => Promise<unknown>,
      ) =>
        callback({
          $queryRawUnsafe: queryRawUnsafe,
          $executeRawUnsafe: executeRawUnsafe,
        }),
    );

    const service = new DbService({
      $transaction: transaction,
    } as PrismaService);

    await expect(
      service.executeQuery({
        sql: 'SELECT * FROM secret_table',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('returns not found when an update affects no rows', async () => {
    const queryRawUnsafe = vi.fn((sql: string) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();

      if (normalized.includes('FROM pg_tables')) {
        return Promise.resolve([{ tablename: 'students' }]);
      }

      if (normalized.includes('FROM information_schema.columns')) {
        return Promise.resolve([
          {
            column_name: 'studentId',
            data_type: 'text',
            is_nullable: 'NO',
          },
          {
            column_name: 'name',
            data_type: 'text',
            is_nullable: 'YES',
          },
        ]);
      }

      if (normalized.includes('PRIMARY KEY')) {
        return Promise.resolve([{ column_name: 'studentId' }]);
      }

      throw new Error(`unexpected SQL: ${normalized}`);
    });
    const executeRawUnsafe = vi.fn().mockResolvedValue(0);
    const transaction = vi.fn(
      async (
        callback: (db: {
          $queryRawUnsafe: typeof queryRawUnsafe;
          $executeRawUnsafe: typeof executeRawUnsafe;
        }) => Promise<unknown>,
      ) =>
        callback({
          $queryRawUnsafe: queryRawUnsafe,
          $executeRawUnsafe: executeRawUnsafe,
        }),
    );

    const service = new DbService({
      $queryRawUnsafe: queryRawUnsafe,
      $transaction: transaction,
    } as PrismaService);

    await expect(
      service.updateRow('students', 'GB260101', {
        column: 'name',
        value: '김철수',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
