import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const authState = vi.hoisted(() => ({
  current: { isAuthenticated: true, role: 'super-admin', loading: false },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState.current,
}));

function renderProtectedSupplierRoute() {
  return render(
    <MemoryRouter initialEntries={['/supplier-dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Public home</div>} />
        <Route path="/admin/dashboard" element={<div>Admin dashboard</div>} />
        <Route path="/vendor/dashboard" element={<div>Vendor dashboard</div>} />
        <Route path="/delivery/dashboard" element={<div>Delivery dashboard</div>} />
        <Route
          path="/supplier-dashboard"
          element={<ProtectedRoute requiredRole="super-admin"><div>Supplier portal</div></ProtectedRoute>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('Supplier Dashboard Phase 0 authorization', () => {
  beforeEach(() => {
    authState.current = { isAuthenticated: true, role: 'super-admin', loading: false };
  });

  it('allows SUPER_ADMIN', () => {
    renderProtectedSupplierRoute();
    expect(screen.getByText('Supplier portal')).toBeInTheDocument();
  });

  it.each([
    ['admin', 'Admin dashboard'],
    ['supplier', 'Public home'],
    ['vendor', 'Vendor dashboard'],
    ['delivery', 'Delivery dashboard'],
  ])('denies %s', (role, destination) => {
    authState.current = { isAuthenticated: true, role, loading: false };
    renderProtectedSupplierRoute();
    expect(screen.queryByText('Supplier portal')).not.toBeInTheDocument();
    expect(screen.getByText(destination)).toBeInTheDocument();
  });

  it('redirects logged-out users to the existing login flow', () => {
    authState.current = { isAuthenticated: false, role: null, loading: false };
    renderProtectedSupplierRoute();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
