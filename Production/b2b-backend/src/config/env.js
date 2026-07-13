import { loadEnv, projectRoot } from './loadEnv.js';
import { parseDatabaseName as parseDbFromResolver, getAppDatabaseName, getNodeEnv, getEnvFileInfo, isDatabaseAllowed } from './environmentResolver.js';
// Keep existing resolveMongoUri logic but reuse parseDatabaseName from resolver

loadEnv({ silent: process.env.NODE_ENV === 'test' });

function parseDatabaseName(uri) {
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

export function maskMongoUri(uri) {
  if (!uri) return '(not set)';
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
}

export function resolveMongoUri() {
  if (process.env.USE_IN_MEMORY_MONGO === 'true') {
    return { uri: null, source: 'in-memory', databaseName: 'b2b-ecommerce' };
  }

  const directUri = process.env.MONGO_URI_DIRECT?.trim();
  const primaryUri = process.env.MONGO_URI?.trim();

  if (directUri) {
    return {
      uri: directUri,
      source: 'MONGO_URI_DIRECT',
      databaseName: parseDbFromResolver(directUri),
    };
  }

  if (primaryUri) {
    return {
      uri: primaryUri,
      source: 'MONGO_URI',
      databaseName: parseDbFromResolver(primaryUri),
    };
  }

  return { uri: null, source: null, databaseName: null };
}

function validateOptionalGroup(label, keys) {
  const values = keys.map((key) => process.env[key]?.trim()).filter(Boolean);
  if (values.length === 0) {
    return [];
  }
  if (values.length < keys.length) {
    return [`${label} is partially configured. Set all of: ${keys.join(', ')}`];
  }
  return [];
}

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PROJECT_ROOT: projectRoot,
  FRONTEND_URL: process.env.FRONTEND_URL,
  MONGO_URI: process.env.MONGO_URI,
  MONGO_URI_DIRECT: process.env.MONGO_URI_DIRECT,
  USE_IN_MEMORY_MONGO: process.env.USE_IN_MEMORY_MONGO === 'true',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  ENABLE_QUEUE: process.env.ENABLE_QUEUE,
  ENABLE_WORKERS: process.env.ENABLE_WORKERS,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
};

export function isRedisRequired() {
  return env.ENABLE_QUEUE === 'true' || env.ENABLE_WORKERS === 'true';
}

export function validateEnv({ logger = console } = {}) {
  const errors = [];
  const warnings = [];

  if (!env.JWT_SECRET) {
    errors.push('Missing JWT_SECRET');
  }
  if (!env.JWT_REFRESH_SECRET) {
    errors.push('Missing JWT_REFRESH_SECRET');
  }

  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET && env.JWT_SECRET.length < 64) {
      errors.push('JWT_SECRET must be at least 64 characters in production');
    }
    if (env.JWT_REFRESH_SECRET && env.JWT_REFRESH_SECRET.length < 64) {
      errors.push('JWT_REFRESH_SECRET must be at least 64 characters in production');
    }
  } else if (env.JWT_SECRET && env.JWT_SECRET.length < 64) {
    warnings.push('JWT_SECRET is shorter than 64 characters (allowed in non-production only)');
  }

  const mongo = resolveMongoUri();
  if (!mongo.uri && !env.USE_IN_MEMORY_MONGO) {
    errors.push('Missing MONGO_URI (or set USE_IN_MEMORY_MONGO=true for local development)');
  }

  // Pre-connection safety: ensure the MONGO_URI (if present) targets an allowed DB for this NODE_ENV
  const nodeEnv = getNodeEnv();
  const resolvedDbName = mongo.databaseName;
  if (mongo.uri && !env.USE_IN_MEMORY_MONGO && nodeEnv !== 'test') {
    if (resolvedDbName && !isDatabaseAllowed(nodeEnv, resolvedDbName)) {
      const allowed = (Array.isArray(getAppDatabaseName) ? getAppDatabaseName : null);
      logger.error?.('❌ Unsafe database target detected during startup validation') ?? logger.error('❌ Unsafe database target detected during startup validation');
      logger.error?.(`[env] Environment : ${nodeEnv}`) ?? logger.error(`[env] Environment : ${nodeEnv}`);
      logger.error?.(`[env] Resolved DB : ${resolvedDbName}`) ?? logger.error(`[env] Resolved DB : ${resolvedDbName}`);
      logger.error?.(`[env] Expected DBs: ${getNodeEnv ? getAppDatabaseName() : '(unknown)'}`) ?? logger.error(`[env] Expected DBs: ${getAppDatabaseName()}`);
      logger.error?.(`[env] Environment File : ${getEnvFileInfo(projectRoot)}`) ?? logger.error(`[env] Environment File : ${getEnvFileInfo(projectRoot)}`);
      logger.error?.('Startup aborted: the resolved MongoDB database is not allowed for this NODE_ENV') ?? logger.error('Startup aborted: the resolved MongoDB database is not allowed for this NODE_ENV');
      process.exit(1);
    }
  }

  const primaryDb = parseDbFromResolver(env.MONGO_URI);
  const directDb = parseDbFromResolver(env.MONGO_URI_DIRECT);
  if (env.MONGO_URI?.trim() && env.MONGO_URI_DIRECT?.trim()) {
    if (primaryDb && directDb && primaryDb !== directDb) {
      errors.push(
        `MONGO_URI and MONGO_URI_DIRECT target different databases ("${primaryDb}" vs "${directDb}"). ` +
          'Remove one or align database names to prevent connecting to the wrong database after branch switches.'
      );
    } else if (mongo.source === 'MONGO_URI_DIRECT') {
      warnings.push(
        'Both MONGO_URI and MONGO_URI_DIRECT are set. MONGO_URI_DIRECT takes precedence at runtime.'
      );
    }
  }

  errors.push(
    ...validateOptionalGroup('Razorpay', [
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
    ])
  );

  errors.push(
    ...validateOptionalGroup('Cloudinary', [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ])
  );

  if (process.env.USE_S3_STORAGE === 'true') {
    errors.push(
      ...validateOptionalGroup('AWS S3', [
        'S3_REGION',
        'S3_BUCKET_NAME',
        'S3_ACCESS_KEY_ID',
        'S3_SECRET_ACCESS_KEY',
      ])
    );
  }

  if (process.env.USE_SOCKET_REDIS_ADAPTER === 'true' && !process.env.REDIS_HOST && !process.env.REDIS_URL) {
    errors.push('USE_SOCKET_REDIS_ADAPTER=true but REDIS_HOST/REDIS_URL is not set');
  }

  if (env.USE_IN_MEMORY_MONGO && env.NODE_ENV === 'production') {
    errors.push('USE_IN_MEMORY_MONGO=true is not allowed in production');
  }

  // Derive the expected database name via centralized resolver (APP_DATABASE_NAME still supported)
  const expectedDatabase = getAppDatabaseName();

  if (mongo.uri && !env.USE_IN_MEMORY_MONGO && env.NODE_ENV !== 'test') {
    if (!mongo.databaseName) {
      warnings.push(`MONGO_URI must include the application database name (expected: ${expectedDatabase})`);
    } else if (mongo.databaseName !== expectedDatabase) {
      // Do not abort startup in this phase — surface as a warning for awareness
      warnings.push(`MONGO URI targets database "${mongo.databaseName}" but application database is expected to be "${expectedDatabase}".`);
    }
  }

  if (isRedisRequired() && !process.env.REDIS_URL && !process.env.REDIS_HOST) {
    errors.push('ENABLE_QUEUE/ENABLE_WORKERS requires REDIS_URL or REDIS_HOST');
  }

  for (const warning of warnings) {
    logger.warn?.(`[env] ${warning}`) ?? logger.warn(`[env] ${warning}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      logger.error?.(`❌ ${error}`) ?? logger.error(`❌ ${error}`);
    }
    logger.error?.('Startup aborted due to invalid environment configuration.') ??
      logger.error('Startup aborted due to invalid environment configuration.');
    process.exit(1);
  }

  logger.info?.('[env] Environment validation passed') ?? logger.log('[env] Environment validation passed');

  if (mongo.uri) {
    logger.info?.(
      `[env] Mongo target: ${mongo.databaseName || '(default)'} via ${mongo.source} (${maskMongoUri(mongo.uri)})`
    ) ?? logger.log(
      `[env] Mongo target: ${mongo.databaseName || '(default)'} via ${mongo.source} (${maskMongoUri(mongo.uri)})`
    );
  } else if (env.USE_IN_MEMORY_MONGO) {
    logger.warn?.('[env] USE_IN_MEMORY_MONGO=true — data resets on every restart') ??
      logger.warn('[env] USE_IN_MEMORY_MONGO=true — data resets on every restart');
  }

  // Startup awareness summary (do not reveal secrets)
  try {
    const envFileInfo = getEnvFileInfo(projectRoot);
    logger.info('======================================');
    logger.info(`[env] Environment : ${env.NODE_ENV || 'development'}`);
    logger.info(`[env] Expected DB : ${expectedDatabase}`);
    logger.info(`[env] Resolved DB : ${mongo.databaseName || '(unknown)'}`);
    logger.info(`[env] Mongo Source : ${mongo.source || (env.USE_IN_MEMORY_MONGO ? 'in-memory' : '(unset)')}`);
    logger.info(`[env] Environment File : ${envFileInfo}`);
    logger.info('======================================');
  } catch (e) {
    // Non-fatal - logging only
  }

  return { env, mongo };
}

export default env;
