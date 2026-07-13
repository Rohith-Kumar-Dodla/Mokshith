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
const CACHE_FILE = path.resolve(process.cwd(), 'test-results', '.functional-session-cache.json');

const sessionCache = new Map<string, ApiSession>();

type DiskEntry = { ts: number; session: ApiSession };
type DiskCache = Record<string, DiskEntry>;

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

async function refreshSession(entry: DiskEntry): Promise<ApiSession> {
  const refreshToken = entry.session?.refreshToken;
  if (!refreshToken) {
    return entry.session;
  }

  const refreshRes = await apiClient.post('/auth/refresh-token', { refreshToken });
  const payload = refreshRes.data?.data ?? refreshRes.data ?? {};
  const csrfToken = (await fetchCsrfTokenApi()) || entry.session.csrfToken;

  const refreshed: ApiSession = {
    ...entry.session,
    accessToken: payload.accessToken || payload.data?.accessToken || entry.session.accessToken,
    refreshToken: payload.refreshToken || payload.data?.refreshToken || entry.session.refreshToken,
    csrfToken,
    user: payload.user ?? payload.data?.user ?? entry.session.user ?? {},
  };

  entry.ts = Date.now();
  entry.session = refreshed;
  return refreshed;
}

export async function loginApiFresh(identifier: string, password: string): Promise<ApiSession> {
  sessionCache.delete(identifier);
  const disk = readDiskCache();
  delete disk[identifier];
  writeDiskCache(disk);
  const session = await performLogin(identifier, password);
  sessionCache.set(identifier, session);
  disk[identifier] = { ts: Date.now(), session };
  writeDiskCache(disk);
  return session;
}

export async function loginApi(identifier: string, password: string): Promise<ApiSession> {
  const mem = sessionCache.get(identifier);
  if (mem) {
    return mem;
  }

  const disk = readDiskCache();
  const entry = disk[identifier];
  if (entry && Date.now() - entry.ts < SESSION_TTL_MS && entry.session?.accessToken) {
    const ageMs = Date.now() - entry.ts;
    if (ageMs > REFRESH_THRESHOLD_MS) {
      try {
        const refreshed = await refreshSession(entry);
        disk[identifier] = entry;
        writeDiskCache(disk);
        sessionCache.set(identifier, refreshed);
        return refreshed;
      } catch {
        // Refresh failed; fall back to existing cached session and let callers re-login if needed.
      }
    }

    sessionCache.set(identifier, entry.session);
    return entry.session;
  }

  const session = await performLogin(identifier, password);
  sessionCache.set(identifier, session);
  disk[identifier] = { ts: Date.now(), session };
  writeDiskCache(disk);
  return session;
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
