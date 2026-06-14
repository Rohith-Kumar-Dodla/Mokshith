import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiBox,
  FiFolder,
  FiShoppingCart,
  FiTruck,
  FiFileText,
  FiHeart,
  FiUser,
  FiSettings,
  FiMenu,
  FiX,
  FiBell,
} from 'react-icons/fi';
import NotificationDrawer from '../components/vendor/NotificationDrawer';
import PortalSidebar from '../components/common/PortalSidebar';
import { useLogoutConfirm } from '../hooks/useLogoutConfirm';
import { useMobileSidebar } from '../hooks/useMobileSidebar';
import useNotifications from '../hooks/useNotifications';
import useCart from '../hooks/useCart';
import useWishlist from '../hooks/useWishlist';
import { useAuth } from '../context/AuthContext';

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const { requestLogout, LogoutConfirmDialog } = useLogoutConfirm();
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileSidebar();
  const { notifications, unreadCount } = useNotifications();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user } = useAuth();

  const displayName = user?.businessName || user?.name || 'Vendor';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'V';

  const menuItems = [
    { path: '/vendor/dashboard', icon: FiGrid, label: 'Dashboard' },
    { path: '/vendor/products', icon: FiBox, label: 'Products' },
    { path: '/vendor/categories', icon: FiFolder, label: 'Categories' },
    { path: '/vendor/cart', icon: FiShoppingCart, label: 'Cart' },
    { path: '/vendor/orders', icon: FiTruck, label: 'Orders' },
    { path: '/vendor/invoices', icon: FiFileText, label: 'Invoices' },
    { path: '/vendor/wishlist', icon: FiHeart, label: 'Wishlist' },
    { path: '/vendor/profile', icon: FiUser, label: 'Profile' },
    { path: '/vendor/settings', icon: FiSettings, label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <PortalSidebar
        id="vendor-sidebar"
        menuItems={menuItems}
        brandSubtitle="Vendor Portal"
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
                aria-controls="vendor-sidebar"
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
              <Link
                to="/vendor/cart"
                className="relative p-2 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Cart"
              >
                <FiShoppingCart size={20} className="text-gray-600" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              <Link
                to="/vendor/wishlist"
                className="relative p-2 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Wishlist"
              >
                <FiHeart size={20} className="text-gray-600" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

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
                  <p className="text-xs text-gray-500 truncate">Vendor</p>
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
        notifications={notifications}
      />

      <LogoutConfirmDialog />
    </div>
  );
};

export default VendorLayout;
