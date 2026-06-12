const AUTH_KEYS = [
  'accessToken',
  'refreshToken',
  'csrfToken',
  'user',
  'role',
  'isAuthenticated',
  'token',
];

export function getAccessToken() {
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

export function getCsrfToken() {
  return localStorage.getItem('csrfToken');
}

export function persistSession({ accessToken, refreshToken, csrfToken, user, role }) {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (csrfToken) localStorage.setItem('csrfToken', csrfToken);
  if (user) localStorage.setItem('user', JSON.stringify(user));
  if (role) localStorage.setItem('role', role);
  localStorage.setItem('isAuthenticated', 'true');
}

export function clearAuthStorage() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}
