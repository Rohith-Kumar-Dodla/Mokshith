import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { routes } from '../../routes/routeConfig.js';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useSelector((state) => state.auth);
  const { config } = useSelector((state) => state.superAdmin);

  const token = localStorage.getItem('token');
  const hasValidToken = !!token;

  if (authLoading) return <div>Authenticating...</div>;

  if (!isAuthenticated || !hasValidToken) {
    return <Navigate to={routes.LOGIN} />;
  }

  if (config?.maintenanceMode && user?.role !== "SUPER_ADMIN") {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-8 bg-gray-50">
        <div className="w-24 h-24 bg-amber-100 rounded-3xl flex items-center justify-center text-4xl mb-8">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Under Maintenance</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          We are performing scheduled maintenance to improve our services. Please check back shortly.
        </p>
        <button
          onClick={() => window.location.href = "/login"}
          className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
