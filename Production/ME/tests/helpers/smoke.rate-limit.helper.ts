import { execSync } from 'child_process';
import path from 'path';

/**
 * Clears Redis auth/fraud counters before late smoke specs.
 *
 * Smoke runs many UI logins in one worker; under strict auth the fraud service
 * blocks loopback after 15 attempts / 15 min. This is deterministic test
 * maintenance — it does not weaken production fraud detection.
 */
export function clearSmokeAuthRateLimits(): void {
  try {
    const script = path.resolve(process.cwd(), '..', 'b2b-backend', 'scripts', 'clearAuthRateLimits.js');
    execSync(`node "${script}"`, {
      stdio: 'ignore',
      env: { ...process.env, NODE_ENV: 'qa' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Warning: failed to clear auth rate limits for smoke:', message);
  }
}
