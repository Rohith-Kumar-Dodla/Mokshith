import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-secondary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if required role matches user's role
  if (requiredRole && role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
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

export default ProtectedRoute;
