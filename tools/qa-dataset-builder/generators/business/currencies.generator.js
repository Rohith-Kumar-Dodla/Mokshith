import fs from 'fs';
import path from 'path';

function defaultCurrencies() {
  return [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger } = {}) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'business', 'currencies.json');
  let currencies = [];
  if (fs.existsSync(fixturePath)) {
    currencies = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    currencies = defaultCurrencies();
  }

  const coll = dbConnection.db.collection('currencies');
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [], warnings: [] };

  for (const c of currencies) {
    try {
      const filter = { code: c.code };
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
      logger?.error('currencies.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('business currencies generation complete', results);
  return results;
}

export default { generate };

