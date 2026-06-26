import { generateCsrfToken } from '../../src/middlewares/csrf.middleware.js';

/**
 * Perform login via supertest and return session artifacts.
 */
export async function loginUser(request, { identifier, password, mobile } = {}) {
  const loginIdentifier = identifier || mobile;
  const response = await request
    .post('/api/v1/auth/login')
    .send({ identifier: loginIdentifier, mobile: loginIdentifier, password })
    .expect(200);

  const data = response.body?.data ?? {};
  return {
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    csrfToken: data.csrfToken,
    response,
  };
}

/**
 * Headers for authenticated state-changing API calls (CSRF double-submit).
 */
export function authenticatedHeaders({ accessToken, csrfToken }) {
  const token = csrfToken || generateCsrfToken();
  return {
    Authorization: `Bearer ${accessToken}`,
    'x-csrf-token': token,
    Cookie: `csrf-token=${token}`,
  };
}

/**
 * Headers for authenticated read-only API calls.
 */
export function bearerHeaders(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

/**
 * Apply authenticated + CSRF headers to a supertest request chain.
 */
export function withAuth(requestBuilder, { accessToken, csrfToken }) {
  const headers = authenticatedHeaders({ accessToken, csrfToken });
  let chain = requestBuilder.set('Authorization', headers.Authorization);
  chain = chain.set('x-csrf-token', headers['x-csrf-token']);
  return chain.set('Cookie', headers.Cookie);
}

/**
 * Build session from integrationFixtures seedActiveUser output.
 */
export function sessionHeaders(session) {
  return authenticatedHeaders({
    accessToken: session.accessToken,
    csrfToken: session.csrfToken,
  });
}

export function withCsrf(requestBuilder, session) {
  return withAuth(requestBuilder, {
    accessToken: session.accessToken,
    csrfToken: session.csrfToken,
  });
}

export default {
  loginUser,
  authenticatedHeaders,
  bearerHeaders,
  withAuth,
  withCsrf,
  sessionHeaders,
};
