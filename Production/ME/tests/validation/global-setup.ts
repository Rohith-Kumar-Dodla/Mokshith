import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  try {
    const cacheFile = path.resolve(process.cwd(), 'test-results', '.validation-session-cache.json');
    fs.rmSync(cacheFile, { force: true });
  } catch {
    // ignore
  }

  try {
    const script = path.resolve(process.cwd(), '..', 'b2b-backend', 'scripts', 'clearAuthRateLimits.js');
    execSync(`node "${script}"`, { stdio: 'ignore' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Validation global-setup: failed to clear auth rate limits:', message);
  }
}
