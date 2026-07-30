import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import { fetchCsrfTokenApi } from './csrf.helper';

export type ApiSession = {
  accessToken: string;
  refreshToken?: string;
  csrfToken: string;
  user: Record<string, unknown>;
};

async function performLogin(identifier: string, password: string): Promise<ApiSession> {
  const loginRes = await apiClient.post('/auth/login', {
    identifier,
    mobile: identifier,
    password,
  });

  const payload = loginRes.data?.data ?? loginRes.data ?? {};
  const csrfToken = payload.csrfToken || (await fetchCsrfTokenApi());

  if (!payload.accessToken) {
    throw new Error(`loginApi failed: no accessToken for ${identifier}`);
  }

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    csrfToken,
    user: payload.user ?? {},
  };
}

/**
 * Root Cause A mitigation: cache one authenticated session per role identifier.
 *
 * Two cache layers:
 *  1. In-memory (per worker) — fastest path within a single worker.
 *  2. On-disk (shared across workers) — Playwright restarts the worker process
 *     after any test failure, which wipes in-memory state and would otherwise
 *     force a fresh login per role after every failure. Persisting the session
 *     to disk lets restarted workers reuse the existing tokens, so the entire
 *     functional run performs only ~1 login per role regardless of failures.
 *
 * This does NOT weaken fraud detection — it only stops the test suite from
 * generating unnecessary authentication traffic. Tokens are reused, not forged.
 */
const SESSION_TTL_MS = 10 * 60 * 1000;
const REFRESH_THRESHOLD_MS = 4 * 60 * 1000;
/** Access JWTs expire at 15m; refresh/re-login before auth middleware returns 401. */
const ACCESS_TOKEN_SKEW_MS = 60 * 1000;
const CACHE_FILE = path.resolve(process.cwd(), 'test-results', '.functional-session-cache.json');

type DiskEntry = { ts: number; session: ApiSession };
type DiskCache = Record<string, DiskEntry>;

const sessionCache = new Map<string, DiskEntry>();

function readDiskCache(): DiskCache {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as DiskCache;
  } catch {
    return {};
  }
}

function writeDiskCache(cache: DiskCache) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  } catch {
    // Non-fatal: fall back to in-memory only.
  }
}

function accessTokenExpiresAtMs(accessToken: string): number | null {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isAccessTokenUsable(accessToken: string | undefined): boolean {
  if (!accessToken) return false;
  const expMs = accessTokenExpiresAtMs(accessToken);
  if (expMs == null) return true;
  return expMs - Date.now() > ACCESS_TOKEN_SKEW_MS;
}

function persistSession(identifier: string, session: ApiSession): ApiSession {
  // Keep a stable session object identity so suite-level holders (beforeAll
  // ApiSession refs) stay live when login/refresh replaces tokens.
  const existing = sessionCache.get(identifier)?.session;
  const stable =
    existing && existing !== session
      ? Object.assign(existing, {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          csrfToken: session.csrfToken,
          user: session.user,
        })
      : session;
  const entry: DiskEntry = { ts: Date.now(), session: stable };
  sessionCache.set(identifier, entry);
  const disk = readDiskCache();
  disk[identifier] = entry;
  writeDiskCache(disk);
  return stable;
}

async function refreshSession(entry: DiskEntry): Promise<ApiSession> {
  const refreshToken = entry.session?.refreshToken;
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const refreshRes = await apiClient.post('/auth/refresh-token', { refreshToken });
  const payload = refreshRes.data?.data ?? refreshRes.data ?? {};
  const nextAccess = payload.accessToken || payload.data?.accessToken;
  if (!nextAccess) {
    throw new Error('Refresh response missing accessToken');
  }
  const csrfToken = (await fetchCsrfTokenApi()) || entry.session.csrfToken;

  entry.session.accessToken = nextAccess;
  entry.session.refreshToken =
    payload.refreshToken || payload.data?.refreshToken || entry.session.refreshToken;
  entry.session.csrfToken = csrfToken;
  entry.session.user = payload.user ?? payload.data?.user ?? entry.session.user ?? {};
  entry.ts = Date.now();
  return entry.session;
}

async function probeAccessToken(accessToken: string): Promise<boolean> {
  try {
    await apiClient.get('/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Access JWTs can still decode after a re-login replaced activeSessionId.
 * Probing /users/me catches SESSION_REPLACED before the browser interceptor
 * clears storage and hard-redirects to /login (blank restore failure).
 */
export async function ensureLiveSession(
  identifier: string,
  password: string,
  session: ApiSession
): Promise<ApiSession> {
  if (session?.accessToken && (await probeAccessToken(session.accessToken))) {
    return session;
  }

  let next: ApiSession;
  const entry: DiskEntry = { ts: Date.now(), session };
  try {
    const refreshed = await refreshSession(entry);
    if (await probeAccessToken(refreshed.accessToken)) {
      next = refreshed;
    } else {
      next = await performLogin(identifier, password);
    }
  } catch {
    next = await performLogin(identifier, password);
  }

  Object.assign(session, {
    accessToken: next.accessToken,
    refreshToken: next.refreshToken,
    csrfToken: next.csrfToken,
    user: next.user,
  });
  return persistSession(identifier, session);
}

async function resolveCachedSession(
  identifier: string,
  password: string,
  entry: DiskEntry
): Promise<ApiSession> {
  const ageMs = Date.now() - entry.ts;
  const tokenOk = isAccessTokenUsable(entry.session?.accessToken);
  const withinTtl = ageMs < SESSION_TTL_MS;

  if (withinTtl && tokenOk && ageMs <= REFRESH_THRESHOLD_MS) {
    sessionCache.set(identifier, entry);
    return entry.session;
  }

  if (withinTtl) {
    try {
      return persistSession(identifier, await refreshSession(entry));
    } catch {
      // Refresh failed or token unusable — fall through to fresh login.
    }
  }

  return persistSession(identifier, await performLogin(identifier, password));
}

export async function loginApiFresh(identifier: string, password: string): Promise<ApiSession> {
  sessionCache.delete(identifier);
  const disk = readDiskCache();
  delete disk[identifier];
  writeDiskCache(disk);
  return persistSession(identifier, await performLogin(identifier, password));
}

export async function loginApi(identifier: string, password: string): Promise<ApiSession> {
  const mem = sessionCache.get(identifier);
  if (mem) {
    return resolveCachedSession(identifier, password, mem);
  }

  const disk = readDiskCache();
  const entry = disk[identifier];
  if (entry?.session?.accessToken) {
    return resolveCachedSession(identifier, password, entry);
  }

  return persistSession(identifier, await performLogin(identifier, password));
}

export function clearSessionCache() {
  sessionCache.clear();
  try {
    fs.rmSync(CACHE_FILE, { force: true });
  } catch {
    // ignore
  }
}

export function authHeaders(session: Pick<ApiSession, 'accessToken' | 'csrfToken'>) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'x-csrf-token': session.csrfToken,
    Cookie: `csrf-token=${session.csrfToken}`,
  };
}
