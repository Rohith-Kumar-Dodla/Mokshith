import { loadFixture, hashPassword, nowIso } from './_userUtils.js';

export async function generate({ manifestPath, dryRun = false, dbConnection, logger, passwordConfig = {}, count = 100 } = {}) {
  const fixture = (await loadFixture(manifestPath, 'customers')) || null;
  const customers = fixture || Array.from({ length: count }).map((_, i) => ({
    name: `Customer ${String(i+1).padStart(4,'0')}`,
    email: `customer.${String(i+1).padStart(4,'0')}@qa.mokshith.local`,
    mobile: `99990${String(i+1).padStart(5,'0')}`,
    role: 'B2B_CUSTOMER',
    status: 'ACTIVE',
  }));

  const coll = dbConnection.db.collection('users');
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const u of customers) {
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
        role: u.role || 'B2B_CUSTOMER',
        status: u.status || 'ACTIVE',
        password: hashed,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const res = await coll.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('customer.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('customer generation complete', results);
  return results;
}

export default { generate };

