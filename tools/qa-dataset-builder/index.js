#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import { loadConfig } from './config/loader.js';
import { createLogger } from './utils/logger.js';
import { validateEnvironment } from './core/validator.js';
import { checkManifest } from './core/manifestLoader.js';
import { buildReport } from './reporters/report.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getRepoRoot() {
  // repo root is two levels up from this file (tools/qa-dataset-builder -> repo root)
  return path.resolve(__dirname, '..', '..');
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  const repoRoot = getRepoRoot();
  const config = loadConfig(process.env, repoRoot);
  const logger = createLogger({ logsDir: config.logsDir, verbose: config.verbose, repoRoot: config.repoRoot });

  // Startup banner
  logger.info('======================================');
  logger.info(`Builder Version : v1.0.0`);
  logger.info(`Environment     : ${config.env}`);
  logger.info(`Target Database : ${config.targetDatabase}`);
  logger.info(`Manifest Version: ${config.manifestVersion}`);
  logger.info(`Logs Directory  : ${config.logsDir}`);
  logger.info(`Working Dir     : ${process.cwd()}`);
  logger.info(`Repository Root : ${config.repoRoot}`);
  logger.info('======================================');

  try {
    if (!cmd) {
      console.log('Usage: dataset:<command>  (generate|validate|report|dry-run|reset|rollback)');
      process.exit(2);
    }

    switch (cmd) {
      case 'dataset:generate': {
        // support subcommand: --reference
        const sub = argv[1];
        if (sub === '--reference') {
          console.log('Reference generation requested (framework generator)');
          const { connect, disconnect } = await import('./utils/db.js');
          const companiesGen = await import('./generators/reference/companies.generator.js');
          const categoriesGen = await import('./generators/reference/categories.generator.js');
          const warehousesGen = await import('./generators/reference/warehouses.generator.js');
          const settingsGen = await import('./generators/reference/settings.generator.js');

          // Protect production by default
          if (config.targetDatabase === 'mokshith-production' && process.env.ALLOW_PRODUCTION_DATASET !== 'true') {
            logger.error('Refusing to generate reference data for mokshith-production (requires ALLOW_PRODUCTION_DATASET=true)');
            process.exit(2);
          }

          // Connect to target DB using MONGO_URI env
          const mongoUri = process.env.MONGO_URI;
          if (!mongoUri) {
            logger.error('MONGO_URI not provided in environment (required for dataset:generate)');
            process.exit(2);
          }
          const dbConn = await connect(mongoUri, { logger });

          const gens = [
            { name: 'companies', fn: companiesGen.generate },
            { name: 'categories', fn: categoriesGen.generate },
            { name: 'warehouses', fn: warehousesGen.generate },
            { name: 'settings', fn: settingsGen.generate },
          ];

          const overall = {};
          for (const g of gens) {
            logger.info(`Generating reference collection: ${g.name}`);
            try {
              const res = await g.fn({ manifestPath: config.manifestPath, dryRun: config.dryRun, dbConnection: dbConn, logger });
              overall[g.name] = res;
            } catch (err) {
              logger.error(`Generator ${g.name} failed: ${err.message}`);
              overall[g.name] = { error: err.message };
            }
          }
          // User generators intentionally not invoked here; they are in the users subcommand
          await disconnect();
          const report = buildReport({
            builderVersion: 'v1.0.0',
            environment: config.env,
            targetDatabase: config.targetDatabase,
            manifestVersion: config.manifestVersion,
            validation: { ok: true, details: overall },
          });
          const out = JSON.stringify(report, null, 2);
          console.log(out);
          try {
            const fs = await import('fs');
            const path = await import('path');
            fs.mkdirSync(config.logsDir, { recursive: true });
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const fname = path.join(config.logsDir, `qa-generate-reference-${ts}.json`);
            fs.writeFileSync(fname, out, { encoding: 'utf8' });
            fs.readFileSync(fname, 'utf8');
            logger.info(`Generation report written to ${fname}`);
            logger.info('Generation complete: SUCCESS');
            logger.info(`Report Path: ${fname}`);
            logger.info(`Log Path: ${logger.logFile || config.logsDir}`);
          } catch (e) {
            logger.warn('Failed to write generation report file', e.message);
            logger.info('Generation complete: FAILED');
          }
          break;
        } else {
          console.log('Not implemented');
          break;
        }
      }

      case 'dataset:dry-run': {
        logger.info('Starting QA Dataset Builder (dry-run)');
        // 1. Environment protection & validation
        validateEnvironment(config, { logger });
        logger.info('Environment validated');

        // 2. Manifest discovery
        const manifestExists = await checkManifest({ manifestPath: config.manifestPath, logger });
        if (!manifestExists) {
          logger.error('Manifest not found or incomplete');
          process.exit(1);
        }
        logger.info('Manifest discovered');

        // 3. Run structural validation
        const validation = await validateEnvironment(config, { logger });
        const report = buildReport({
          builderVersion: 'v1.0.0',
          environment: config.env,
          targetDatabase: config.targetDatabase,
          manifestVersion: config.manifestVersion,
          validation,
        });

        const out = JSON.stringify(report, null, 2);
        console.log(out);
        try {
          const fs = await import('fs');
          const path = await import('path');
          fs.mkdirSync(config.logsDir, { recursive: true });
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const fname = path.join(config.logsDir, `qa-dryrun-${ts}.json`);
          fs.writeFileSync(fname, out, { encoding: 'utf8' });
          // flush by reading back (ensures write completed)
          fs.readFileSync(fname, 'utf8');
          logger.info(`Report written to ${fname}`);
          logger.info('Dry-run complete: SUCCESS');
          logger.info(`Execution Time: ${new Date().toISOString()}`);
          logger.info(`Report Path: ${fname}`);
          logger.info(`Log Path: ${logger.logFile || config.logsDir}`);
        } catch (e) {
          logger.warn('Failed to write report file', e.message);
          logger.info('Dry-run complete: FAILED');
        }
        break;
      }

      default:
        console.log('Unknown command:', cmd);
        process.exit(2);
    }
  } catch (err) {
    logger.error('Fatal error:', err?.message || err);
    console.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

