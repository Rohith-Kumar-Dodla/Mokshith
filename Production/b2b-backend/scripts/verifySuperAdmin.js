const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';
const EMAIL = 'superadmin@mokshith.com';
const PASSWORD = 'superadmin123';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  return { status: response.status, body, headers: response.headers };
}

function getCookie(headers, name) {
  const cookieHeader = headers.get('set-cookie') || '';
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

async function verifySuperAdmin() {
  console.log('Verifying Super Admin auth flow...');

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: EMAIL, password: PASSWORD }),
  });

  if (login.status !== 200 || !login.body?.data?.accessToken) {
    throw new Error(`Login failed (${login.status}): ${login.body?.message || 'Unknown error'}`);
  }

  console.log('Login verified');

  const accessToken = login.body.data.accessToken;
  const refreshToken = login.body.data.refreshToken;
  const csrfToken = login.body.data.csrfToken || getCookie(login.headers, 'csrf-token');

  const me = await request('/users/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (me.status !== 200 || me.body?.data?.role !== 'SUPER_ADMIN') {
    throw new Error(`Protected route failed (${me.status}): ${me.body?.message || 'Unknown error'}`);
  }

  console.log('Protected route verified:', {
    email: me.body.data.email,
    role: me.body.data.role,
    status: me.body.data.status,
  });

  const logout = await request('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (logout.status !== 200) {
    throw new Error(`Logout failed (${logout.status}): ${logout.body?.message || 'Unknown error'}`);
  }

  console.log('Logout verified');

  const meAfterLogout = await request('/users/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (meAfterLogout.status === 200) {
    console.warn('Warning: access token still accepted immediately after logout');
  } else {
    console.log('Post-logout token rejection verified');
  }

  console.log('\nSuper Admin verification complete.');
}

verifySuperAdmin().catch((error) => {
  console.error('Verification failed:', error.message);
  process.exit(1);
});
