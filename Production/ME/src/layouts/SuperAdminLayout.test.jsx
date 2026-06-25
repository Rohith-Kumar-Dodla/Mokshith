import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SuperAdminLayout from './SuperAdminLayout';
import { mockMatchMedia } from '../../tests/utils/testHelpers';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Super Admin', email: 'superadmin@mokshith.com' },
    logout: vi.fn(),
  }),
}));

vi.mock('../hooks/useNotifications', () => ({
  default: () => ({ notifications: [], unreadCount: 0 }),
}));

vi.mock('../components/superadmin/NotificationDrawer', () => ({
  default: () => null,
}));

describe('SuperAdminLayout', () => {
  beforeEach(() => {
    mockMatchMedia(true);
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
    // User Management link should be in the sidebar menu
    expect(screen.getByRole('link', { name: /User Management/i })).toBeInTheDocument();
  });
});
