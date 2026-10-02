#!/usr/bin/env node
const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');

const backendDir = path.resolve(__dirname, '..', '..', 'b2b-backend');
const frontendDir = path.resolve(__dirname, '..');

function spawnProcess(cmd, args, opts) {
  const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
  child.on('error', (error) => {
    console.error(`Failed to start ${cmd} ${args.join(' ')}`, error);
    process.exit(1);
  });
  return child;
}

function spawnNpm(args, opts) {
  if (process.platform === 'win32') {
    return spawnProcess(process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe', [
      '/d',
      '/s',
      '/c',
      'npm.cmd',
      ...args,
    ], opts);
  }
  return spawnProcess('npm', args, opts);
}

// Keep background processing disabled during browser certification. Redis itself
// comes from the isolated .env.qa environment and remains part of readiness.
const backendEnv = Object.assign({}, process.env, {
  ENABLE_QUEUE: process.env.ENABLE_QUEUE || 'false',
  ENABLE_WORKERS: process.env.ENABLE_WORKERS || 'false',
  AUTH_STRICT_MODE: process.env.AUTH_STRICT_MODE || 'false',
});

const frontendEnv = Object.assign({}, process.env);
frontendEnv.VITE_API_BASE_URL =
  process.env.TEST_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api/v1';

let frontendStarted = false;
function startFrontend() {
  if (frontendStarted) return;
  frontendStarted = true;
  console.log(
    'Starting frontend in',
    frontendDir,
    'with VITE_API_BASE_URL=',
    frontendEnv.VITE_API_BASE_URL
  );
  spawnNpm(['run', 'dev'], { cwd: frontendDir, env: frontendEnv });
}

const backendCheckUrl = new URL(frontendEnv.VITE_API_BASE_URL);
const host = backendCheckUrl.hostname || 'localhost';
const port = backendCheckUrl.port || 80;
const readinessPath = '/api/v1/health/ready';

function checkBackend(callback) {
  const request = http.request(
    { hostname: host, port, path: readinessPath, method: 'GET', timeout: 2000 },
    (response) => callback(null, response.statusCode)
  );
  request.on('error', (error) => callback(error));
  request.on('timeout', () => {
    request.destroy();
    callback(new Error('timeout'));
  });
  request.end();
}

function waitForBackend(retries = 120) {
  if (retries <= 0) {
    console.warn('Backend readiness not available after wait window; continuing checks');
    setTimeout(() => waitForBackend(30), 1000);
    return;
  }

  checkBackend((error, status) => {
    if (!error && status === 200) {
      console.log(`Backend readiness responded with status ${status}`);
      startFrontend();
      return;
    }

    if (retries % 10 === 0) {
      console.log(
        `Waiting for backend readiness... remaining=${retries} error=${
          error ? error.message : 'none'
        } status=${status || 'n/a'}`
      );
    }
    setTimeout(() => waitForBackend(retries - 1), 1000);
  });
}

function isPortOccupied(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

async function prepareQaEnvironment() {
  const ports = [Number(port), 5173];
  const occupied = (
    await Promise.all(ports.map(async (candidate) => [candidate, await isPortOccupied(candidate)]))
  )
    .filter(([, inUse]) => inUse)
    .map(([candidate]) => candidate);

  if (occupied.length > 0) {
    console.error(
      `Refusing to reuse stale QA services. Stop the listeners on port(s): ${occupied.join(', ')}`
    );
    process.exit(1);
  }

  console.log('Seeding deterministic QA data before backend startup...');
  const seed = spawnNpm(['run', 'db:seed:qa'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: backendEnv,
  });

  seed.on('error', (error) => {
    console.error('Failed to start QA seed process', error);
    process.exit(1);
  });
  seed.on('close', (code) => {
    if (code !== 0) {
      console.error('QA seeding exited with code', code);
      process.exit(code || 1);
    }

    console.log('QA seeding completed. Starting backend in', backendDir);
    spawnNpm(['run', 'dev:qa'], { cwd: backendDir, env: backendEnv });
    waitForBackend();
  });
}

prepareQaEnvironment();
process.stdin.resume();
