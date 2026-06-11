import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { routes } from '../../routes/routeConfig.js';
import { Menu, Bell, User, LogOut, Settings, ChevronDown, Sun, Moon } from 'lucide-react';

const SuperAdminHeader = ({ onMenuClick, pageTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(routes.LOGIN, { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      [routes.SUPER_ADMIN]: 'Dashboard',
      [routes.SUPER_ADMIN_PARTNERS]: 'B2B Partners',
      [routes.SUPER_ADMIN_CUSTOMERS]: 'B2B Customers',
      [routes.SUPER_ADMIN_DELIVERY_PARTNERS]: 'Delivery Partners',
      [routes.SUPER_ADMIN_ADMINS]: 'Administrators',
      [routes.SUPER_ADMIN_CATEGORIES]: 'Categories',
      [routes.SUPER_ADMIN_PRODUCTS]: 'Products',
      [routes.SUPER_ADMIN_INVENTORY]: 'Inventory',
      [routes.SUPER_ADMIN_ORDERS]: 'Orders',
      [routes.SUPER_ADMIN_CREDIT]: 'Credit Management',
      [routes.SUPER_ADMIN_REVENUE]: 'Revenue Analytics',
      [routes.SUPER_ADMIN_CONFIGURATION]: 'System Configuration',
      [routes.SUPER_ADMIN_FEATURES]: 'Feature Flags',
      [routes.SUPER_ADMIN_SECURITY]: 'Security Panel',
      [routes.SUPER_ADMIN_AUDIT]: 'Audit Trail',
      [routes.SUPER_ADMIN_LOGS]: 'Export Logs',
      [routes.SUPER_ADMIN_SETTINGS]: 'Platform Settings',
      [routes.SUPER_ADMIN_PROFILE]: 'Account Settings',
    };
    return titles[path] || pageTitle || 'Dashboard';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors relative"
        >
          {isDark ? <Sun size={18} className="text-gray-600" /> : <Moon size={18} className="text-gray-600" />}
        </button>

        {/* Notifications */}
        <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell size={18} className="text-gray-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-gray-900">Super Admin</p>
              <p className="text-xs text-gray-500 font-medium">Super Administrator</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                <button
                  onClick={() => {
                    navigate(routes.SUPER_ADMIN_PROFILE);
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  onClick={() => {
                    navigate(routes.SUPER_ADMIN_SETTINGS);
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <div className="border-t border-gray-200 my-2" />
                <button
                  onClick={() => {
                    setShowLogoutConfirm(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Logout</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default SuperAdminHeader;
