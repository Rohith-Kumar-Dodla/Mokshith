/**
 * datasetVerifier: lightweight checks for presence of reference collections.
 * Uses a dbConnection (mockable).
 */
export async function verifyDataset({ dbConnection, logger } = {}) {
  const checks = [];
  const requiredCollections = ['companies','categories','warehouses','settings','users'];
  try {
    const actual = await dbConnection.db.listCollections().toArray();
    const names = actual.map(c => c.name);
    for (const rc of requiredCollections) {
      const exists = names.includes(rc);
      checks.push({ collection: rc, exists });
    }
    const ok = checks.every(c => c.exists);
    return { ok, checks };
  } catch (err) {
    logger?.error('datasetVerifier error', err.message);
    return { ok: false, error: err.message, checks: [] };
  }
}

export default { verifyDataset };

