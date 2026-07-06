import fs from 'fs';
import path from 'path';

function defaultSettings() {
  return [
    { key: 'ENABLE_REGISTRATIONS', value: true },
    { key: 'AUTH_STRICT_MODE', value: false },
    { key: 'DEFAULT_CURRENCY', value: 'INR' },
  ];
}

export async function generate({ manifestPath, dryRun = false, dbConnection, logger }) {
  const fixturePath = path.join(manifestPath, 'fixtures', 'settings.json');
  let settings = [];
  if (fs.existsSync(fixturePath)) {
    settings = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } else {
    settings = defaultSettings();
  }

  const results = { inserted: 0, skipped: 0 };
  const coll = dbConnection.db.collection('settings');
  for (const s of settings) {
    const filter = { key: s.key };
    if (dryRun) {
      const exists = await coll.findOne(filter);
      if (exists) results.skipped++;
      else results.inserted++;
      continue;
    }
    const res = await coll.updateOne(filter, { $set: s }, { upsert: true });
    if (res.upsertedCount && res.upsertedCount > 0) results.inserted++;
    else results.skipped++;
  }
  logger?.info(`Settings generator completed: inserted=${results.inserted} skipped=${results.skipped}`);
  return results;
}

export default { generate };

