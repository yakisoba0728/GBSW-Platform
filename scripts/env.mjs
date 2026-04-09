import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

export class CommandError extends Error {
  constructor(command, args, code, stderr) {
    super(stderr || `${command} ${args.join(' ')} exited with code ${code ?? 1}`);

    this.code = code;
  }
}

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
  const value = readOptionalEnv(name);

  if (!value) {
    return undefined;
  }

  return resolveDirectApiOrigin(value, name);
}

export function readRequiredDirectApiOrigin(name, envFilePath = envPath) {
  const value = readRequiredEnv(name, envFilePath);

  return resolveDirectApiOrigin(value, name);
}

export function readOptionalEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  return value;
}

export function readRequiredEnv(name, envFilePath = envPath) {
  const value = readOptionalEnv(name);

  if (!value) {
    throw new Error(`${name} must be set in ${envFilePath}`);
  }

  return value;
}

export function readRequiredSecret(name, envFilePath = envPath) {
  const value = readRequiredEnv(name, envFilePath);

  if (
    /^(change-me|change-this|replace-me)\b/i.test(value) ||
    /^admin@example\.com$/i.test(value)
  ) {
    throw new Error(`${name} must be replaced with a real secret in ${envFilePath}`);
  }

  return value;
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
    pgAdminEmail: readRequiredEnv('PGADMIN_DEFAULT_EMAIL'),
    pgAdminPassword: readRequiredEnv('PGADMIN_DEFAULT_PASSWORD'),
    pgAdminPort: parsePort('PGADMIN_PORT', 5050),
    postgresDatabase: readRequiredEnv('POSTGRES_DB'),
    postgresHost: process.env.POSTGRES_HOST ?? '127.0.0.1',
    postgresPassword: readRequiredEnv('POSTGRES_PASSWORD'),
    postgresPort: parsePort('POSTGRES_PORT', 5432),
    postgresUser: readRequiredEnv('POSTGRES_USER'),
    publicApiUrl,
    webPort: parsePort('WEB_PORT', 3000),
  };
}

export function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? rootDir,
      env: options.env ?? process.env,
      stdio: options.stdio ?? 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new CommandError(command, args, code ?? 1, options.stderr ?? ''));
    });
  });
}

export function captureCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? rootDir,
      env: options.env ?? process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(
        new CommandError(command, args, code ?? 1, (stderr || stdout).trim()),
      );
    });
  });
}

function parsePort(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? `${fallback}`, 10);

  if (Number.isNaN(value)) {
    throw new Error(`${name} must be a valid number`);
  }

  return value;
}
