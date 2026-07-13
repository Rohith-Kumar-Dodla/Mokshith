import { loadFixture, hashPassword, nowIso } from './_userUtils.js';

export async function generate({ manifestPath, dryRun = false, dbConnection, logger, passwordConfig = {} } = {}) {
  const fixture = (await loadFixture(manifestPath, 'superAdmin')) || [{
    name: 'Super Admin',
    email: 'superadmin@qa.mokshith.local',
    mobile: '9999999999',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
  }];

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
      if (existing) {
        // Never overwrite existing Super Admin
        results.skipped++;
        continue;
      }
      const pw = passwordConfig.defaultPassword || 'ChangeMeNow!';
      const hashed = await hashPassword(pw);
      const toInsert = {
        ...u,
        password: hashed,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      await coll.updateOne(filter, { $setOnInsert: toInsert }, { upsert: true });
      results.inserted++;
    } catch (err) {
      logger?.error('superAdmin.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('superAdmin generation complete', results);
  return results;
}

export default { generate };

