export function buildReport({ builderVersion, environment, targetDatabase, manifestVersion, validation }) {
  const now = new Date().toISOString();
  return {
    builderVersion,
    runAt: now,
    environment,
    targetDatabase,
    manifestVersion,
    validation,
    status: validation?.ok ? 'READY' : 'FAILED',
    reportId: `report-${now.replace(/[:.]/g, '-')}`,
  };
}

