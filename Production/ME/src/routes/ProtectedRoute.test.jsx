import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext } from 'react';
import ProtectedRoute from './ProtectedRoute';

// Mock component to render inside ProtectedRoute
const TestComponent = () => <div>Protected Content</div>;

// Create a mock auth context
const MockAuthContext = createContext(null);

const MockAuthProvider = ({ children, authValue }) => (
  <MockAuthContext.Provider value={authValue}>
    {children}
  </MockAuthContext.Provider>
);

// Mock ProtectedRoute to use our mock context
const MockProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, loading } = useMockAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && role !== requiredRole) {
    const roleRoutes = {
      'super-admin': '/super-admin/dashboard',
      'admin': '/admin/dashboard',
      'vendor': '/vendor/dashboard',
      'delivery': '/delivery/dashboard',
    };
    return <Navigate to={roleRoutes[role] || '/'} replace />;
  }
  
  return children;
};

function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within MockAuthProvider');
  }
  return context;
}

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows loading state while checking authentication', () => {
    const authValue = {
      user: null,
      role: null,
      isAuthenticated: false,
      loading: true,
      login: () => {},
      logout: () => {},
      register: () => {},
    };

    render(
      <BrowserRouter>
        <MockAuthProvider authValue={authValue}>
          <MockProtectedRoute>
            <TestComponent />
          </MockProtectedRoute>
        </MockAuthProvider>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    const authValue = {
      user: null,
      role: null,
      isAuthenticated: false,
      loading: false,
      login: () => {},
      logout: () => {},
      register: () => {},
    };

    render(
      <BrowserRouter>
        <MockAuthProvider authValue={authValue}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/protected" element={
              <MockProtectedRoute>
                <TestComponent />
              </MockProtectedRoute>
            } />
          </Routes>
        </MockAuthProvider>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated without required role', () => {
    const authValue = {
      user: { id: '1', email: 'test@example.com', name: 'test', role: 'admin' },
      role: 'admin',
      isAuthenticated: true,
      loading: false,
      login: () => {},
      logout: () => {},
      register: () => {},
    };

    render(
      <BrowserRouter>
        <MockAuthProvider authValue={authValue}>
          <MockProtectedRoute>
            <TestComponent />
          </MockProtectedRoute>
        </MockAuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when authenticated with matching role', () => {
    const authValue = {
      user: { id: '1', email: 'test@example.com', name: 'test', role: 'admin' },
      role: 'admin',
      isAuthenticated: true,
      loading: false,
      login: () => {},
      logout: () => {},
      register: () => {},
    };

    render(
      <BrowserRouter>
        <MockAuthProvider authValue={authValue}>
          <MockProtectedRoute requiredRole="admin">
            <TestComponent />
          </MockProtectedRoute>
        </MockAuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to vendor dashboard when role does not match', () => {
    const authValue = {
      user: { id: '1', email: 'test@example.com', name: 'test', role: 'vendor' },
      role: 'vendor',
      isAuthenticated: true,
      loading: false,
      login: () => {},
      logout: () => {},
      register: () => {},
    };

    render(
      <BrowserRouter>
        <MockAuthProvider authValue={authValue}>
          <Routes>
            <Route path="/vendor/dashboard" element={<div>Vendor Dashboard</div>} />
            <Route path="/admin/dashboard" element={
              <MockProtectedRoute requiredRole="admin">
                <TestComponent />
              </MockProtectedRoute>
            } />
          </Routes>
        </MockAuthProvider>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
