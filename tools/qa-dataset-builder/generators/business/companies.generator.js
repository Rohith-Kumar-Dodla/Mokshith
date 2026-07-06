import fs from 'fs';
import path from 'path';

function defaultCompanies() {
  return [
    { name: 'Mokshith Enterprises Ltd', code: 'MOK', email: 'corp@qa.mokshith.local', phone: '0801234000', address: 'Industrial Area, Bangalore' },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger } = {}) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'business', 'companies.json');
  let companies = [];
  if (fs.existsSync(fixturePath)) {
    companies = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    companies = defaultCompanies();
  }

  const coll = dbConnection.db.collection('companies');
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [], warnings: [] };

  for (const c of companies) {
    try {
      const filter = { name: c.name };
      if (dryRun) {
        const exists = await coll.findOne(filter);
        if (exists) results.skipped++;
        else results.inserted++;
        continue;
      }
      const res = await coll.updateOne(filter, { $setOnInsert: c }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('companies.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('business companies generation complete', results);
  return results;
}

export default { generate };

