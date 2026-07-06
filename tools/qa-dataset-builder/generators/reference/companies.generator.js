import fs from 'fs';
import path from 'path';

function defaultCompanies() {
  return [
    { name: 'Mokshith Enterprises Ltd', email: 'corp@qa.mokshith.local', phone: '0801234000', address: 'Industrial Area, Bangalore' },
    { name: 'Apex Supplies Pvt Ltd', email: 'vendor@apex.qa', phone: '0801234001', address: 'Peenya Industrial Estate' },
    { name: 'Logistics Co', email: 'logistics@qa.mokshith.local', phone: '0801234002', address: 'Warehouse Road' },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger }) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'companies.json');
  let companies = [];
  if (fs.existsSync(fixturePath)) {
    companies = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    companies = defaultCompanies();
  }

  const results = { inserted: 0, skipped: 0, details: [] };
  const coll = dbConnection.db.collection('companies');
  for (const comp of companies) {
    const filter = { email: comp.email };
    if (dryRun) {
      const exists = await coll.findOne(filter);
      if (exists) {
        results.skipped++;
      } else {
        results.inserted++;
      }
      continue;
    }
    const res = await coll.updateOne(filter, { $setOnInsert: comp }, { upsert: true });
    if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
    else results.skipped++;
  }
  logger?.info(`Companies generator completed: inserted=${results.inserted} skipped=${results.skipped}`);
  return results;
}

export default { generate };

