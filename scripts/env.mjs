import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

export function resolveDirectApiOrigin(value, sourceName) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${sourceName} must be an absolute URL.`);
  }

  const normalizedPathname = url.pathname.replace(/\/+$/, '') || '/';

  if (normalizedPathname !== '/') {
    throw new Error(
      `${sourceName} must point directly to the Nest API origin and cannot include the path "${normalizedPathname}".`,
    );
  }

  return url.origin;
}

export function readOptionalDirectApiOrigin(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  return resolveDirectApiOrigin(value, name);
}

export function readRequiredDirectApiOrigin(name, envFilePath = envPath) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be set in ${envFilePath}`);
  }

  return resolveDirectApiOrigin(value, name);
}

export function ensureEnvFile() {
  if (fs.existsSync(envPath)) {
    return;
  }

  fs.copyFileSync(envExamplePath, envPath);
  console.log('Created .env from .env.example');
}

export function loadEnv() {
  ensureEnvFile();
  dotenv.config({ path: envPath, quiet: true });

  const apiInternalUrl = readOptionalDirectApiOrigin('API_INTERNAL_URL');
  const publicApiUrl = readOptionalDirectApiOrigin('NEXT_PUBLIC_API_URL');

  return {
    apiPort: parsePort('API_PORT', 3001),
    apiInternalUrl,
    envPath,
    pgAdminEmail: process.env.PGADMIN_DEFAULT_EMAIL ?? 'admin@gbsw.com',
    pgAdminPort: parsePort('PGADMIN_PORT', 5050),
    postgresDatabase: process.env.POSTGRES_DB ?? 'gbsw_platform',
    postgresHost: process.env.POSTGRES_HOST ?? '127.0.0.1',
    postgresPassword: process.env.POSTGRES_PASSWORD ?? 'gbsw',
    postgresPort: parsePort('POSTGRES_PORT', 5432),
    postgresUser: process.env.POSTGRES_USER ?? 'gbsw',
    publicApiUrl,
    webPort: parsePort('WEB_PORT', 3000),
  };
}

function parsePort(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? `${fallback}`, 10);

  if (Number.isNaN(value)) {
    throw new Error(`${name} must be a valid number`);
  }

  return value;
}
