import fs from 'fs';
import path from 'path';

export function verifyBuilder({ repoRoot, logger } = {}) {
  const result = { ok: true, checks: [], errors: [] };
  try {
    const base = path.join(repoRoot, 'tools', 'qa-dataset-builder');
    const required = [
      'index.js',
      'config/loader.js',
      'generators/reference/companies.generator.js',
      'generators/users/superAdmin.generator.js',
      'validation/validator.engine.js',
    ];
    for (const f of required) {
      const p = path.join(base, f);
      result.checks.push({ file: f, exists: fs.existsSync(p) });
      if (!fs.existsSync(p)) result.ok = false;
    }
    // logs dir
    const logsDir = path.join(base, 'logs');
    result.checks.push({ name: 'logsDir', path: logsDir, exists: fs.existsSync(logsDir) });
  } catch (err) {
    result.ok = false;
    result.errors.push(err.message);
  }
  return result;
}

export default { verifyBuilder };

