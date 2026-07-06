import fs from 'fs';
import path from 'path';

function defaultCategories() {
  return [
    { name: 'Hardware', code: 'CAT-HARD', parentCode: null, isActive: true },
    { name: 'Fasteners', code: 'CAT-FAST', parentCode: 'CAT-HARD', isActive: true },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger } = {}) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'business', 'categories.json');
  let categories = [];
  if (fs.existsSync(fixturePath)) {
    categories = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    categories = defaultCategories();
  }

  const coll = dbConnection.db.collection('categories');
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [], warnings: [] };

  for (const cat of categories) {
    try {
      // Validate parent existence if parentCode provided
      if (cat.parentCode) {
        const parent = await coll.findOne({ code: cat.parentCode });
        if (!parent) {
          results.warnings.push(`Parent category ${cat.parentCode} missing for ${cat.code}`);
          // still proceed (allow upsert)
        }
      }
      const filter = { code: cat.code };
      if (dryRun) {
        const exists = await coll.findOne(filter);
        if (exists) results.skipped++;
        else results.inserted++;
        continue;
      }
      const res = await coll.updateOne(filter, { $setOnInsert: cat }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
      else results.skipped++;
    } catch (err) {
      logger?.error('categories.generator error', err.message);
      results.errors.push(err.message);
    }
  }
  logger?.info('business categories generation complete', results);
  return results;
}

export default { generate };

