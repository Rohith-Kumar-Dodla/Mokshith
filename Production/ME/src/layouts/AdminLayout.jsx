import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiBox,
  FiFolder,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX,
  FiBell,
  FiLifeBuoy,
} from 'react-icons/fi';
import NotificationDrawer from '../components/admin/NotificationDrawer';
import PortalSidebar from '../components/common/PortalSidebar';
import { useLogoutConfirm } from '../hooks/useLogoutConfirm';
import { useMobileSidebar } from '../hooks/useMobileSidebar';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const { requestLogout, LogoutConfirmDialog } = useLogoutConfirm();
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileSidebar();
  const { notifications, unreadCount } = useNotifications();
  const { user } = useAuth();

  const displayName = user?.name || 'Admin';
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  const menuItems = [
    { path: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
    { path: '/admin/categories', icon: FiFolder, label: 'Categories' },
    { path: '/admin/products', icon: FiBox, label: 'Products' },
    { path: '/admin/inventory', icon: FiPackage, label: 'Inventory' },
    { path: '/admin/vendors', icon: FiShoppingBag, label: 'Vendors' },
    { path: '/admin/orders', icon: FiTruck, label: 'Orders' },
    // Payment Verifications moved to Super Admin
    { path: '/admin/delivery-assignment', icon: FiTruck, label: 'Delivery Assignment' },
    { path: '/admin/reports', icon: FiFileText, label: 'Reports' },
    { path: '/admin/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/admin/support', icon: FiLifeBuoy, label: 'Support' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <PortalSidebar
        id="admin-sidebar"
        menuItems={menuItems}
        brandSubtitle="Admin Portal"
        sidebarOpen={sidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        onMobileClose={closeMobileMenu}
        onLogoutClick={requestLogout}
        isActive={isActive}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="lg:hidden flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="admin-sidebar"
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

              <div className="flex items-center gap-3 p-2 min-h-[44px]" aria-label="Signed in user">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {initials}
                </div>
                <div className="hidden md:block text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 min-w-0 overflow-x-hidden">
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

export default AdminLayout;
