import { loadFixture, hashPassword, nowIso } from './_userUtils.js';

export async function generate({ manifestPath, dryRun = false, dbConnection, logger, passwordConfig = {} } = {}) {
  const fixture = (await loadFixture(manifestPath, 'admins')) || [
    { name: 'Admin One', email: 'admin.01@qa.mokshith.local', mobile: '999900001', role: 'ADMIN', status: 'ACTIVE' },
    { name: 'Admin Two', email: 'admin.02@qa.mokshith.local', mobile: '999900002', role: 'ADMIN', status: 'ACTIVE' },
  ];

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
      const pw = passwordConfig.defaultPassword || 'ChangeMeNow!';
      const hashed = await hashPassword(pw);
      const doc = {
        ...u,
        password: hashed,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const res = await coll.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('admin.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('admin generation complete', results);
  return results;
}

export default { generate };

