import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import dotenv from 'dotenv';
import {
  captureCommand,
  readRequiredDirectApiOrigin,
  readRequiredEnv,
  readRequiredSecret,
  rootDir,
  runCommand,
} from './env.mjs';

const envFileArgument = process.argv[2] ?? process.env.ENV_FILE ?? '.env.production';
const envFilePath = path.resolve(rootDir, envFileArgument);

if (!fs.existsSync(envFilePath)) {
  console.error(`Environment file not found: ${envFilePath}`);
  process.exit(1);
}

dotenv.config({ path: envFilePath, quiet: true });

const postgresUser = readRequiredEnv('POSTGRES_USER', envFilePath);
const postgresPassword = readRequiredSecret('POSTGRES_PASSWORD', envFilePath);
const postgresDatabase = readRequiredEnv('POSTGRES_DB', envFilePath);
const webPort = requirePort('WEB_PORT');
const pgAdminEmail = readRequiredSecret('PGADMIN_DEFAULT_EMAIL', envFilePath);
readRequiredSecret('PGADMIN_DEFAULT_PASSWORD', envFilePath);
const publicApiUrl = readRequiredDirectApiOrigin(
  'NEXT_PUBLIC_API_URL',
  envFilePath,
);
readRequiredSecret('INTERNAL_API_SECRET', envFilePath);
readRequiredSecret('SUPER_ADMIN_ID', envFilePath);
readRequiredSecret('SUPER_ADMIN_PASSWORD', envFilePath);
const composeArgs = [
  'compose',
  '--env-file',
  path.relative(rootDir, envFilePath),
  '--profile',
  'admin',
  '-f',
  'docker-compose.production.yml',
];

try {
  console.log(`Using production env file: ${path.relative(rootDir, envFilePath)}`);
  console.log(`Validated NEXT_PUBLIC_API_URL: ${publicApiUrl}`);
  console.log(`Validated pgAdmin account: ${pgAdminEmail}`);

  await runCommand('docker', [...composeArgs, 'config', '--quiet'], {
    stdio: 'ignore',
  });
  await runCommand('docker', [...composeArgs, 'build', 'api', 'web']);
  await runCommand('docker', [...composeArgs, 'up', '-d', 'db', 'pgadmin']);

  const dbContainerId = await captureCommand('docker', [...composeArgs, 'ps', '-q', 'db']);
  const pgAdminContainerId = await captureCommand('docker', [
    ...composeArgs,
    'ps',
    '-q',
    'pgadmin',
  ]);
  await waitForHealthyContainer(dbContainerId, 'db');
  await waitForHealthyContainer(pgAdminContainerId, 'pgadmin');

  const sql = `ALTER ROLE ${quoteIdentifier(postgresUser)} WITH PASSWORD ${quoteLiteral(postgresPassword)};`;

  await runCommand('docker', [
    ...composeArgs,
    'exec',
    '-T',
    '--user',
    'postgres',
    'db',
    'psql',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    postgresUser,
    '-d',
    postgresDatabase,
    '-c',
    sql,
  ]);

  console.log('Running Prisma migrate deploy in the api image...');
  await runCommand('docker', [
    ...composeArgs,
    'run',
    '--rm',
    '--no-deps',
    'api',
    './node_modules/.bin/prisma',
    'migrate',
    'deploy',
    '--schema',
    'prisma/schema.prisma',
  ]);

  await runCommand('docker', [...composeArgs, 'up', '-d', 'api', 'web']);

  const apiContainerId = await captureCommand('docker', [
    ...composeArgs,
    'ps',
    '-q',
    'api',
  ]);
  const webContainerId = await captureCommand('docker', [
    ...composeArgs,
    'ps',
    '-q',
    'web',
  ]);

  await waitForHealthyContainer(apiContainerId, 'api');
  await waitForHealthyContainer(webContainerId, 'web');

  console.log('Production deployment completed successfully.');
  console.log(
    `Inspect services with: docker ${composeArgs.join(' ')} ps`,
  );
  console.log(`Web port: ${webPort}`);
  console.log(`pgAdmin port: ${process.env.PGADMIN_PORT ?? '5050'}`);
} catch (error) {
  console.error(getErrorMessage(error));
  process.exit(1);
}

async function waitForHealthyContainer(containerId, label, timeoutMs = 90_000) {
  if (!containerId) {
    throw new Error(`Unable to find ${label} container.`);
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const status = await captureCommand('docker', [
      'inspect',
      '-f',
      '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}',
      containerId,
    ]).catch(() => '');

    if (status === 'healthy' || status === 'running') {
      return;
    }

    if (status === 'unhealthy' || status === 'exited' || status === 'dead') {
      throw new Error(`${label} container became ${status}.`);
    }

    await delay(2_000);
  }

  throw new Error(`Timed out waiting for ${label} container to become healthy.`);
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function quoteLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function requireEnv(name) {
  return readRequiredEnv(name, envFilePath);
}

function requirePort(name) {
  const value = requireEnv(name);
  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`${name} must be a valid port number in ${envFilePath}`);
  }

  return port;
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Production deployment failed.';
}
