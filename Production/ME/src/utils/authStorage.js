const TAB_SESSION_KEY = 'tabSessionId';
const AUTH_SESSION_PREFIX = 'auth_session_';

const LEGACY_AUTH_KEYS = [
  'accessToken',
  'refreshToken',
  'csrfToken',
  'user',
  'role',
  'isAuthenticated',
  'token',
];

function generateTabSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `tab_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  return `tab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function canUseSessionStorage() {
  return typeof sessionStorage !== 'undefined';
}

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

/**
 * Stable per-tab client session id.
 * Duplicated tabs inherit sessionStorage and intentionally share the same session.
 * Fresh tabs generate a new id and never overwrite another tab's auth.
 */
export function getTabSessionId() {
  if (!canUseSessionStorage()) {
    return 'tab_fallback';
  }

  let tabSessionId = sessionStorage.getItem(TAB_SESSION_KEY);
  if (!tabSessionId) {
    tabSessionId = generateTabSessionId();
    sessionStorage.setItem(TAB_SESSION_KEY, tabSessionId);
  }
  return tabSessionId;
}

export function getAuthSessionKey(tabSessionId = getTabSessionId()) {
  return `${AUTH_SESSION_PREFIX}${tabSessionId}`;
}

function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readLegacySession() {
  if (!canUseLocalStorage()) return null;

  const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const csrfToken = localStorage.getItem('csrfToken');
  const role = localStorage.getItem('role');
  const user = parseJson(localStorage.getItem('user'));
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!accessToken && !refreshToken && !user) {
    return null;
  }

  return {
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
    csrfToken: csrfToken || null,
    user,
    role: role || null,
    isAuthenticated: isAuthenticated || Boolean(accessToken || refreshToken),
  };
}

function clearLegacyAuthKeys() {
  if (!canUseLocalStorage()) return;
  LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('logout');
  localStorage.removeItem('session_replaced');
}

/**
 * One-time migration: move global auth keys into this tab's isolated session bucket.
 * Prevents a newly opened tab from claiming an already-migrated global session.
 */
function migrateLegacySessionIfNeeded() {
  if (!canUseLocalStorage()) return;

  const key = getAuthSessionKey();
  if (localStorage.getItem(key)) {
    return;
  }

  const legacy = readLegacySession();
  if (!legacy) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(legacy));
  clearLegacyAuthKeys();
}

function readSession() {
  if (!canUseLocalStorage()) return null;
  migrateLegacySessionIfNeeded();
  return parseJson(localStorage.getItem(getAuthSessionKey()));
}

function writeSession(nextSession) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(getAuthSessionKey(), JSON.stringify(nextSession));
}

export function getStoredSession() {
  return readSession();
}

export function getAccessToken() {
  const session = readSession();
  return session?.accessToken || null;
}

export function getRefreshToken() {
  const session = readSession();
  return session?.refreshToken || null;
}

export function getCsrfToken() {
  const session = readSession();
  return session?.csrfToken || null;
}

export function getStoredUser() {
  return readSession()?.user || null;
}

export function getStoredRole() {
  return readSession()?.role || null;
}

export function persistSession({ accessToken, refreshToken, csrfToken, user, role } = {}) {
  const current = readSession() || {};
  const next = {
    ...current,
    isAuthenticated: true,
  };

  if (accessToken !== undefined) next.accessToken = accessToken;
  if (refreshToken !== undefined) next.refreshToken = refreshToken;
  if (csrfToken !== undefined) next.csrfToken = csrfToken;
  if (user !== undefined) next.user = user;
  if (role !== undefined) next.role = role;

  writeSession(next);
  // Ensure no leftover global keys can overwrite another tab later.
  clearLegacyAuthKeys();
}

export function clearAuthStorage() {
  if (canUseLocalStorage()) {
    localStorage.removeItem(getAuthSessionKey());
    clearLegacyAuthKeys();
  }

  if (canUseSessionStorage()) {
    sessionStorage.removeItem(TAB_SESSION_KEY);
  }
}
