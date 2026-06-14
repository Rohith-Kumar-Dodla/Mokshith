import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useLogoutConfirm } from './useLogoutConfirm';

const performLogoutMock = vi.fn();

vi.mock('./useLogout', () => ({
  useLogout: () => performLogoutMock,
}));

function TestHarness() {
  const { requestLogout, LogoutConfirmDialog } = useLogoutConfirm();

  return (
    <>
      <button type="button" onClick={requestLogout}>
        Open Logout
      </button>
      <LogoutConfirmDialog />
    </>
  );
}

describe('useLogoutConfirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performLogoutMock.mockResolvedValue(undefined);
  });

  it('opens confirmation dialog when logout is requested', () => {
    render(
      <MemoryRouter>
        <TestHarness />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Logout' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
  });

  it('closes dialog on cancel without logging out', () => {
    render(
      <MemoryRouter>
        <TestHarness />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Logout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(performLogoutMock).not.toHaveBeenCalled();
  });

  it('executes logout on confirm', async () => {
    render(
      <MemoryRouter>
        <TestHarness />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Logout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(performLogoutMock).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state and prevents duplicate logout clicks', async () => {
    let resolveLogout;
    performLogoutMock.mockImplementation(
      () => new Promise((resolve) => { resolveLogout = resolve; })
    );

    render(
      <MemoryRouter>
        <TestHarness />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Logout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    expect(logoutButton).toBeDisabled();
    expect(logoutButton).toHaveAttribute('aria-busy', 'true');

    fireEvent.click(logoutButton);
    expect(performLogoutMock).toHaveBeenCalledTimes(1);

    resolveLogout();
    await waitFor(() => {
      expect(performLogoutMock).toHaveBeenCalledTimes(1);
    });
  });
});
