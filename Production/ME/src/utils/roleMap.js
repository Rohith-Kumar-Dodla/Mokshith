export const BACKEND_TO_FRONTEND_ROLE = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  B2B_CUSTOMER: 'vendor',
  DELIVERY_PARTNER: 'delivery',
};

export const FRONTEND_TO_BACKEND_ROLE = {
  'super-admin': 'SUPER_ADMIN',
  admin: 'ADMIN',
  vendor: 'B2B_CUSTOMER',
  delivery: 'DELIVERY_PARTNER',
};

const DASHBOARD_ROUTES = {
  'super-admin': '/super-admin/dashboard',
  admin: '/admin/dashboard',
  vendor: '/vendor/dashboard',
  delivery: '/delivery/dashboard',
};

export function mapBackendRoleToFrontend(backendRole) {
  return BACKEND_TO_FRONTEND_ROLE[backendRole] ?? null;
}

export function mapFrontendRoleToBackend(frontendRole) {
  return FRONTEND_TO_BACKEND_ROLE[frontendRole] ?? null;
}

export function getDashboardRoute(frontendRole) {
  return DASHBOARD_ROUTES[frontendRole] ?? '/';
}
