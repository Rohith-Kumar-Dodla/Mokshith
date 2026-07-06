import fs from 'fs';
import path from 'path';

function defaultUnits() {
  return [
    { code: 'PCS', name: 'Pieces' },
    { code: 'KG', name: 'Kilogram' },
    { code: 'M', name: 'Meter' },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger } = {}) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'business', 'units.json');
  let units = [];
  if (fs.existsSync(fixturePath)) {
    units = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    units = defaultUnits();
  }

  const coll = dbConnection.db.collection('units');
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [], warnings: [] };

  for (const u of units) {
    try {
      const filter = { code: u.code };
      if (dryRun) {
        const exists = await coll.findOne(filter);
        if (exists) results.skipped++;
        else results.inserted++;
        continue;
      }
      const res = await coll.updateOne(filter, { $setOnInsert: u }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('units.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('business units generation complete', results);
  return results;
}

export default { generate };

