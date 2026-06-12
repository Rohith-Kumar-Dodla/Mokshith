import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useLogout } from './useLogout';

const logoutMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ logout: logoutMock }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logoutMock.mockResolvedValue(undefined);
  });

  it('calls logout API helper and redirects to login', async () => {
    const { result } = renderHook(() => useLogout(), {
      wrapper: MemoryRouter,
    });

    await act(async () => {
      await result.current();
    });

    expect(logoutMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });
});
