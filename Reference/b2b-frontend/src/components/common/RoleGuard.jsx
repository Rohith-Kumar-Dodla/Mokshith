import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { routes } from '../../routes/routeConfig.js';

const RoleGuard = ({ children, allowedRoles, roles }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const effectiveRoles = roles || allowedRoles || [];

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50/50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-blue-200"></div>
      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Checking permissions</p>
    </div>
  );

  if (!isAuthenticated) {
    return <Navigate to={routes.LOGIN} />;
  }

  if (!effectiveRoles.includes(user?.role)) {
    const defaultRoutes = {
      'SUPER_ADMIN': routes.SUPER_ADMIN,
      'ADMIN': routes.ADMIN,
      'DELIVERY_PARTNER': routes.DELIVERY,
      'B2B_CUSTOMER': routes.DASHBOARD,
      'B2C_CUSTOMER': routes.HOME,
      'VENDOR': routes.ADMIN
    };
    return <Navigate to={defaultRoutes[user?.role] || routes.HOME} />;
  }

  return children;
};

export default RoleGuard;