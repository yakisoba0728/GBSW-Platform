import net from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { loadEnv, rootDir } from './env.mjs';

const config = loadEnv();
const composeNetworkName = 'gbsw-platform_default';
const composeContainerNames = ['gbsw-platform-db', 'gbsw-platform-pgadmin'];

class CommandError extends Error {
  constructor(command, args, code, stderr) {
    super(
      stderr || `${command} ${args.join(' ')} exited with code ${code ?? 1}`,
    );

    this.code = code;
  }
}

try {
  await run('docker', ['info'], { stdio: 'ignore' });
} catch {
  console.error('Docker daemon is not running. Start Docker Desktop and run `pnpm dev` again.');
  process.exit(1);
}

try {
  await repairStaleComposeContainers();

  try {
    await run('docker', ['compose', 'up', '-d', 'db', 'pgadmin']);
  } catch (error) {
    const removedStaleContainers = await repairStaleComposeContainers();

    if (!removedStaleContainers) {
      throw error;
    }

    console.warn(
      'Detected stale Docker container metadata. Recreating development containers...',
    );
    await run('docker', ['compose', 'up', '-d', 'db', 'pgadmin']);
  }

  console.log(
    `Waiting for PostgreSQL on ${config.postgresHost}:${config.postgresPort}...`,
  );
  await waitForPort(config.postgresHost, config.postgresPort);
  console.log(`Waiting for pgAdmin on 127.0.0.1:${config.pgAdminPort}...`);
  await waitForPort('127.0.0.1', config.pgAdminPort);
  const pgAdminStorageUser = toPgAdminStorageUserName(config.pgAdminEmail);
  const pgPassFilePath = `/var/lib/pgadmin/storage/${pgAdminStorageUser}/.pgpass`;
  await run('docker', [
    'exec',
    'gbsw-platform-pgadmin',
    'sh',
    '-lc',
    [
      'umask 077',
      `mkdir -p '/var/lib/pgadmin/storage/${pgAdminStorageUser}'`,
      `printf '%s\\n' 'db:5432:${config.postgresDatabase}:${config.postgresUser}:${config.postgresPassword}' > '${pgPassFilePath}'`,
      `chown pgadmin:root '${pgPassFilePath}'`,
      `chmod 600 '${pgPassFilePath}'`,
      'rm -f /var/lib/pgadmin/.pgpass',
    ].join(' && '),
  ]);
  await delay(1_000);
  await run('docker', [
    'exec',
    'gbsw-platform-pgadmin',
    '/venv/bin/python',
    '-W',
    'ignore::SyntaxWarning',
    '/pgadmin4/setup.py',
    'load-servers',
    '/pgadmin4/gbsw-servers.json',
    '--user',
    config.pgAdminEmail,
    '--replace',
  ]);
  await run('pnpm', [
    '--filter',
    '@gbsw/api',
    'exec',
    'prisma',
    'generate',
    '--schema',
    'prisma/schema.prisma',
  ]);
  await run('pnpm', [
    '--filter',
    '@gbsw/api',
    'exec',
    'prisma',
    'migrate',
    'deploy',
    '--schema',
    'prisma/schema.prisma',
  ]);
  console.log('Database services are ready.');
} catch (error) {
  console.error(getErrorMessage(error));
  process.exit(1);
}

async function waitForPort(host, port, timeoutMs = 60_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await tryConnect(host, port);
      return;
    } catch {
      await delay(1_000);
    }
  }

  throw new Error(`Timed out waiting for ${host}:${port}`);
}

function tryConnect(host, port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });

    socket.once('connect', () => {
      socket.end();
      resolve();
    });

    socket.once('error', (error) => {
      socket.destroy();
      reject(error);
    });
  });
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

      reject(new CommandError(command, args, code ?? 1, stderr.trim()));
    });
  });
}

async function repairStaleComposeContainers() {
  const currentNetworkId = await getCurrentComposeNetworkId();
  let removedStaleContainers = false;

  for (const containerName of composeContainerNames) {
    const metadata = await getContainerMetadata(containerName);

    if (!metadata) {
      continue;
    }

    const hasMissingNetworkError =
      metadata.stateError.includes('failed to set up container networking') &&
      metadata.stateError.includes('network') &&
      metadata.stateError.includes('not found');
    const hasOutdatedNetworkReference =
      Boolean(
        currentNetworkId &&
          metadata.networkId &&
          metadata.networkId !== currentNetworkId,
      );

    if (!hasMissingNetworkError && !hasOutdatedNetworkReference) {
      continue;
    }

    console.log(`Removing stale Docker container ${containerName}...`);
    await run('docker', ['rm', '-f', containerName], { stdio: 'ignore' });
    removedStaleContainers = true;
  }

  return removedStaleContainers;
}

async function getCurrentComposeNetworkId() {
  try {
    return await capture('docker', [
      'network',
      'inspect',
      composeNetworkName,
      '--format',
      '{{.Id}}',
    ]);
  } catch (error) {
    if (error instanceof CommandError && error.code === 1) {
      return '';
    }

    throw error;
  }
}

async function getContainerMetadata(containerName) {
  try {
    const [networkId, stateError] = await Promise.all([
      capture('docker', [
        'inspect',
        containerName,
        '--format',
        `{{with index .NetworkSettings.Networks "${composeNetworkName}"}}{{.NetworkID}}{{end}}`,
      ]),
      capture('docker', [
        'inspect',
        containerName,
        '--format',
        '{{.State.Error}}',
      ]),
    ]);

    return { networkId, stateError };
  } catch (error) {
    if (error instanceof CommandError && error.code === 1) {
      return null;
    }

    throw error;
  }
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to prepare the database.';
}

function toPgAdminStorageUserName(value) {
  let normalized = value;

  if (normalized.length === 0 || /^\d/.test(normalized)) {
    normalized = `pga_user_${normalized}`;
  }

  return normalized
    .replaceAll('@', '_')
    .replaceAll('/', 'slash')
    .replaceAll('\\', 'slash');
}
