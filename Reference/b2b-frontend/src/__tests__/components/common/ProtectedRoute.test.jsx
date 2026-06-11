import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../utils/testUtils.jsx';
import ProtectedRoute from '../../../components/common/ProtectedRoute.jsx';

describe('ProtectedRoute Component', () => {
  describe('authenticated user', () => {
    it('should render children when user is authenticated', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Test User', role: 'B2B_CUSTOMER' },
          token: 'valid-token',
          loading: false,
        },
        superAdmin: {
          config: { maintenanceMode: false },
        },
      };

      localStorage.setItem('token', 'valid-token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow superadmin during maintenance mode', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Super Admin', role: 'SUPER_ADMIN' },
          token: 'admin-token',
          loading: false,
        },
        superAdmin: {
          config: { maintenanceMode: true },
        },
      };

      localStorage.setItem('token', 'admin-token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Admin Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });

  describe('unauthenticated user', () => {
    it('should redirect to login when not authenticated', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
        },
        superAdmin: {
          config: {},
        },
      };

      localStorage.removeItem('token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { preloadedState, route: '/dashboard' }
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect when token is missing from localStorage', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Test User' },
          token: 'token',
          loading: false,
        },
        superAdmin: {
          config: {},
        },
      };

      // Remove token from localStorage
      localStorage.removeItem('token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading message when auth is loading', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: false,
          user: null,
          token: null,
          loading: true,
        },
        superAdmin: {
          config: {},
        },
      };

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('maintenance mode', () => {
    it('should show maintenance message for non-superadmin users', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Regular User', role: 'B2B_CUSTOMER' },
          token: 'valid-token',
          loading: false,
        },
        superAdmin: {
          config: { maintenanceMode: true },
        },
      };

      localStorage.setItem('token', 'valid-token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.getByText('System Under Maintenance')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should display maintenance icon', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'User', role: 'B2B_CUSTOMER' },
          token: 'token',
          loading: false,
        },
        superAdmin: {
          config: { maintenanceMode: true },
        },
      };

      localStorage.setItem('token', 'token');

      const { container } = renderWithProviders(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.getByText('🚧')).toBeInTheDocument();
    });

    it('should show back to login button in maintenance mode', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'User', role: 'B2B_CUSTOMER' },
          token: 'token',
          loading: false,
        },
        superAdmin: {
          config: { maintenanceMode: true },
        },
      };

      localStorage.setItem('token', 'token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      const backButton = screen.getByText('Back to Login');
      expect(backButton).toBeInTheDocument();
      expect(backButton.tagName).toBe('BUTTON');
    });
  });

  describe('different user roles', () => {
    const roles = ['B2B_CUSTOMER', 'B2C_CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER'];

    roles.forEach(role => {
      it(`should allow authenticated ${role}`, () => {
        const preloadedState = {
          auth: {
            isAuthenticated: true,
            user: { id: '1', name: 'User', role },
            token: 'token',
            loading: false,
          },
          superAdmin: {
            config: { maintenanceMode: false },
          },
        };

        localStorage.setItem('token', 'token');

        renderWithProviders(
          <ProtectedRoute>
            <div>Content for {role}</div>
          </ProtectedRoute>,
          { preloadedState }
        );

        expect(screen.getByText(`Content for ${role}`)).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle missing user object', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: null,
          token: 'token',
          loading: false,
        },
        superAdmin: {
          config: {},
        },
      };

      localStorage.setItem('token', 'token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle missing config object', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'User', role: 'B2B_CUSTOMER' },
          token: 'token',
          loading: false,
        },
        superAdmin: {
          config: null,
        },
      };

      localStorage.setItem('token', 'token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle undefined maintenanceMode', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'User', role: 'B2B_CUSTOMER' },
          token: 'token',
          loading: false,
        },
        superAdmin: {
          config: { maintenanceMode: undefined },
        },
      };

      localStorage.setItem('token', 'token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle nested children components', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'User', role: 'B2B_CUSTOMER' },
          token: 'token',
          loading: false,
        },
        superAdmin: {
          config: {},
        },
      };

      localStorage.setItem('token', 'token');

      renderWithProviders(
        <ProtectedRoute>
          <div>
            <h1>Heading</h1>
            <div>
              <p>Nested Content</p>
            </div>
          </div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.getByText('Heading')).toBeInTheDocument();
      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });
  });

  describe('token validation', () => {
    it('should check both Redux state and localStorage for token', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'User' },
          token: 'redux-token',
          loading: false,
        },
        superAdmin: {
          config: {},
        },
      };

      localStorage.setItem('token', 'localStorage-token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should redirect if authenticated but no localStorage token', () => {
      const preloadedState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'User' },
          token: 'redux-token',
          loading: false,
        },
        superAdmin: {
          config: {},
        },
      };

      localStorage.removeItem('token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>,
        { preloadedState }
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
  });
});
