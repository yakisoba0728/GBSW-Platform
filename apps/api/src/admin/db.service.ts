import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EXCLUDED_TABLES = ['_prisma_migrations'];
const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;
const QUERY_TIMEOUT_MS = 5_000;

type DbTxClient = Pick<PrismaService, '$executeRawUnsafe' | '$queryRawUnsafe'>;

@Injectable()
export class DbService {
  private readonly logger = new Logger(DbService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTables() {
    try {
      const rows = await this.prisma.$queryRawUnsafe<{ tablename: string }[]>(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
      );
      const tables = rows
        .map((r) => r.tablename)
        .filter((t) => !EXCLUDED_TABLES.includes(t));
      return { tables };
    } catch {
      throw new InternalServerErrorException(
        '테이블 목록을 불러오지 못했습니다.',
      );
    }
  }

  async getTableData(tableName: string, query: Record<string, unknown>) {
    const normalizedTableName = normalizeIdentifier(tableName);
    await this.assertTableExists(normalizedTableName);

    const page = readPositiveInt(query.page) ?? 1;
    const limit = Math.min(
      readPositiveInt(query.limit) ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const offset = (page - 1) * limit;

    if (!Number.isInteger(limit) || !Number.isInteger(offset)) {
      throw new BadRequestException('페이지 또는 제한 값이 유효하지 않습니다.');
    }

    try {
      const columns = await this.getTableColumns(normalizedTableName);
      const pkColumn = await this.getPrimaryKeyColumn(normalizedTableName);

      const totalRows = await this.prisma.$queryRawUnsafe<{ count: string }[]>(
        `SELECT COUNT(*) as count FROM ${quoteIdentifier(normalizedTableName)}`,
      );
      const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT * FROM ${quoteIdentifier(normalizedTableName)}
         ORDER BY ${quoteIdentifier(pkColumn)} ASC
         LIMIT ${limit} OFFSET ${offset}`,
      );

      return {
        columns,
        pkColumn,
        rows: rows.map((r) => columns.map((c) => r[c.name])),
        total: parseInt(totalRows[0]?.count ?? '0', 10),
      };
    } catch (error) {
      this.throwSafeDbError(error, '테이블 데이터를 불러오지 못했습니다.');
    }
  }

  async updateRow(
    tableName: string,
    rowId: string,
    body: Record<string, unknown>,
  ) {
    const normalizedTableName = normalizeIdentifier(tableName);
    await this.assertTableExists(normalizedTableName);

    const column =
      typeof body.column === 'string' ? normalizeIdentifier(body.column) : null;
    if (!column) throw new BadRequestException('column 필드가 필요합니다.');

    const columns = await this.getTableColumns(normalizedTableName);
    if (!columns.some((c) => c.name === column)) {
      throw new BadRequestException('존재하지 않는 컬럼입니다.');
    }

    const pkColumn = await this.getPrimaryKeyColumn(normalizedTableName);

    try {
      const affectedRows = await this.withQueryTimeout((db) =>
        db.$executeRawUnsafe(
          `UPDATE ${quoteIdentifier(normalizedTableName)}
           SET ${quoteIdentifier(column)} = $1
           WHERE ${quoteIdentifier(pkColumn)} = $2`,
          body.value,
          rowId,
        ),
      );

      if (affectedRows === 0) {
        throw new NotFoundException('해당 행을 찾을 수 없습니다.');
      }

      return { success: true };
    } catch (error) {
      this.throwSafeDbError(error, '행 수정에 실패했습니다.');
    }
  }

  async deleteRow(tableName: string, rowId: string) {
    const normalizedTableName = normalizeIdentifier(tableName);
    await this.assertTableExists(normalizedTableName);

    const pkColumn = await this.getPrimaryKeyColumn(normalizedTableName);

    try {
      const affected = await this.withQueryTimeout((db) =>
        db.$executeRawUnsafe(
          `DELETE FROM ${quoteIdentifier(normalizedTableName)}
           WHERE ${quoteIdentifier(pkColumn)} = $1`,
          rowId,
        ),
      );

      if (affected === 0) {
        throw new NotFoundException('해당 행을 찾을 수 없습니다.');
      }

      return { success: true };
    } catch (error) {
      this.throwSafeDbError(error, '행 삭제에 실패했습니다.');
    }
  }

  async executeQuery(body: Record<string, unknown>) {
    const sql = typeof body.sql === 'string' ? body.sql.trim() : '';
    if (!sql) throw new BadRequestException('SQL 쿼리를 입력해주세요.');

    try {
      const result = await this.withQueryTimeout((db) =>
        db.$queryRawUnsafe<Record<string, unknown>[]>(sql),
      );
      if (Array.isArray(result) && result.length > 0) {
        const columns = Object.keys(result[0]);
        return { columns, rows: result.map((r) => columns.map((c) => r[c])) };
      }
      // DML returns count
      return { rowsAffected: typeof result === 'bigint' ? Number(result) : 0 };
    } catch (error) {
      this.logger.warn(`Admin DB query failed: ${sql.slice(0, 120)}`);
      this.throwSafeDbError(error, 'SQL 실행에 실패했습니다.');
    }
  }

  private async assertTableExists(tableName: string) {
    const { tables } = await this.getTables();
    if (!tables.includes(tableName)) {
      throw new NotFoundException('존재하지 않는 테이블입니다.');
    }
  }

  private async getTableColumns(tableName: string) {
    try {
      const rows = await this.prisma.$queryRawUnsafe<
        { column_name: string; data_type: string; is_nullable: string }[]
      >(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        tableName,
      );
      return rows.map((r) => ({
        name: r.column_name,
        type: r.data_type,
        nullable: r.is_nullable === 'YES',
      }));
    } catch {
      throw new InternalServerErrorException(
        '테이블 컬럼 정보를 불러오지 못했습니다.',
      );
    }
  }

  private async getPrimaryKeyColumn(tableName: string) {
    try {
      const rows = await this.prisma.$queryRawUnsafe<{ column_name: string }[]>(
        `SELECT c.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.constraint_column_usage c ON tc.constraint_name = c.constraint_name AND c.table_schema = tc.table_schema
         WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1 AND tc.table_schema = 'public'
         LIMIT 1`,
        tableName,
      );
      if (!rows[0]) {
        throw new BadRequestException(
          '해당 테이블에 기본 키가 없어 행 편집을 지원하지 않습니다.',
        );
      }
      return rows[0].column_name;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '기본 키 정보를 불러오지 못했습니다.',
      );
    }
  }

  private async withQueryTimeout<T>(operation: (db: DbTxClient) => Promise<T>) {
    return this.prisma.$transaction(async (db) => {
      await db.$executeRawUnsafe(
        `SET LOCAL statement_timeout = '${QUERY_TIMEOUT_MS}ms'`,
      );
      return operation(db as DbTxClient);
    });
  }

  private throwSafeDbError(error: unknown, fallbackMessage: string): never {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    throw new InternalServerErrorException(fallbackMessage);
  }
}

function readPositiveInt(value: unknown) {
  const n =
    typeof value === 'string'
      ? parseInt(value, 10)
      : typeof value === 'number'
        ? value
        : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeIdentifier(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new BadRequestException('식별자가 비어 있습니다.');
  }

  return normalized;
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}
