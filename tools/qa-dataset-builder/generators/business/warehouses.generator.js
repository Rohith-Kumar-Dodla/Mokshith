import fs from 'fs';
import path from 'path';

function defaultWarehouses() {
  return [
    { name: 'Warehouse North', code: 'WH-NORTH', companyName: 'Mokshith Enterprises Ltd', region: 'North', address: 'North Industrial Park' },
    { name: 'Warehouse Central', code: 'WH-CENTRAL', companyName: 'Mokshith Enterprises Ltd', region: 'Central', address: 'Central Logistics Hub' },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger } = {}) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'business', 'warehouses.json');
  let warehouses = [];
  if (fs.existsSync(fixturePath)) {
    warehouses = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    warehouses = defaultWarehouses();
  }

  const coll = dbConnection.db.collection('warehouses');
  const companiesColl = dbConnection.db.collection('companies');
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [], warnings: [] };

  for (const wh of warehouses) {
    try {
      // Validate company existence
      if (wh.companyName) {
        const comp = await companiesColl.findOne({ name: wh.companyName });
        if (!comp) {
          results.warnings.push(`Company ${wh.companyName} not found for warehouse ${wh.code}`);
        } else {
          wh.companyId = comp._id;
        }
      }
      const filter = { code: wh.code };
      if (dryRun) {
        const exists = await coll.findOne(filter);
        if (exists) results.skipped++;
        else results.inserted++;
        continue;
      }
      const res = await coll.updateOne(filter, { $setOnInsert: wh }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('warehouses.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('business warehouses generation complete', results);
  return results;
}

export default { generate };

