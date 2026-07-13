import fs from 'fs';
import path from 'path';

export function verifyEnvironment({ repoRoot, env = process.env, logger } = {}) {
  const result = { ok: true, checks: [], errors: [] };
  try {
    const nodeEnv = env.NODE_ENV || 'development';
    const targetDatabase = env.TARGET_DATABASE || 'mokshith-qa';
    const manifestVersion = env.MANIFEST_VERSION || 'v1';
    result.checks.push({ name: 'NODE_ENV', value: nodeEnv, expected: 'development' });
    result.checks.push({ name: 'TARGET_DATABASE', value: targetDatabase, expected: 'mokshith-dev' });
    result.checks.push({ name: 'MANIFEST_VERSION', value: manifestVersion });

    // repoRoot sanity
    if (!repoRoot || !fs.existsSync(repoRoot)) {
      result.ok = false;
      result.errors.push('Repository root not found');
    } else {
      const manifestPath = path.join(repoRoot, 'docs', 'qa-dataset');
      result.checks.push({ name: 'manifestPath', value: manifestPath, exists: fs.existsSync(manifestPath) });
    }
  } catch (err) {
    result.ok = false;
    result.errors.push(err.message);
  }
  return result;
}

export default { verifyEnvironment };

