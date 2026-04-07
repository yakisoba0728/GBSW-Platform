import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import dotenv from 'dotenv';
import { rootDir } from './env.mjs';

const envFileArgument = process.argv[2] ?? process.env.ENV_FILE ?? '.env.production';
const envFilePath = path.resolve(rootDir, envFileArgument);

if (!fs.existsSync(envFilePath)) {
  console.error(`Environment file not found: ${envFilePath}`);
  process.exit(1);
}

dotenv.config({ path: envFilePath, quiet: true });

const postgresUser = requireEnv('POSTGRES_USER');
const postgresPassword = requireEnv('POSTGRES_PASSWORD');
const composeArgs = [
  'compose',
  '--env-file',
  path.relative(rootDir, envFilePath),
  '-f',
  'docker-compose.production.yml',
];
const composeParallelArgs = [
  'compose',
  '--parallel',
  '2',
  '--env-file',
  path.relative(rootDir, envFilePath),
  '-f',
  'docker-compose.production.yml',
];
const applicationServices = ['api', 'web'];

try {
  await run('docker', [...composeArgs, 'up', '-d', 'db']);

  const dbContainerId = await capture('docker', [...composeArgs, 'ps', '-q', 'db']);
  const pullResultsPromise = attemptImagePulls();
  await waitForHealthyContainer(dbContainerId, 'db');

  const sql = `ALTER ROLE ${quoteIdentifier(postgresUser)} WITH PASSWORD ${quoteLiteral(postgresPassword)};`;

  await run('docker', [
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
    process.env.POSTGRES_DB ?? 'postgres',
    '-c',
    sql,
  ]);

  const pullResults = await pullResultsPromise;
  const servicesToBuild = applicationServices.filter((service) => !pullResults[service]);

  if (servicesToBuild.length > 0) {
    console.warn(`Falling back to local image builds for: ${servicesToBuild.join(', ')}.`);
    await run('docker', [...composeParallelArgs, 'build', ...servicesToBuild]);
  }

  await run('docker', [...composeArgs, 'up', '-d', '--no-build', ...applicationServices]);

  const apiContainerId = await capture('docker', [...composeArgs, 'ps', '-q', 'api']);
  const webContainerId = await capture('docker', [...composeArgs, 'ps', '-q', 'web']);

  await waitForHealthyContainer(apiContainerId, 'api');
  await waitForHealthyContainer(webContainerId, 'web');

  console.log('Production deployment completed successfully.');
  console.log(
    `Inspect services with: docker ${composeArgs.join(' ')} ps`,
  );
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
    const status = await capture('docker', [
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
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be set in ${envFilePath}`);
  }

  return value;
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Production deployment failed.';
}

async function attemptImagePulls() {
  const results = Object.fromEntries(applicationServices.map((service) => [service, false]));

  for (const service of applicationServices) {
    try {
      await run('docker', [...composeArgs, 'pull', service]);
      results[service] = true;
    } catch (error) {
      console.warn(`Image pull skipped for ${service}: ${getErrorMessage(error)}`);
    }
  }

  return results;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
      stdio: options.stdio ?? 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`${command} ${args.join(' ')} exited with code ${code ?? 1}`),
      );
    });
  });
}

function capture(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
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
        new Error(stderr.trim() || `${command} ${args.join(' ')} exited with code ${code ?? 1}`),
      );
    });
  });
}
