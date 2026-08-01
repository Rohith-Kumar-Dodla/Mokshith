#!/usr/bin/env node
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const backendDir = path.resolve(__dirname, '..', '..', 'b2b-backend');
const frontendDir = path.resolve(__dirname, '..');

function spawnProcess(cmd, args, opts) {
  const p = spawn(cmd, args, { shell: true, stdio: 'inherit', ...opts });
  p.on('error', (err) => {
    console.error(`Failed to start ${cmd} ${args.join(' ')}`, err);
    process.exit(1);
  });
  return p;
}

// Prefer local Redis for Playwright QA so Upstash quota exhaustion cannot block certification.
// dotenv loads .env.qa with override:false — pre-setting REDIS_URL keeps the local target.
const backendEnv = Object.assign({}, process.env, {
  REDIS_URL: process.env.PLAYWRIGHT_REDIS_URL || 'redis://127.0.0.1:6379',
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: process.env.REDIS_PORT || '6379',
  ENABLE_QUEUE: process.env.ENABLE_QUEUE || 'false',
  ENABLE_WORKERS: process.env.ENABLE_WORKERS || 'false',
  // QA Playwright: .env.qa leaves AUTH_STRICT_MODE unset → defaults to true and
  // fraud login caps (5/15m) break late UI logins in long locked suites.
  AUTH_STRICT_MODE: process.env.AUTH_STRICT_MODE || 'false',
});
delete backendEnv.REDIS_PASSWORD;

// Start backend against QA DB so db:seed:qa and Playwright share the same dataset.
console.log('Starting backend (QA) in', backendDir, 'with local Redis for Playwright');
spawnProcess('npm', ['run', 'dev:qa'], { cwd: backendDir, env: backendEnv });

// Start frontend with VITE_API_BASE_URL ensured
const env = Object.assign({}, process.env);
env.VITE_API_BASE_URL = process.env.TEST_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
console.log('Starting frontend in', frontendDir, 'with VITE_API_BASE_URL=', env.VITE_API_BASE_URL);
spawnProcess('npm', ['run', 'dev'], { cwd: frontendDir, env });

// Poll /api/v1/health (GET /api/v1 alone is 404 and must not gate readiness).
const backendCheckUrl = new URL(env.VITE_API_BASE_URL);
const host = backendCheckUrl.hostname || 'localhost';
const port = backendCheckUrl.port || 80;
const pathToCheck = '/api/v1/health';
let seeded = false;

function checkBackend(cb) {
  const options = { hostname: host, port: port, path: pathToCheck, method: 'GET', timeout: 2000 };
  const req = http.request(options, (res) => {
    // Any HTTP response means the server accepted the connection.
    cb(null, res.statusCode);
  });
  req.on('error', (err) => cb(err));
  req.on('timeout', () => {
    req.destroy();
    cb(new Error('timeout'));
  });
  req.end();
}

function waitForBackend(retries = 120) {
  // Never process.exit here: Playwright gates on the frontend URL, and exiting
  // the starter would kill orphaned readiness while children may still be booting.
  if (retries <= 0) {
    console.warn(
      'Backend health not ready after wait window; keeping starter alive for late boot'
    );
    return;
  }
  checkBackend((err, status) => {
    if (!err && status >= 200 && status < 500) {
      console.log(`Backend health responded with status ${status}`);
      if (!seeded) {
        seeded = true;
        try {
          console.log('Seeding QA data...');
          const seed = spawn('npm', ['run', 'db:seed:qa'], {
            shell: true,
            cwd: backendDir,
            stdio: 'inherit',
            env: backendEnv,
          });
          seed.on('close', (code) => {
            if (code !== 0) {
              console.warn('Seeding exited with code', code);
            } else {
              console.log('Seeding completed.');
            }
          });
        } catch (e) {
          console.error('Failed to start seed script', e);
        }
      }
      // keep process alive — both child processes are attached; just wait
    } else {
      if (retries % 10 === 0) {
        console.log(
          `Waiting for backend health... remaining=${retries} err=${err ? err.message : 'none'} status=${status || 'n/a'}`
        );
      }
      setTimeout(() => waitForBackend(retries - 1), 1000);
    }
  });
}

waitForBackend();

// Keep the script running
process.stdin.resume();
