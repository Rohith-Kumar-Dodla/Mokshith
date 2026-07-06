import { loadFixture, hashPassword, nowIso } from './_userUtils.js';

export async function generate({ manifestPath, dryRun = false, dbConnection, logger, passwordConfig = {}, companyMap = {} } = {}) {
  const fixture = (await loadFixture(manifestPath, 'vendors')) || Array.from({ length: 10 }).map((_, i) => ({
    name: `Vendor ${String(i+1).padStart(2,'0')}`,
    email: `vendor.${String(i+1).padStart(2,'0')}@qa.mokshith.local`,
    mobile: `999901${String(i+1).padStart(4,'0')}`,
    role: 'VENDOR',
    status: i < 8 ? 'APPROVED' : (i === 8 ? 'PENDING' : 'REJECTED'),
    companyName: i < 10 ? `VendorCo ${i+1}` : null,
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
      // resolve companyId if present via companyMap (name -> id)
      const companyId = companyMap[u.companyName] || null;
      const pw = passwordConfig.defaultPassword || 'ChangeMeNow!';
      const hashed = await hashPassword(pw);
      const doc = {
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        role: 'VENDOR',
        status: u.status,
        companyId,
        password: hashed,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const res = await coll.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('vendor.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('vendor generation complete', results);
  return results;
}

export default { generate };

