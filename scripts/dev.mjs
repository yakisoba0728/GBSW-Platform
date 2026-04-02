import { spawn } from 'node:child_process';
import path from 'node:path';
import { loadEnv, rootDir } from './env.mjs';

const config = loadEnv();
const children = new Set();
let isShuttingDown = false;
const apiDir = path.join(rootDir, 'apps/api');
const webDir = path.join(rootDir, 'apps/web');

class CommandError extends Error {
  constructor(command, args, code, stderr) {
    super(
      stderr || `${command} ${args.join(' ')} exited with code ${code ?? 1}`,
    );

    this.code = code;
  }
}

process.on('SIGINT', () => {
  void shutdown(0);
});

process.on('SIGTERM', () => {
  void shutdown(0);
});

try {
  await run('node', ['scripts/prepare-db.mjs']);
  await ensureApiPortAvailable();

  startProcess('API', ['start:dev'], apiDir);
  startProcess(
    'Web',
    ['exec', 'next', 'dev', '--webpack', '--port', `${config.webPort}`],
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

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit',
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

async function ensureApiPortAvailable() {
  const listeners = await getListeningProcesses(config.apiPort);

  if (listeners.length === 0) {
    return;
  }

  for (const listener of listeners) {
    if (!isStaleApiProcess(listener.command)) {
      throw new Error(
        `API port ${config.apiPort} is already in use by pid ${listener.pid}: ${listener.command}`,
      );
    }

    console.log(
      `Stopping stale API process on port ${config.apiPort} (pid ${listener.pid})...`,
    );
    process.kill(listener.pid, 'SIGTERM');
  }

  await waitForPortRelease(config.apiPort);
}

async function getListeningProcesses(port) {
  let stdout = '';

  try {
    stdout = await capture('lsof', [
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
    const command = (await capture('ps', ['-p', `${pid}`, '-o', 'command=']))
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
        resolve(stdout);
        return;
      }

      reject(new CommandError(command, args, code ?? 1, stderr.trim()));
    });
  });
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
    await run('docker', ['compose', 'stop', 'db', 'pgadmin']);
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
