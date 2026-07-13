import path from 'path';
import fs from 'fs';

/**
 * loadConfig(repoRoot, env)
 * repoRoot: absolute path to repository root (determined by CLI entry)
 */
export function loadConfig(env = process.env, repoRoot = null) {
  const projectRoot = repoRoot || path.resolve(process.cwd());
  const defaultLogs = path.join(projectRoot, 'tools', 'qa-dataset-builder', 'logs');
  const config = {
    env: env.NODE_ENV || 'development',
    targetDatabase: env.TARGET_DATABASE || 'mokshith-qa',
    manifestVersion: env.MANIFEST_VERSION || 'v1',
    strict: env.STRICT_MODE === 'true' || false,
    dryRun: env.DRY_RUN === 'true' || false,
    verbose: env.VERBOSE === 'true' || false,
    manifestPath: path.join(projectRoot, 'docs', 'qa-dataset'),
    logsDir: env.LOGS_DIR || defaultLogs,
    repoRoot: projectRoot,
  };

  // ensure logs dir exists
  try {
    fs.mkdirSync(config.logsDir, { recursive: true });
  } catch {}

  return config;
}

