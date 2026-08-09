#!/usr/bin/env node
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// tools/ → ME/ → Production/ → b2b-backend
const backendDir = path.resolve(__dirname, '..', '..', 'b2b-backend');
const frontendDir = path.resolve(__dirname, '..');

function spawnProcess(cmdLine, opts) {
  const p = spawn(cmdLine, {
    shell: true,
    stdio: 'inherit',
    ...opts,
  });
  p.on('error', (err) => {
    console.error(`Failed to start ${cmdLine}`, err);
    process.exit(1);
  });
  return p;
}

function checkHttp(url, cb) {
  const target = new URL(url);
  const options = {
    hostname: target.hostname || 'localhost',
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    path: target.pathname || '/',
    method: 'GET',
    timeout: 2000,
  };
  const req = http.request(options, (res) => {
    res.resume();
    cb(null, res.statusCode);
  });
  req.on('error', (err) => cb(err));
  req.on('timeout', () => {
    req.destroy();
    cb(new Error('timeout'));
  });
  req.end();
}

function waitFor(url, label, retries = 90) {
  return new Promise((resolve, reject) => {
    const attempt = (left) => {
      if (left <= 0) {
        reject(new Error(`${label} did not become ready: ${url}`));
        return;
      }
      checkHttp(url, (err, status) => {
        if (!err && status) {
          console.log(`${label} ready (HTTP ${status})`);
          resolve(status);
          return;
        }
        setTimeout(() => attempt(left - 1), 1000);
      });
    };
    attempt(retries);
  });
}

async function main() {
  const apiBase =
    process.env.TEST_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    'http://localhost:5000/api/v1';
  const backendLiveUrl = 'http://localhost:5000/health/live';

  console.log('Starting backend in', backendDir);
  spawnProcess('npm run dev', { cwd: backendDir, env: process.env });

  await waitFor(backendLiveUrl, 'Backend');

  try {
    console.log('Seeding QA data...');
    const seed = spawn('npm run db:seed:qa', {
      shell: true,
      cwd: backendDir,
      stdio: 'inherit',
      env: process.env,
    });
    await new Promise((resolve) => seed.on('close', resolve));
  } catch (e) {
    console.error('Failed to start seed script', e);
  }

  const env = Object.assign({}, process.env);
  env.VITE_API_BASE_URL = apiBase;
  console.log('Starting frontend in', frontendDir, 'with VITE_API_BASE_URL=', env.VITE_API_BASE_URL);
  spawnProcess('npm run dev', { cwd: frontendDir, env });

  await waitFor('http://localhost:5173', 'Frontend');
  console.log('Dev stack ready for Playwright.');
  process.stdin.resume();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
