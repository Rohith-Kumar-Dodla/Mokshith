import fs from 'fs';
import path from 'path';

function defaultBrands() {
  return [
    { name: 'Apex Industrial', code: 'BR-APEX', companyName: 'Apex Supplies Pvt Ltd' },
    { name: 'Mokshith Tools', code: 'BR-MOK', companyName: 'Mokshith Enterprises Ltd' },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger } = {}) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'business', 'brands.json');
  let brands = [];
  if (fs.existsSync(fixturePath)) {
    brands = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    brands = defaultBrands();
  }

  const coll = dbConnection.db.collection('brands');
  const companiesColl = dbConnection.db.collection('companies');
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [], warnings: [] };

  for (const b of brands) {
    try {
      if (b.companyName) {
        const comp = await companiesColl.findOne({ name: b.companyName });
        if (!comp) {
          results.warnings.push(`Company ${b.companyName} not found for brand ${b.code}`);
        } else {
          b.companyId = comp._id;
        }
      }
      const filter = { code: b.code };
      if (dryRun) {
        const exists = await coll.findOne(filter);
        if (exists) results.skipped++;
        else results.inserted++;
        continue;
      }
      const res = await coll.updateOne(filter, { $setOnInsert: b }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('brands.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('business brands generation complete', results);
  return results;
}

export default { generate };

