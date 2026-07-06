import fs from 'fs';
import path from 'path';

function defaultCategories() {
  return [
    { name: 'Hardware', slug: 'hardware', parent: null, isActive: true },
    { name: 'Electrical', slug: 'electrical', parent: null, isActive: true },
    { name: 'Machinery', slug: 'machinery', parent: null, isActive: true },
    { name: 'Hardware > Fasteners', slug: 'fasteners', parent: 'hardware', isActive: true },
    { name: 'Electrical > Wiring', slug: 'wiring', parent: 'electrical', isActive: true },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger }) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'categories.json');
  let categories = [];
  if (fs.existsSync(fixturePath)) {
    categories = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    categories = defaultCategories();
  }

  const results = { inserted: 0, skipped: 0 };
  const coll = dbConnection.db.collection('categories');
  for (const cat of categories) {
    const filter = { slug: cat.slug };
    if (dryRun) {
      const exists = await coll.findOne(filter);
      if (exists) results.skipped++;
      else results.inserted++;
      continue;
    }
    const res = await coll.updateOne(filter, { $setOnInsert: cat }, { upsert: true });
    if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
    else results.skipped++;
  }
  logger?.info(`Categories generator completed: inserted=${results.inserted} skipped=${results.skipped}`);
  return results;
}

export default { generate };

