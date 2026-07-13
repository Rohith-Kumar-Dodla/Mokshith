import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function parseJwtSecretFromEnvFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^JWT_SECRET=(.+)$/m);
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // Try next candidate.
  }
  return null;
}

/**
 * Resolve the JWT secret used by the running QA backend.
 * Playwright functional runs against dev:qa which loads `.env.qa`, not `.env`.
 */
export function readBackendJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  const backendDir = path.resolve(process.cwd(), '..', 'b2b-backend');
  const nodeEnv = process.env.NODE_ENV || 'qa';
  const candidates = [
    path.join(backendDir, `.env.${nodeEnv}`),
    path.join(backendDir, '.env.qa'),
    path.join(backendDir, '.env'),
  ];

  for (const candidate of candidates) {
    const secret = parseJwtSecretFromEnvFile(candidate);
    if (secret) {
      return secret;
    }
  }

  return 'test_jwt_secret_key_for_testing_with_minimum_64_characters_required';
}

function base64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

const DEFAULT_ACCESS_TTL_SECONDS = 15 * 60;

export function signTestJwt(
  payload: Record<string, unknown>,
  options: { expiresInSeconds?: number; expired?: boolean } = {}
): string {
  const secret = readBackendJwtSecret();
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const fullPayload = { ...payload };

  if (options.expired) {
    fullPayload.exp = Math.floor(Date.now() / 1000) - 3600;
  } else if (options.expiresInSeconds !== undefined) {
    fullPayload.exp = Math.floor(Date.now() / 1000) + options.expiresInSeconds;
  } else if (fullPayload.exp == null) {
    fullPayload.exp = Math.floor(Date.now() / 1000) + DEFAULT_ACCESS_TTL_SECONDS;
  }

  const body = base64Url(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Re-sign a live access token with an escalated role claim while preserving
 * id/sessionId so authenticate succeeds and RBAC (not JWT claims) enforces role.
 */
export function signEscalatedRoleToken(
  accessToken: string,
  escalatedRole: string
): string {
  const payload = decodeJwtPayload(accessToken);
  return signTestJwt({
    id: payload.id,
    role: escalatedRole,
    ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
  });
}

export function tamperTokenSignature(token: string): string {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return `${token}x`;
  }
  const sig = parts[2];
  const flipped = sig.endsWith('a') ? `${sig.slice(0, -1)}b` : `${sig}a`;
  return `${parts[0]}.${parts[1]}.${flipped}`;
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid JWT structure');
  }
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
}
