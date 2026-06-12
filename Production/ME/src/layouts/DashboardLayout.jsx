import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBars, FaTimes, FaUserCircle, FaSignOutAlt, FaHome, FaBox, FaUsers, FaTruck, FaChartBar, FaCog, FaShieldAlt } from 'react-icons/fa';

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarItems = {
    'super-admin': [
      { name: 'Dashboard', icon: <FaHome />, path: '/super-admin/dashboard' },
      { name: 'Users', icon: <FaUsers />, path: '/super-admin/users' },
      { name: 'Products', icon: <FaBox />, path: '/super-admin/products' },
      { name: 'Analytics', icon: <FaChartBar />, path: '/super-admin/analytics' },
      { name: 'Settings', icon: <FaCog />, path: '/super-admin/settings' },
    ],
    'admin': [
      { name: 'Dashboard', icon: <FaHome />, path: '/admin/dashboard' },
      { name: 'Inventory', icon: <FaBox />, path: '/admin/inventory' },
      { name: 'Orders', icon: <FaTruck />, path: '/admin/orders' },
      { name: 'Vendors', icon: <FaUsers />, path: '/admin/vendors' },
      { name: 'Settings', icon: <FaCog />, path: '/admin/settings' },
    ],
    'vendor': [
      { name: 'Dashboard', icon: <FaHome />, path: '/vendor/dashboard' },
      { name: 'Orders', icon: <FaBox />, path: '/vendor/orders' },
      { name: 'Cart', icon: <FaBox />, path: '/vendor/cart' },
      { name: 'History', icon: <FaChartBar />, path: '/vendor/history' },
      { name: 'Settings', icon: <FaCog />, path: '/vendor/settings' },
    ],
    'delivery': [
      { name: 'Dashboard', icon: <FaHome />, path: '/delivery/dashboard' },
      { name: 'Deliveries', icon: <FaTruck />, path: '/delivery/deliveries' },
      { name: 'History', icon: <FaChartBar />, path: '/delivery/history' },
      { name: 'Settings', icon: <FaCog />, path: '/delivery/settings' },
    ],
  };

  const roleColors = {
    'super-admin': 'bg-purple-600',
    'admin': 'bg-secondary',
    'vendor': 'bg-success',
    'delivery': 'bg-warning',
  };

  const roleLabels = {
    'super-admin': 'Super Admin',
    'admin': 'Admin',
    'vendor': 'Vendor',
    'delivery': 'Delivery Partner',
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-xl font-bold">Mokshith B2B</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sidebarItems[role]?.map((item, index) => (
              <a
                key={index}
                href={item.path}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 ${roleColors[role]} rounded-full flex items-center justify-center`}>
                <FaUserCircle className="text-white text-xl" />
              </div>
              <div>
                <p className="font-semibold">{user?.name || 'User'}</p>
                <p className="text-sm text-gray-400">{roleLabels[role]}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-4 py-2 text-left rounded-lg hover:bg-gray-800 transition-colors text-danger"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Topbar */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-600 hover:text-primary"
          >
            {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${roleColors[role]} text-white`}>
              {roleLabels[role]}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
