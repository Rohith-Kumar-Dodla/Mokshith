import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  CheckSquare, 
  BarChart3, 
  Box, 
  Warehouse, 
  Megaphone, 
  LogOut, 
  Search, 
  Bell, 
  User, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Settings, 
  HelpCircle, 
  Maximize2,
  RefreshCcw
} from 'lucide-react';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { routes } from '../../routes/routeConfig.js';
import ConfirmDialog from '../feedback/ConfirmDialog.jsx';
import './AdminLayout.css';

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: routes.ADMIN },
    { icon: <Users size={20} />, label: 'Users', path: routes.ADMIN_USERS },
    { icon: <ShoppingCart size={20} />, label: 'Orders', path: routes.ADMIN_ORDERS },
    { icon: <Package size={20} />, label: 'Products', path: routes.ADMIN_PRODUCTS },
    { icon: <CheckSquare size={20} />, label: 'Approvals', path: routes.ADMIN_APPROVALS },
    { icon: <BarChart3 size={20} />, label: 'Analytics', path: routes.ADMIN_ANALYTICS },
    { icon: <Box size={20} />, label: 'Inventory', path: routes.ADMIN_INVENTORY },
    { icon: <Warehouse size={20} />, label: 'Warehouse', path: routes.ADMIN_WAREHOUSE },
    { icon: <Megaphone size={20} />, label: 'Promotions', path: routes.ADMIN_PROMOTIONS },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate(routes.LOGIN, { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className={`admin-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <ShieldCheck size={24} color="#fff" />
            </div>
            {!isSidebarCollapsed && <span className="logo-text">Mokshith <small>B2B</small></span>}
          </div>
          <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {!isSidebarCollapsed && <span className="section-title">Main Menu</span>}
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  {isActive && !isSidebarCollapsed && <div className="active-indicator" />}
                </Link>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <button className="nav-item logout-btn" onClick={() => setShowLogoutConfirm(true)}>
              <span className="nav-icon"><LogOut size={20} /></span>
              {!isSidebarCollapsed && <span className="nav-label">Logout</span>}
            </button>
          </div>
        </nav>

        <button 
          className="sidebar-toggle" 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search for data, users, orders..." />
            </div>
          </div>

          <div className="header-right">
            <div className="header-actions">
              <button className="action-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="action-btn">
                <Bell size={20} />
                <span className="notification-badge" />
              </button>
              <button className="action-btn hidden-mobile">
                <Maximize2 size={20} />
              </button>
            </div>

            <div className="user-profile">
              <div className="profile-info" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="avatar">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="user-details hidden-mobile">
                  <span className="user-name">{user?.name || 'Admin'}</span>
                  <span className="user-role">Super Admin</span>
                </div>
              </div>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <Link to={routes.ADMIN_PROFILE} className="dropdown-item">
                    <User size={16} /> My Profile
                  </Link>
                  <Link to={routes.ADMIN_SETTINGS} className="dropdown-item">
                    <Settings size={16} /> Settings
                  </Link>
                  <Link to={routes.HELP} className="dropdown-item">
                    <HelpCircle size={16} /> Help Center
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout" onClick={() => setShowLogoutConfirm(true)}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => !isLoggingOut && setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        loading={isLoggingOut}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        variant="danger"
      />
    </div>
  );
};

export default AdminLayout;
