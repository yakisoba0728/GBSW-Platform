import { spawn } from 'node:child_process';
import path from 'node:path';
import { loadEnv, rootDir } from './env.mjs';

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
  await run('node', ['scripts/prepare-db.mjs']);

  startProcess('API', ['start:dev'], apiDir);
  startProcess(
    'Web',
    ['exec', 'next', 'dev', '--port', `${config.webPort}`],
    webDir,
  );
  startProcess(
    'Prisma Studio',
    ['exec', 'prisma', 'studio', '--schema', 'prisma/schema.prisma', '--port', `${config.studioPort}`],
    apiDir,
  );

  console.log(`Web: http://localhost:${config.webPort}`);
  console.log(`API: http://localhost:${config.apiPort}`);
  console.log(`Prisma Studio: http://localhost:${config.studioPort}`);

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

async function shutdown(code) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    child.kill('SIGTERM');
  }

  try {
    await run('docker', ['compose', 'stop', 'db']);
  } catch (error) {
    console.error('Failed to stop db container cleanly', error);
  }

  process.exit(code);
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to start the development stack.';
}
