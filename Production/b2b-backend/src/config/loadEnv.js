import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the b2b-backend project root (parent of src/) */
export const projectRoot = path.resolve(__dirname, '../..');

// Build ordered candidates, preferring environment-specific files when NODE_ENV is set
let loadedEnvPath = null;

function buildEnvCandidates() {
  const candidates = [];
  const nodeEnv = process.env.NODE_ENV && String(process.env.NODE_ENV).trim();
  if (nodeEnv) {
    candidates.push(path.join(projectRoot, `.env.${nodeEnv}.local`));
    candidates.push(path.join(projectRoot, `.env.${nodeEnv}`));
  }
  candidates.push(path.join(projectRoot, '.env.local'));
  candidates.push(path.join(projectRoot, '.env'));
  return candidates;
}

/**
 * Load environment variables from a fixed project-root path.
 * Avoids cwd-dependent dotenv failures after branch switches or running from repo root.
 */
export function loadEnv({ silent = false } = {}) {
  if (loadedEnvPath) {
    return { envPath: loadedEnvPath, projectRoot };
  }

  const ENV_CANDIDATES = buildEnvCandidates();
  for (const envPath of ENV_CANDIDATES) {
    if (fs.existsSync(envPath)) {
      const result = dotenv.config({ path: envPath, override: false });
      if (result.error) {
        throw new Error(`Failed to load environment file at ${envPath}: ${result.error.message}`);
      }
      loadedEnvPath = envPath;
      if (!silent) {
        console.log(`[env] Loaded configuration from ${envPath}`);
      }
      return { envPath, projectRoot };
    }
  }

  // Fallback: allow platform-injected env (Render/Vercel) without a local .env file
  dotenv.config();
  if (!silent) {
    console.warn(
      `[env] No .env file found in ${projectRoot}. Using process environment variables only.`
    );
  }
  return { envPath: null, projectRoot };
}

export function getLoadedEnvPath() {
  return loadedEnvPath;
}

export default loadEnv;
