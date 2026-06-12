import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiMonitor,
  FiShoppingBag,
  FiTruck,
  FiPackage,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiMessageSquare,
  FiChevronDown,
  FiUserCheck,
} from 'react-icons/fi';
import NotificationDrawer from '../components/superadmin/NotificationDrawer';
import PortalSidebar from '../components/common/PortalSidebar';
import { useAuth } from '../context/AuthContext';
import { useLogoutConfirm } from '../hooks/useLogoutConfirm';
import { useMobileSidebar } from '../hooks/useMobileSidebar';
import useNotifications from '../hooks/useNotifications';

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { requestLogout, LogoutConfirmDialog } = useLogoutConfirm();
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileSidebar();
  const { notifications, unreadCount } = useNotifications();

  const menuItems = [
    { path: '/super-admin/dashboard', icon: FiGrid, label: 'Dashboard' },
    { path: '/super-admin/platform', icon: FiMonitor, label: 'Platform Monitoring' },
    { path: '/super-admin/admin-approvals', icon: FiUserCheck, label: 'User Approvals' },
    { path: '/super-admin/vendors', icon: FiShoppingBag, label: 'Vendor Management' },
    { path: '/super-admin/delivery-partners', icon: FiTruck, label: 'Delivery Partners' },
    { path: '/super-admin/orders', icon: FiPackage, label: 'Orders' },
    { path: '/super-admin/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/super-admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path;
  const displayName = user?.name || 'Super Admin';
  const displayEmail = user?.email || 'superadmin@mokshith.com';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <PortalSidebar
        id="super-admin-sidebar"
        menuItems={menuItems}
        brandSubtitle="Platform"
        sidebarOpen={sidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        onMobileClose={closeMobileMenu}
        onLogoutClick={requestLogout}
        isActive={isActive}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="lg:hidden flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="super-admin-sidebar"
              >
                {mobileMenuOpen ? <FiX size={20} className="text-gray-600" /> : <FiMenu size={20} className="text-gray-600" />}
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
                aria-label="Toggle sidebar"
              >
                <FiMenu size={20} className="text-gray-600" />
              </button>
              <div className="relative w-full md:w-96 min-w-0">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search across platform..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setNotificationOpen(true)}
                className="relative p-2 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Notifications"
              >
                <FiBell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <button type="button" className="relative p-2 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]" aria-label="Messages">
                <FiMessageSquare size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="hidden md:block text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                  </div>
                  <FiChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                    <Link
                      to="/super-admin/settings"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg min-h-[44px]"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/super-admin/settings"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg min-h-[44px]"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <NotificationDrawer
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
      />

      <LogoutConfirmDialog />
    </div>
  );
};

export default SuperAdminLayout;
