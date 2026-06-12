import { describe, it, expect } from 'vitest';
import {
  mapBackendRoleToFrontend,
  mapFrontendRoleToBackend,
  getDashboardRoute,
} from './roleMap';

describe('roleMap', () => {
  it('maps backend roles to frontend roles', () => {
    expect(mapBackendRoleToFrontend('SUPER_ADMIN')).toBe('super-admin');
    expect(mapBackendRoleToFrontend('ADMIN')).toBe('admin');
    expect(mapBackendRoleToFrontend('B2B_CUSTOMER')).toBe('vendor');
    expect(mapBackendRoleToFrontend('DELIVERY_PARTNER')).toBe('delivery');
  });

  it('maps frontend roles to backend roles', () => {
    expect(mapFrontendRoleToBackend('super-admin')).toBe('SUPER_ADMIN');
    expect(mapFrontendRoleToBackend('admin')).toBe('ADMIN');
    expect(mapFrontendRoleToBackend('vendor')).toBe('B2B_CUSTOMER');
    expect(mapFrontendRoleToBackend('delivery')).toBe('DELIVERY_PARTNER');
  });

  it('returns dashboard routes for frontend roles', () => {
    expect(getDashboardRoute('super-admin')).toBe('/super-admin/dashboard');
    expect(getDashboardRoute('admin')).toBe('/admin/dashboard');
    expect(getDashboardRoute('vendor')).toBe('/vendor/dashboard');
    expect(getDashboardRoute('delivery')).toBe('/delivery/dashboard');
  });
});
