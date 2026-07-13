import fs from 'fs';
import path from 'path';

function defaultTaxes() {
  return [
    { name: 'GST 18%', code: 'GST18', rate: 18.0, companyName: null },
    { name: 'GST 5%', code: 'GST5', rate: 5.0, companyName: null },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger } = {}) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'business', 'taxes.json');
  let taxes = [];
  if (fs.existsSync(fixturePath)) {
    taxes = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    taxes = defaultTaxes();
  }

  const coll = dbConnection.db.collection('taxes');
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [], warnings: [] };

  for (const t of taxes) {
    try {
      const filter = { code: t.code };
      if (dryRun) {
        const exists = await coll.findOne(filter);
        if (exists) results.skipped++;
        else results.inserted++;
        continue;
      }
      const res = await coll.updateOne(filter, { $setOnInsert: t }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('taxes.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('business taxes generation complete', results);
  return results;
}

export default { generate };

