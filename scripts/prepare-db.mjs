import path from 'node:path';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import {
  captureCommand,
  loadEnv,
  rootDir,
  runCommand,
  CommandError,
} from './env.mjs';

const config = loadEnv();
const composeProjectName =
  process.env.COMPOSE_PROJECT_NAME?.trim() ||
  path.basename(rootDir).toLowerCase().replace(/[^a-z0-9_-]/g, '');
const composeNetworkName = `${composeProjectName}_default`;
const composeContainerNames = [
  'gbsw-platform-db',
  'gbsw-platform-pgadmin',
];
const pgAdminContainerName = 'gbsw-platform-pgadmin';
const pgAdminDataVolumeName = `${composeProjectName}_pgadmin-data`;

try {
  await runCommand('docker', ['info'], { stdio: 'ignore' });
} catch {
  console.error('Docker daemon is not running. Start Docker Desktop and run `pnpm dev` again.');
  process.exit(1);
}

try {
  await repairStaleComposeContainers();

  try {
    await runCommand('docker', ['compose', 'up', '-d', 'db', 'pgadmin']);
  } catch (error) {
    const removedStaleContainers = await repairStaleComposeContainers();

    if (!removedStaleContainers) {
      throw error;
    }

    console.warn(
      'Detected stale Docker container metadata. Recreating development containers...',
    );
    await runCommand('docker', ['compose', 'up', '-d', 'db', 'pgadmin']);
  }

  console.log(
    `Waiting for PostgreSQL on ${config.postgresHost}:${config.postgresPort}...`,
  );
  await waitForPort(config.postgresHost, config.postgresPort);
  console.log(`Waiting for pgAdmin on 127.0.0.1:${config.pgAdminPort}...`);
  await waitForPort('127.0.0.1', config.pgAdminPort);
  await writePgAdminPasswordFile();
  await delay(1_000);
  await ensurePgAdminServersLoaded();
  await runCommand('pnpm', [
    '--filter',
    '@gbsw/api',
    'exec',
    'prisma',
    'generate',
    '--schema',
    'prisma/schema.prisma',
  ]);
  await runCommand('pnpm', [
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

async function ensurePgAdminServersLoaded() {
  try {
    await loadPgAdminServers();
  } catch (error) {
    const message = getErrorMessage(error);

    if (!message.includes('The specified user ID')) {
      throw error;
    }

    console.warn(
      `pgAdmin storage does not contain ${config.pgAdminEmail}. Recreating pgAdmin data...`,
    );
    await recreatePgAdminData();
    await waitForPort('127.0.0.1', config.pgAdminPort);
    await writePgAdminPasswordFile();
    await delay(1_000);
    await loadPgAdminServers();
  }
}

async function loadPgAdminServers() {
  const output = await captureCommand('docker', [
    'exec',
    pgAdminContainerName,
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

  if (output) {
    console.log(output);
  }
}

async function recreatePgAdminData() {
  await runCommand('docker', ['rm', '-f', pgAdminContainerName], { stdio: 'ignore' });
  await runCommand('docker', ['volume', 'rm', '-f', pgAdminDataVolumeName], {
    stdio: 'ignore',
  });
  await runCommand('docker', ['compose', 'up', '-d', 'pgadmin']);
}

async function writePgAdminPasswordFile() {
  const pgAdminStorageUser = toPgAdminStorageUserName(config.pgAdminEmail);
  const pgPassFilePath = `/var/lib/pgadmin/storage/${pgAdminStorageUser}/.pgpass`;

  await runCommand('docker', [
    'exec',
    pgAdminContainerName,
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
    await runCommand('docker', ['rm', '-f', containerName], { stdio: 'ignore' });
    removedStaleContainers = true;
  }

  return removedStaleContainers;
}

async function getCurrentComposeNetworkId() {
  try {
    return await captureCommand('docker', [
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
      captureCommand('docker', [
        'inspect',
        containerName,
        '--format',
        `{{with index .NetworkSettings.Networks "${composeNetworkName}"}}{{.NetworkID}}{{end}}`,
      ]),
      captureCommand('docker', [
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
