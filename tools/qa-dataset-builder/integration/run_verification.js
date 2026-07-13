#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyEnvironment } from './environmentVerifier.js';
import { verifyBuilder } from './builderVerifier.js';
import { verifyApi } from './apiVerifier.js';
import { verifyDataset } from './datasetVerifier.js';
import { verifyPlaywright } from './playwrightVerifier.js';
import { buildIntegrationSummary } from './summary.js';
import { createClient } from '../runtime/httpClient.js';
import { connect, disconnect } from '../utils/db.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..'); // repoRoot/tools/qa-dataset-builder/integration -> ../../.. = repoRoot

async function run() {
  const start = Date.now();
  const logger = console;
  const envRes = verifyEnvironment({ repoRoot, env: process.env, logger });
  const builderRes = verifyBuilder({ repoRoot, logger });

  // API verifier: use backend URL from env or default
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const client = createClient({ baseUrl: backendUrl });
  let apiRes = { ok: false, checks: [], errors: ['not executed'] };
  try {
    apiRes = await verifyApi({ client, logger });
  } catch (e) {
    apiRes = { ok: false, errors: [e.message] };
  }

  // Dataset verifier: attempt read-only DB connection if MONGO_URI present
  let datasetRes = { ok: false, checks: [], error: 'skipped' };
  if (process.env.MONGO_URI) {
    try {
      const dbConn = await connect(process.env.MONGO_URI, { logger });
      datasetRes = await verifyDataset({ dbConnection: dbConn, logger });
      await disconnect();
    } catch (e) {
      datasetRes = { ok: false, error: e.message };
    }
  } else {
    datasetRes = { ok: false, error: 'MONGO_URI not set; dataset verification skipped' };
  }

  const playwrightRes = verifyPlaywright({ repoRoot, logger });

  const summary = buildIntegrationSummary({
    environmentRes: envRes,
    builderRes,
    apiRes,
    datasetRes,
    playwrightRes,
    durationMs: Date.now() - start,
  });

  // Write report
  try {
    const logsDir = path.join(repoRoot, 'tools', 'qa-dataset-builder', 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outPath = path.join(logsDir, `integration-summary-${ts}.json`);
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log('Integration summary written to:', outPath);
  } catch (e) {
    console.error('Failed to write integration summary', e.message);
  }

  // Console summary
  console.log('Integration score:', summary.score);
  console.log('Overall readiness:', summary.ok ? 'READY' : 'NOT READY or WARNINGS');

  // Exit code: fail if critical components failed
  process.exit(summary.ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

