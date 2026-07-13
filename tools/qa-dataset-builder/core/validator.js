import fs from 'fs';
import path from 'path';
import { ValidationError, ConfigurationError, EnvironmentError } from '../utils/errors.js';

export function validateEnvironment(config, { logger } = {}) {
  const report = { ok: true, errors: [], warnings: [] };

  // Check manifest folder
  if (!fs.existsSync(config.manifestPath)) {
    report.ok = false;
    report.errors.push(`Manifest path not found: ${config.manifestPath}`);
  }

  // Check manifest version file (presence)
  const requiredFiles = ['01_manifest_overview.md'];
  for (const f of requiredFiles) {
    if (!fs.existsSync(path.join(config.manifestPath, f))) {
      report.ok = false;
      report.errors.push(`Required manifest file missing: ${f}`);
    }
  }

  // Environment target validation (framework-level policy)
  const forbiddenProduction = (config.targetDatabase === 'mokshith-production' && process.env.ALLOW_PRODUCTION_DATASET !== 'true');
  if (forbiddenProduction) {
    report.ok = false;
    report.errors.push('Target database mokshith-production is forbidden for dataset generation unless ALLOW_PRODUCTION_DATASET=true is set and explicit confirmation provided.');
  }

  // Basic allowed targets (framework sanity)
  const allowedTargets = ['mokshith-qa', 'mokshith-dev', 'mokshith-uat', 'test'];
  if (!allowedTargets.includes(config.targetDatabase) && !forbiddenProduction) {
    report.warnings.push(`Target database ${config.targetDatabase} is not in the known allowed list ${JSON.stringify(allowedTargets)}.`);
  }

  if (!report.ok) {
    throw new ValidationError('Environment validation failed', report);
  }
  return report;
}

