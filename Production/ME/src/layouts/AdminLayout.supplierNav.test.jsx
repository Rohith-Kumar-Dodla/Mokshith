import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { mockMatchMedia } from '../../tests/utils/testHelpers';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Admin', email: 'admin@mokshith.com' },
    logout: vi.fn(),
  }),
}));

vi.mock('../hooks/useNotifications', () => ({
  default: () => ({ notifications: [], unreadCount: 0 }),
}));

vi.mock('../components/admin/NotificationDrawer', () => ({
  default: () => null,
}));

describe('Admin layout supplier nav isolation', () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  it('does not expose Super Admin supplier navigation', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Admin Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: /^Suppliers$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Compare Suppliers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Procurement$/i })).not.toBeInTheDocument();
  });
});
