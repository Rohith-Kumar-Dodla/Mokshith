import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from '../../src/layouts/AdminLayout';
import ConfirmDialog from '../../src/components/common/ConfirmDialog';
import { mockMatchMedia } from '../utils/testHelpers';

const logoutMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test Admin', role: 'ADMIN' },
    logout: logoutMock,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../src/hooks/useNotifications', () => ({
  default: () => ({ notifications: [], unreadCount: 0 }),
}));

vi.mock('../../src/components/admin/NotificationDrawer', () => ({
  default: () => null,
}));

describe('Auth Logout Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(true);
    logoutMock.mockResolvedValue(undefined);
  });

  it('shows logout confirmation before signing out', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^Logout$/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to logout from your account?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it('completes logout when confirmed', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^Logout$/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('exposes accessible dialog semantics', () => {
    render(
      <ConfirmDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Logout"
        message="Are you sure you want to logout from your account?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
      />
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'confirm-dialog-message');
  });
});
