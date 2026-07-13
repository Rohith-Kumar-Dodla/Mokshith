#!/usr/bin/env node
/**
 * Idempotent DB initialization script.
 * - Ensures indexes for all Mongoose models
 * - Inserts baseline system settings and feature flags (non-destructive)
 *
 * Safety:
 * - Will abort if connected database name is "mokshith-production"
 */
import connectDB, { getActiveDatabaseName } from '../../src/config/db.js';
import mongoose from 'mongoose';
import { getAppDatabaseName } from '../../src/config/environmentResolver.js';
import { updateSetting } from '../../src/modules/settings/settings.service.js';
import { logger } from '../../src/config/logger.js';
import fs from 'fs';
import path from 'path';

// Dynamically import all model files so mongoose.modelNames() is populated.
import { pathToFileURL } from 'url';

async function importAllModels() {
  const modulesDir = path.join(process.cwd(), 'src', 'modules');
  const modelsDir = path.join(process.cwd(), 'src', 'models');
  const files = [];

  function collect(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collect(full);
      } else if (entry.isFile() && entry.name.endsWith('.model.js')) {
        files.push(full);
      }
    }
  }

  collect(modulesDir);
  if (fs.existsSync(modelsDir)) {
    for (const f of fs.readdirSync(modelsDir)) {
      if (f.endsWith('.js')) files.push(path.join(modelsDir, f));
    }
  }

  for (const f of files) {
    try {
      // Convert filesystem path to file:// URL for dynamic import cross-platform
      // eslint-disable-next-line no-await-in-loop
      await import(pathToFileURL(f).href);
      logger.info(`Imported model file: ${f}`);
    } catch (err) {
      logger.warn(`Failed to import model file ${f}: ${err.message}`);
    }
  }
}

async function ensureIndexes() {
  const modelNames = mongoose.modelNames();
  for (const name of modelNames) {
    try {
      const model = mongoose.model(name);
      if (typeof model.createIndexes === 'function') {
        logger.info(`Ensuring indexes for model: ${name}`);
        await model.createIndexes();
      }
    } catch (err) {
      logger.warn(`Failed to ensure indexes for ${name}: ${err.message}`);
    }
  }
}

async function upsertBaselineSettings() {
  logger.info('Upserting baseline settings...');
  const defaults = [
    { key: 'siteName', value: 'Mokshith B2B Platform' },
    { key: 'supportEmail', value: 'support@example.com' },
    { key: 'defaultCurrency', value: 'INR' },
    { key: 'commissionRate', value: 0.05 },
    { key: 'allowRegistration', value: true },
    { key: 'enableCOD', value: true },
    { key: 'featureFlags', value: { payments: true, recommendations: true, reviews: true } },
  ];
  for (const s of defaults) {
    try {
      await updateSetting(s.key, s.value);
      logger.info(`Upserted setting: ${s.key}`);
    } catch (err) {
      logger.warn(`Failed to upsert setting ${s.key}: ${err.message}`);
    }
  }
}

async function main() {
  try {
    await connectDB();
    const activeDb = getActiveDatabaseName() || mongoose.connection.name;
    const expected = getAppDatabaseName();
    logger.info(`Connected DB: ${activeDb} (expected: ${expected})`);
    if (String(activeDb) === 'mokshith-production' || String(expected) === 'mokshith-production') {
      logger.error('Refusing to run init-db against production database. Aborting.');
      process.exit(1);
    }
    // Import all models so indexes can be created
    await importAllModels();
    await ensureIndexes();
    await upsertBaselineSettings();

    logger.info('Database initialization completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Database initialization failed:', err);
    process.exit(2);
  }
}

main();

