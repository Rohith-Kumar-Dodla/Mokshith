import fs from 'fs';
import path from 'path';

export async function checkManifest({ manifestPath, logger }) {
  // Verify docs/qa-dataset exists and contains required manifest files (overview + entities)
  const required = [
    '01_manifest_overview.md',
    '02_entities.md',
    '03_reference_data.md',
    '04_test_accounts.md',
  ];
  try {
    const stat = fs.statSync(manifestPath);
    if (!stat.isDirectory()) return false;
  } catch {
    logger?.error(`Manifest path missing: ${manifestPath}`);
    return false;
  }

  for (const f of required) {
    const p = path.join(manifestPath, f);
    if (!fs.existsSync(p)) {
      logger?.warn(`Missing manifest file: ${f}`);
      return false;
    }
  }
  return true;
}

