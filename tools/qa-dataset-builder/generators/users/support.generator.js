import { loadFixture, hashPassword, nowIso } from './_userUtils.js';

export async function generate({ manifestPath, dryRun = false, dbConnection, logger, passwordConfig = {} } = {}) {
  const fixture = (await loadFixture(manifestPath, 'support')) || [
    { name: 'Support Agent 1', email: 'support.01@qa.mokshith.local', mobile: '9999040001', role: 'SUPPORT', status: 'ACTIVE' },
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
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        role: u.role || 'SUPPORT',
        status: u.status || 'ACTIVE',
        password: hashed,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const res = await coll.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('support.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('support generation complete', results);
  return results;
}

export default { generate };

