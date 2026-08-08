/**
 * Local capacity probe for V1.1 readiness (NOT a 10k-user certification).
 *
 * Usage (backend must be running locally):
 *   node scripts/load/v1-capacity-probe.mjs
 *   BASE_URL=http://127.0.0.1:5000 CONCURRENCY=50 DURATION_SEC=20 node scripts/load/v1-capacity-probe.mjs
 *
 * Measures health + unauthenticated CSRF endpoint latency only.
 * Does not hit payment/order mutations.
 */
import http from 'http';
import https from 'https';
import { URL } from 'url';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';
const CONCURRENCY = Number(process.env.CONCURRENCY || 25);
const DURATION_SEC = Number(process.env.DURATION_SEC || 15);
const PATHS = (process.env.PATHS || '/health/live,/api/v1/auth/csrf-token').split(',');

function request(pathname) {
  const url = new URL(pathname, BASE_URL);
  const lib = url.protocol === 'https:' ? https : http;
  const started = Date.now();

  return new Promise((resolve) => {
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 10000,
        headers: { Connection: 'keep-alive' },
      },
      (res) => {
        res.resume();
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            ms: Date.now() - started,
          });
        });
      }
    );
    req.on('error', () => resolve({ ok: false, status: 0, ms: Date.now() - started }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, ms: Date.now() - started });
    });
    req.end();
  });
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function worker(endAt, samples) {
  while (Date.now() < endAt) {
    const path = PATHS[Math.floor(Math.random() * PATHS.length)];
    const result = await request(path.trim());
    samples.push(result);
  }
}

const samples = [];
const endAt = Date.now() + DURATION_SEC * 1000;
const started = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(endAt, samples)));
const elapsedSec = (Date.now() - started) / 1000;

const latencies = samples.map((s) => s.ms).sort((a, b) => a - b);
const ok = samples.filter((s) => s.ok).length;
const fail = samples.length - ok;
const statusBuckets = samples.reduce((acc, s) => {
  const key = String(s.status);
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const report = {
  baseUrl: BASE_URL,
  concurrency: CONCURRENCY,
  durationSec: DURATION_SEC,
  paths: PATHS,
  totalRequests: samples.length,
  rps: Number((samples.length / elapsedSec).toFixed(2)),
  successRate: Number(((ok / samples.length) * 100).toFixed(2)),
  errorRate: Number(((fail / samples.length) * 100).toFixed(2)),
  p50: percentile(latencies, 50),
  p95: percentile(latencies, 95),
  p99: percentile(latencies, 99),
  statusBuckets,
  note: 'Local relative capacity only. Does NOT prove 10k concurrent authenticated users.',
};

console.log(JSON.stringify(report, null, 2));
