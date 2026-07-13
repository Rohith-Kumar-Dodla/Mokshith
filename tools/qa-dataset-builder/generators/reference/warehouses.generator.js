import fs from 'fs';
import path from 'path';

function defaultWarehouses() {
  return [
    { name: 'Warehouse North', region: 'North', address: 'North Industrial Park' },
    { name: 'Warehouse Central', region: 'Central', address: 'Central Logistics Hub' },
    { name: 'Warehouse South', region: 'South', address: 'South Distribution Center' },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger }) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'warehouses.json');
  let warehouses = [];
  if (fs.existsSync(fixturePath)) {
    warehouses = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    warehouses = defaultWarehouses();
  }

  const results = { inserted: 0, skipped: 0 };
  const coll = dbConnection.db.collection('warehouses');
  for (const wh of warehouses) {
    const filter = { name: wh.name };
    if (dryRun) {
      const exists = await coll.findOne(filter);
      if (exists) results.skipped++;
      else results.inserted++;
      continue;
    }
    const res = await coll.updateOne(filter, { $setOnInsert: wh }, { upsert: true });
    if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
    else results.skipped++;
  }
  logger?.info(`Warehouses generator completed: inserted=${results.inserted} skipped=${results.skipped}`);
  return results;
}

export default { generate };

