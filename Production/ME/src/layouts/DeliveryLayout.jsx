import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiPackage,
  FiFileText,
  FiDollarSign,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiMenu,
  FiX,
  FiBell,
} from 'react-icons/fi';
import NotificationDrawer from '../components/delivery/NotificationDrawer';
import PortalSidebar from '../components/common/PortalSidebar';
import { useLogoutConfirm } from '../hooks/useLogoutConfirm';
import { useMobileSidebar } from '../hooks/useMobileSidebar';
import useDelivery from '../hooks/useDelivery';

const DeliveryLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const { requestLogout, LogoutConfirmDialog } = useLogoutConfirm();
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileSidebar();
  const { profile: deliveryProfile, notifications: deliveryNotifications } = useDelivery();

  const menuItems = [
    { path: '/delivery/dashboard', icon: FiGrid, label: 'Dashboard' },
    { path: '/delivery/assigned-orders', icon: FiPackage, label: 'Assigned Orders' },
    { path: '/delivery/history', icon: FiFileText, label: 'Delivery History' },
    { path: '/delivery/earnings', icon: FiDollarSign, label: 'Earnings' },
    { path: '/delivery/performance', icon: FiBarChart2, label: 'Performance' },
    { path: '/delivery/profile', icon: FiUser, label: 'Profile' },
    { path: '/delivery/settings', icon: FiSettings, label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <PortalSidebar
        id="delivery-sidebar"
        menuItems={menuItems}
        brandSubtitle="Delivery Portal"
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
                aria-controls="delivery-sidebar"
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
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 p-2 min-h-[44px]" aria-label="Signed in user">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {(deliveryProfile?.name || 'DP').split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="hidden md:block text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{deliveryProfile?.name || 'Delivery Partner'}</p>
                  <p className="text-xs text-gray-500 truncate">Delivery Partner</p>
                </div>
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
        notifications={deliveryNotifications}
      />

      <LogoutConfirmDialog />
    </div>
  );
};

export default DeliveryLayout;
