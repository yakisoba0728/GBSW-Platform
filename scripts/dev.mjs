import { spawn } from 'node:child_process';
import path from 'node:path';
import { captureCommand, CommandError, loadEnv, rootDir, runCommand } from './env.mjs';

const config = loadEnv();
const children = new Set();
let isShuttingDown = false;
const apiDir = path.join(rootDir, 'apps/api');
const webDir = path.join(rootDir, 'apps/web');

process.on('SIGINT', () => {
  void shutdown(0);
});

process.on('SIGTERM', () => {
  void shutdown(0);
});

try {
  await runCommand('node', ['scripts/prepare-db.mjs']);
  await ensurePortAvailable(config.apiPort, 'API', isStaleApiProcess);
  await ensurePortAvailable(config.webPort, 'Web', isStaleWebProcess);

  startProcess('API', ['start:dev'], apiDir);
  startProcess(
    'Web',
    ['exec', 'next', 'dev', '--port', `${config.webPort}`],
    webDir,
  );

  console.log(`Web: http://localhost:${config.webPort}`);
  console.log(`API: http://localhost:${config.apiPort}`);
  console.log(`pgAdmin: http://localhost:${config.pgAdminPort}`);

  await new Promise(() => {});
} catch (error) {
  console.error(getErrorMessage(error));
  process.exit(1);
}

function startProcess(name, args, cwd) {
  const child = spawn('pnpm', args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
  });

  children.add(child);

  child.once('error', async (error) => {
    console.error(`${name} failed to start`, error);
    await shutdown(1);
  });

  child.once('exit', async (code) => {
    children.delete(child);

    if (isShuttingDown) {
      return;
    }

    console.error(`${name} exited with code ${code ?? 1}`);
    await shutdown(code ?? 1);
  });

  return child;
}

async function ensurePortAvailable(port, label, isStaleProcess) {
  const listeners = await getListeningProcesses(port);

  if (listeners.length === 0) {
    return;
  }

  for (const listener of listeners) {
    if (!isStaleProcess(listener.command)) {
      throw new Error(
        `${label} port ${port} is already in use by pid ${listener.pid}: ${listener.command}`,
      );
    }

    console.log(
      `Stopping stale ${label} process on port ${port} (pid ${listener.pid})...`,
    );
    process.kill(listener.pid, 'SIGTERM');
  }

  await waitForPortRelease(port);
}

async function getListeningProcesses(port) {
  let stdout = '';

  try {
    stdout = await captureCommand('lsof', [
      '-n',
      '-P',
      `-iTCP:${port}`,
      '-sTCP:LISTEN',
      '-t',
    ]);
  } catch (error) {
    if (error instanceof CommandError && error.code === 1) {
      return [];
    }

    throw error;
  }

  const pids = stdout
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value > 0);

  const listeners = [];

  for (const pid of pids) {
    const command = (await captureCommand('ps', ['-p', `${pid}`, '-o', 'command=']))
      .trim();

    if (!command) {
      continue;
    }

    listeners.push({ pid, command });
  }

  return listeners;
}

function isStaleApiProcess(command) {
  return (
    command.includes(`${rootDir}/apps/api/dist/main`) ||
    command.includes(
      `${rootDir}/apps/api/node_modules/.bin/../@nestjs/cli/bin/nest.js start --watch`,
    )
  );
}

function isStaleWebProcess(command) {
  return (
    command.includes(`${rootDir}/apps/web`) &&
    (command.includes('next/dist/bin/next') ||
      command.includes(`${rootDir}/apps/web/server.js`))
  );
}

async function waitForPortRelease(port, timeoutMs = 5_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const listeners = await getListeningProcesses(port);

    if (listeners.length === 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for port ${port} to become available.`);
}

async function shutdown(code) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    child.kill('SIGTERM');
  }

  try {
    await runCommand('docker', ['compose', 'stop', 'db', 'pgadmin']);
  } catch (error) {
    console.error('Failed to stop docker containers cleanly', error);
  }

  process.exit(code);
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to start the development stack.';
}
