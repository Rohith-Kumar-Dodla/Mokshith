export async function schemaValidate({ dbConnection, manifestPath, logger } = {}) {
  const report = { critical: [], high: [], medium: [], low: [] };

  // Minimal schema checks (existence of required fields) for key collections
  const checks = [
    { coll: 'companies', required: ['name', 'email'] },
    { coll: 'users', required: ['name', 'email', 'role'] },
    { coll: 'products', required: ['name', 'sku', 'vendorId'] },
    { coll: 'categories', required: ['name', 'code'] },
  ];

  for (const chk of checks) {
    try {
      const coll = dbConnection.db.collection(chk.coll);
      const doc = await coll.findOne({});
      if (!doc) {
        report.low.push({ collection: chk.coll, reason: 'no documents to validate' });
        continue;
      }
      const missing = chk.required.filter((f) => !(f in doc));
      if (missing.length) {
        report.high.push({ collection: chk.coll, missing });
      }
    } catch (err) {
      logger?.error('schemaValidate error', err.message);
      report.medium.push({ collection: chk.coll, error: err.message });
    }
  }

  return report;
}

export default { schemaValidate };

