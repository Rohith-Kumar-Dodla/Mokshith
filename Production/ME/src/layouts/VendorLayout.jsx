import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
  FiLogOut,
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiChevronDown,
  FiMapPin
} from 'react-icons/fi';
import NotificationDrawer from '../components/vendor/NotificationDrawer';

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const notifications = [
    { id: 1, type: 'order_confirmed', title: 'Order Confirmed', message: 'Your order ORD002 has been confirmed', time: '2 minutes ago', read: false },
    { id: 2, type: 'order_shipped', title: 'Order Shipped', message: 'Your order ORD004 has been dispatched', time: '1 hour ago', read: false },
    { id: 3, type: 'offer', title: 'Special Offer', message: 'Get 15% discount on bulk orders above ₹50,000', time: '3 hours ago', read: true },
    { id: 4, type: 'order_delivered', title: 'Order Delivered', message: 'Your order ORD001 has been delivered successfully', time: '1 day ago', read: true },
    { id: 5, type: 'new_product', title: 'New Product', message: 'Premium Basmati Rice is now available', time: '2 days ago', read: true },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // Handle logout logic
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#0F172A] text-white transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl flex-shrink-0">
              M
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <h1 className="font-bold text-lg truncate">Mokshith B2B</h1>
                <p className="text-xs text-gray-400">Vendor Portal</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[44px] ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="font-medium truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all min-h-[44px]"
          >
            <FiLogOut size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Toggle sidebar"
              >
                <FiMenu size={20} className="text-gray-600" />
              </button>
              <div className="relative w-full md:w-96">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products, orders, invoices..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Cart Icon */}
              <Link
                to="/vendor/cart"
                className="relative p-2 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Cart"
              >
                <FiShoppingCart size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  4
                </span>
              </Link>

              {/* Wishlist Icon */}
              <Link
                to="/vendor/wishlist"
                className="relative p-2 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Wishlist"
              >
                <FiHeart size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  5
                </span>
              </Link>

              {/* Notifications */}
              <button
                onClick={() => setNotificationOpen(true)}
                className="relative p-2 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Notifications"
              >
                <FiBell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    FM
                  </div>
                  <div className="hidden md:block text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">Fresh Mart Grocery</p>
                    <p className="text-xs text-gray-500 truncate">Vendor</p>
                  </div>
                  <FiChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                    <Link
                      to="/vendor/profile"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg min-h-[44px]"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/vendor/settings"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 min-h-[44px]"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <hr className="border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 rounded-b-lg min-h-[44px]"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
      />
    </div>
  );
};

export default VendorLayout;
