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

// Start backend against QA DB so db:seed:qa and Playwright share the same dataset.
console.log('Starting backend (QA) in', backendDir);
spawnProcess('npm', ['run', 'dev:qa'], { cwd: backendDir, env: process.env });

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

function waitForBackend(retries = 60) {
  if (retries <= 0) {
    console.error('Backend did not become ready in time');
    process.exit(1);
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
            env: process.env,
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
      setTimeout(() => waitForBackend(retries - 1), 1000);
    }
  });
}

waitForBackend();

// Keep the script running
process.stdin.resume();
