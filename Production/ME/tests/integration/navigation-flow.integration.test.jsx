import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from '../../src/layouts/AdminLayout';
import { mockMatchMedia } from '../utils/testHelpers';

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test Admin', role: 'ADMIN' },
    logout: vi.fn(),
  }),
}));

vi.mock('../../src/hooks/useLogoutConfirm', () => ({
  useLogoutConfirm: () => ({
    requestLogout: vi.fn(),
    LogoutConfirmDialog: () => null,
  }),
}));

vi.mock('../../src/hooks/useNotifications', () => ({
  default: () => ({ notifications: [], unreadCount: 0 }),
}));

vi.mock('../../src/components/admin/NotificationDrawer', () => ({
  default: () => null,
}));

describe('Navigation Flow Integration', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('opens and closes mobile menu from header hamburger', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
            <Route path="orders" element={<div>Orders Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(menuButton);
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });

  it('closes mobile menu after navigating to another route', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
            <Route path="orders" element={<div>Orders Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /Orders/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
    });
  });

  it('renders sidebar logout control', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: /^Logout$/i })).toBeInTheDocument();
  });
});
