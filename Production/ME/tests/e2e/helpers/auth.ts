import { Page } from '@playwright/test';

const API_BASE = '**/api/v1/**';

export async function seedAuthenticatedSession(page: Page, role: 'admin' | 'vendor' | 'delivery' | 'super-admin' = 'admin') {
  const roleMap = {
    admin: { backend: 'ADMIN', route: '/admin/dashboard', name: 'Test Admin' },
    vendor: { backend: 'B2B_CUSTOMER', route: '/vendor/dashboard', name: 'Test Vendor' },
    delivery: { backend: 'DELIVERY_PARTNER', route: '/delivery/dashboard', name: 'Test Delivery' },
    'super-admin': { backend: 'SUPER_ADMIN', route: '/super-admin/dashboard', name: 'Test Super Admin' },
  };

  const config = roleMap[role];
  const user = {
    _id: 'test-user-id',
    name: config.name,
    email: `${role}@test.com`,
    role: config.backend,
  };

  await page.route(`${API_BASE}/users/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: user }),
    });
  });

  await page.route(`${API_BASE}/auth/refresh-token`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { accessToken: 'test-access', refreshToken: 'test-refresh', user },
      }),
    });
  });

  await page.route(`${API_BASE}/auth/csrf-token`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { csrfToken: 'test-csrf' } }),
    });
  });

  await page.route(`${API_BASE}/auth/logout`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.addInitScript(({ sessionUser, frontendRole }) => {
    localStorage.setItem('accessToken', 'test-access');
    localStorage.setItem('refreshToken', 'test-refresh');
    localStorage.setItem('csrfToken', 'test-csrf');
    localStorage.setItem('user', JSON.stringify(sessionUser));
    localStorage.setItem('role', frontendRole);
    localStorage.setItem('isAuthenticated', 'true');
  }, { sessionUser: user, frontendRole: role });

  return { user, dashboardRoute: config.route };
}

export async function mockNotifications(page: Page) {
  await page.route(`${API_BASE}/notifications**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}
