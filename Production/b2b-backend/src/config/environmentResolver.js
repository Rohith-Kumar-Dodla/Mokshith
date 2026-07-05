import { getLoadedEnvPath } from './loadEnv.js';
import { environments } from './environments.js';

// Legacy fallback (kept here as internal fallback only)
export const LEGACY_APPLICATION_DATABASE_NAME = 'test';

export function getNodeEnv() {
  return process.env.NODE_ENV || 'development';
}

export function getAppDatabaseName() {
  const nodeEnv = getNodeEnv();
  return process.env.APP_DATABASE_NAME?.trim() || (environments[nodeEnv] && environments[nodeEnv].databaseName) || LEGACY_APPLICATION_DATABASE_NAME;
}

export function parseDatabaseName(uri) {
  if (!uri || typeof uri !== 'string') return null;
  try {
    const withoutQuery = uri.split('?')[0];
    const segments = withoutQuery.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || '';
    if (!last || last.includes('@') || last.includes(':')) {
      return null;
    }
    return decodeURIComponent(last);
  } catch {
    return null;
  }
}

export function getEnvFileInfo(projectRoot) {
  const loaded = getLoadedEnvPath();
  if (!loaded) return '(platform env)';
  if (projectRoot && String(loaded).startsWith(projectRoot)) {
    return loaded.replace(projectRoot + '/', '');
  }
  return loaded;
}

export function getAllowedDatabases(nodeEnv) {
  const env = nodeEnv || getNodeEnv();
  switch (env) {
    case 'development':
      // development allows mokshith-dev and legacy test until migration completes
      return ['mokshith-dev', 'test'];
    case 'qa':
      return ['mokshith-qa'];
    case 'uat':
      return ['mokshith-uat'];
    case 'production':
      return ['mokshith-production'];
    case 'test':
      return ['mokshith-test'];
    default:
      return [];
  }
}

export function isDatabaseAllowed(nodeEnv, dbName, { allowInMemory = false } = {}) {
  const env = nodeEnv || getNodeEnv();
  if (env === 'test' && (process.env.USE_IN_MEMORY_MONGO === 'true' || allowInMemory)) {
    return true;
  }
  const allowed = getAllowedDatabases(env);
  if (!dbName) return false;
  return allowed.includes(dbName);
}

export default {
  getNodeEnv,
  getAppDatabaseName,
  parseDatabaseName,
  getEnvFileInfo,
  getAllowedDatabases,
  isDatabaseAllowed,
  LEGACY_APPLICATION_DATABASE_NAME,
};

