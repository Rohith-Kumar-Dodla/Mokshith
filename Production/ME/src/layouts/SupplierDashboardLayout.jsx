import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FiGrid, FiUsers, FiFolder, FiPackage, FiSettings, FiMenu, FiX } from 'react-icons/fi';
import PortalSidebar from '../components/common/PortalSidebar';
import { useAuth } from '../context/AuthContext';
import { useLogoutConfirm } from '../hooks/useLogoutConfirm';
import { useMobileSidebar } from '../hooks/useMobileSidebar';

const menuItems = [
  { path: '/supplier-dashboard', icon: FiGrid, label: 'Dashboard' },
  { path: '/supplier-dashboard/suppliers', icon: FiUsers, label: 'Suppliers' },
  { path: '/supplier-dashboard/categories', icon: FiFolder, label: 'Categories' },
  { path: '/supplier-dashboard/products', icon: FiPackage, label: 'Products' },
  { path: '/supplier-dashboard/settings', icon: FiSettings, label: 'Settings' },
];

const SupplierDashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user } = useAuth();
  const { requestLogout, LogoutConfirmDialog } = useLogoutConfirm();
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileSidebar();
  const displayName = user?.name || 'Super Admin';
  const displayEmail = user?.email || 'superadmin@mokshith.com';
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SA';

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <PortalSidebar
        id="supplier-dashboard-sidebar"
        menuItems={menuItems}
        brandSubtitle="Supplier Dashboard"
        sidebarOpen={sidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        onMobileClose={closeMobileMenu}
        onLogoutClick={requestLogout}
        isActive={(path) => location.pathname === path}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors hover:bg-gray-100 lg:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="supplier-dashboard-sidebar"
            >
              {mobileMenuOpen ? <FiX size={20} className="text-gray-600" /> : <FiMenu size={20} className="text-gray-600" />}
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors hover:bg-gray-100 lg:flex"
              aria-label="Toggle sidebar"
            >
              <FiMenu size={20} className="text-gray-600" />
            </button>

            <div className="flex min-w-0 items-center gap-3" aria-label="Signed in user">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 font-semibold text-white">{initials}</div>
              <div className="hidden min-w-0 text-left sm:block">
                <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
                <p className="truncate text-xs text-gray-500">{displayEmail}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <LogoutConfirmDialog />
    </div>
  );
};

export default SupplierDashboardLayout;
