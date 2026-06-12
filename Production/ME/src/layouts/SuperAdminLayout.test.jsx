import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SuperAdminLayout from './SuperAdminLayout';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Super Admin', email: 'superadmin@mokshith.com' },
    logout: vi.fn(),
  }),
}));

vi.mock('../hooks/useLogoutConfirm', () => ({
  useLogoutConfirm: () => ({
    requestLogout: vi.fn(),
    LogoutConfirmDialog: () => null,
  }),
}));

vi.mock('../components/superadmin/NotificationDrawer', () => ({
  default: () => null,
}));

describe('SuperAdminLayout', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query.includes('min-width: 1024px'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('renders only one logout button', () => {
    render(
      <MemoryRouter initialEntries={['/super-admin/dashboard']}>
        <Routes>
          <Route path="/super-admin/*" element={<SuperAdminLayout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryAllByRole('button', { name: /^Logout$/i })).toHaveLength(1);
    // Label updated in production to "User Approvals" — test should match visible text.
    expect(screen.getByRole('link', { name: /User Approvals/i })).toBeInTheDocument();
  }, 10000);
});
