import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Navigate } from 'react-router-dom';
import { renderWithProviders } from '../../utils/testUtils.jsx';
import RoleGuard from '../../../components/common/RoleGuard.jsx';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(() => null),
  };
});

describe('RoleGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Protected Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: { loading: true, isAuthenticated: false, user: null },
          },
        }
      );

      expect(screen.getByText(/checking permissions/i)).toBeInTheDocument();
    });

    it('should show spinner animation', () => {
      const { container } = renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Protected Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: { loading: true, isAuthenticated: false, user: null },
          },
        }
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('authentication checks', () => {
    it('should redirect to login when not authenticated', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Protected Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: { loading: false, isAuthenticated: false, user: null },
          },
        }
      );

      expect(Navigate).toHaveBeenCalled();
      expect(Navigate.mock.calls[0][0]).toHaveProperty('to', '/login');
    });

    it('should render children when authenticated with correct role', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Protected Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'ADMIN', name: 'Admin User' },
            },
          },
        }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect when authenticated but wrong role', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Protected Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'B2B_CUSTOMER', name: 'Customer' },
            },
          },
        }
      );

      expect(Navigate).toHaveBeenCalled();
    });
  });

  describe('role-based access', () => {
    it('should allow SUPER_ADMIN role', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['SUPER_ADMIN']}>
          <div>Super Admin Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'SUPER_ADMIN' },
            },
          },
        }
      );

      expect(screen.getByText('Super Admin Content')).toBeInTheDocument();
    });

    it('should allow ADMIN role', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Admin Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'ADMIN' },
            },
          },
        }
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should allow B2B_CUSTOMER role', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['B2B_CUSTOMER']}>
          <div>Customer Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'B2B_CUSTOMER' },
            },
          },
        }
      );

      expect(screen.getByText('Customer Content')).toBeInTheDocument();
    });

    it('should allow DELIVERY_PARTNER role', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['DELIVERY_PARTNER']}>
          <div>Delivery Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'DELIVERY_PARTNER' },
            },
          },
        }
      );

      expect(screen.getByText('Delivery Content')).toBeInTheDocument();
    });

    it('should allow multiple roles', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
          <div>Admin Area</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'ADMIN' },
            },
          },
        }
      );

      expect(screen.getByText('Admin Area')).toBeInTheDocument();
    });
  });

  describe('roles prop alias', () => {
    it('should accept roles prop instead of allowedRoles', () => {
      renderWithProviders(
        <RoleGuard roles={['ADMIN']}>
          <div>Protected Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'ADMIN' },
            },
          },
        }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should prioritize roles over allowedRoles', () => {
      renderWithProviders(
        <RoleGuard roles={['ADMIN']} allowedRoles={['B2B_CUSTOMER']}>
          <div>Protected Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'ADMIN' },
            },
          },
        }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('redirect behavior', () => {
    it('should redirect SUPER_ADMIN to super admin dashboard', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'SUPER_ADMIN' },
            },
          },
        }
      );

      expect(Navigate).toHaveBeenCalled();
    });

    it('should redirect B2B_CUSTOMER to dashboard', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'B2B_CUSTOMER' },
            },
          },
        }
      );

      expect(Navigate).toHaveBeenCalled();
    });

    it('should redirect B2C_CUSTOMER to home', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'B2C_CUSTOMER' },
            },
          },
        }
      );

      expect(Navigate).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty allowedRoles array', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={[]}>
          <div>Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'ADMIN' },
            },
          },
        }
      );

      expect(Navigate).toHaveBeenCalled();
    });

    it('should handle missing user object', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: null,
            },
          },
        }
      );

      expect(Navigate).toHaveBeenCalled();
    });

    it('should handle undefined user role', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { name: 'User' },
            },
          },
        }
      );

      expect(Navigate).toHaveBeenCalled();
    });

    it('should handle case-sensitive role matching', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['admin']}>
          <div>Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: {
              loading: false,
              isAuthenticated: true,
              user: { role: 'ADMIN' },
            },
          },
        }
      );

      expect(Navigate).toHaveBeenCalled();
    });
  });

  describe('loading states visual', () => {
    it('should display loading message', () => {
      renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: { loading: true, isAuthenticated: false, user: null },
          },
        }
      );

      expect(screen.getByText(/checking permissions/i)).toBeInTheDocument();
    });

    it('should have loading container styles', () => {
      const { container } = renderWithProviders(
        <RoleGuard allowedRoles={['ADMIN']}>
          <div>Content</div>
        </RoleGuard>,
        {
          preloadedState: {
            auth: { loading: true, isAuthenticated: false, user: null },
          },
        }
      );

      const loadingContainer = container.querySelector('.min-h-screen');
      expect(loadingContainer).toBeInTheDocument();
    });
  });
});
