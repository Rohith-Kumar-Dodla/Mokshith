import fs from 'fs';
import path from 'path';

export function verifyPlaywright({ repoRoot, logger } = {}) {
  const result = { ok: true, checks: [], errors: [] };
  try {
    const pwConfig = path.join(repoRoot, 'Production', 'ME', 'playwright.config.ts');
    const reportsDir = path.join(repoRoot, 'Production', 'ME', 'test-results');
    const screenshotsDir = path.join(repoRoot, 'Production', 'ME', 'test-results', 'screenshots');
    result.checks.push({ file: pwConfig, exists: fs.existsSync(pwConfig) });
    result.checks.push({ reportsDir, exists: fs.existsSync(reportsDir) });
    result.checks.push({ screenshotsDir, exists: fs.existsSync(screenshotsDir) });
    if (!fs.existsSync(pwConfig)) result.ok = false;
  } catch (err) {
    result.ok = false;
    result.errors.push(err.message);
  }
  return result;
}

export default { verifyPlaywright };

