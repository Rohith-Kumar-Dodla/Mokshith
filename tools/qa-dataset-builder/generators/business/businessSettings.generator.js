import fs from 'fs';
import path from 'path';

function defaultBusinessSettings() {
  return [
    { companyName: 'Mokshith Enterprises Ltd', key: 'AUTH_STRICT_MODE', value: false },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger } = {}) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'business', 'businessSettings.json');
  let settings = [];
  if (fs.existsSync(fixturePath)) {
    settings = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    settings = defaultBusinessSettings();
  }

  const coll = dbConnection.db.collection('businessSettings');
  const companiesColl = dbConnection.db.collection('companies');
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [], warnings: [] };

  for (const s of settings) {
    try {
      let companyId = null;
      if (s.companyName) {
        const comp = await companiesColl.findOne({ name: s.companyName });
        if (!comp) {
          results.warnings.push(`Company ${s.companyName} not found for business setting ${s.key}`);
        } else {
          companyId = comp._id;
        }
      }
      const filter = { companyId, key: s.key };
      if (dryRun) {
        const exists = await coll.findOne(filter);
        if (exists) results.skipped++;
        else results.inserted++;
        continue;
      }
      const doc = { ...s, companyId };
      const res = await coll.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('businessSettings.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('business businessSettings generation complete', results);
  return results;
}

export default { generate };

