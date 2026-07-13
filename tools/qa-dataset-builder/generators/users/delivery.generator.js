import { loadFixture, hashPassword, nowIso } from './_userUtils.js';

export async function generate({ manifestPath, dryRun = false, dbConnection, logger, passwordConfig = {}, warehouseMap = {} } = {}) {
  const fixture = (await loadFixture(manifestPath, 'delivery')) || Array.from({ length: 10 }).map((_, i) => ({
    name: `DP ${String(i+1).padStart(2,'0')}`,
    email: `dp.${String(i+1).padStart(2,'0')}@qa.mokshith.local`,
    mobile: `999902${String(i+1).padStart(4,'0')}`,
    role: 'DELIVERY_PARTNER',
    status: 'ACTIVE',
    warehouseName: ['Warehouse North','Warehouse Central','Warehouse South'][i % 3],
  }));

  const coll = dbConnection.db.collection('users');
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const u of fixture) {
    try {
      const filter = { email: u.email };
      const existing = await coll.findOne(filter);
      if (dryRun) {
        if (existing) results.skipped++;
        else results.inserted++;
        continue;
      }
      const warehouseId = warehouseMap[u.warehouseName] || null;
      const pw = passwordConfig.defaultPassword || 'ChangeMeNow!';
      const hashed = await hashPassword(pw);
      const doc = {
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        role: 'DELIVERY_PARTNER',
        status: u.status,
        warehouseId,
        password: hashed,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const res = await coll.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('delivery.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('delivery generation complete', results);
  return results;
}

export default { generate };

