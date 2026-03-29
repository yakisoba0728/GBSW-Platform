import net from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { loadEnv, rootDir } from './env.mjs';

const config = loadEnv();

try {
  await run('docker', ['info'], { stdio: 'ignore' });
} catch {
  console.error('Docker daemon is not running. Start Docker Desktop and run `pnpm dev` again.');
  process.exit(1);
}

try {
  await run('docker', ['compose', 'up', '-d', 'db']);
  console.log(
    `Waiting for PostgreSQL on ${config.postgresHost}:${config.postgresPort}...`,
  );
  await waitForPort(config.postgresHost, config.postgresPort);
  console.log('Database is ready.');
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

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to prepare the database.';
}
