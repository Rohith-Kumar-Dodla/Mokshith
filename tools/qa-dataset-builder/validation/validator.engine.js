import { relationshipValidate } from './relationship.validator.js';
import { duplicateValidate } from './duplicate.validator.js';
import { schemaValidate } from './schema.validator.js';
import { integrityValidate } from './integrity.validator.js';
import { writeSummary } from './summary.reporter.js';

export async function runAllValidators({ dbConnection, manifestPath, config = {}, logger }) {
  const start = Date.now();
  const summary = {
    meta: {
      runAt: new Date().toISOString(),
      manifestPath,
      targetDatabase: config.targetDatabase || null,
      environment: config.env || null,
    },
    results: {},
    score: null,
  };

  // Run schema validation
  const schemaRes = await schemaValidate({ dbConnection, manifestPath, logger });
  summary.results.schema = schemaRes;

  // Run duplicate validation
  const dupRes = await duplicateValidate({ dbConnection, manifestPath, logger });
  summary.results.duplicates = dupRes;

  // Run relationship validation
  const relRes = await relationshipValidate({ dbConnection, manifestPath, logger });
  summary.results.relationships = relRes;

  // Run integrity checks
  const intRes = await integrityValidate({ dbConnection, manifestPath, logger });
  summary.results.integrity = intRes;

  // Compute simple readiness score (basic)
  let critical = 0;
  for (const k of Object.keys(summary.results)) {
    const r = summary.results[k];
    if (r && r.critical) critical += r.critical.length || 0;
  }
  summary.score = Math.max(0, 100 - critical * 10);
  summary.durationMs = Date.now() - start;

  // Write report artifacts
  const reportPaths = await writeSummary({ summary, config, logger });
  summary.reportPaths = reportPaths;

  // Fail fast if critical issues
  if (critical > 0) {
    summary.status = 'FAILED';
    throw new Error('Validation failed: critical issues detected');
  } else {
    summary.status = 'READY';
  }

  return summary;
}

export default { runAllValidators };

