import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../../src/context/AuthContext';

export function mockMatchMedia(matchesDesktop = true) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: matchesDesktop && query.includes('min-width: 1024px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

export function renderWithRouter(ui, { route = '/', routes } = {}) {
  if (routes) {
    return render(
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    );
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}

export function renderWithAuth(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

export const mockAdminUser = {
  _id: 'admin-1',
  name: 'Test Admin',
  email: 'admin@test.com',
  role: 'ADMIN',
};

export const mockVendorUser = {
  _id: 'vendor-1',
  name: 'Test Vendor',
  businessName: 'Fresh Mart',
  role: 'B2B_CUSTOMER',
};
