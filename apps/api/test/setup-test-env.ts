import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const workspaceRoot = path.resolve(__dirname, '../../..');
const envTestPath = path.join(workspaceRoot, '.env.test');

if (fs.existsSync(envTestPath)) {
  dotenv.config({
    path: envTestPath,
    override: true,
    quiet: true,
  });
}

const databaseUrlTest = process.env.DATABASE_URL_TEST?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrlTest) {
  throw new Error(
    'API e2e 테스트를 실행하려면 DATABASE_URL_TEST를 설정하거나 루트 .env.test 파일에 DATABASE_URL_TEST를 정의해주세요.',
  );
}

if (databaseUrl && databaseUrl === databaseUrlTest) {
  throw new Error(
    'DATABASE_URL_TEST는 전용 테스트 데이터베이스를 가리켜야 하며 DATABASE_URL과 같을 수 없습니다.',
  );
}

process.env.DATABASE_URL = databaseUrlTest;
process.env.AUTH_SESSION_SECRET ??= 'test-auth-session-secret';
process.env.SUPER_ADMIN_ID ??= 'test-admin';
process.env.SUPER_ADMIN_PASSWORD ??= 'test-super-admin-password';
process.env.INTERNAL_API_SECRET ??= 'test-internal-api-secret';
