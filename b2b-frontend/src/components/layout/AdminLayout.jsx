import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShieldCheck,
  LogOut,
  Bell,
  Search,
  TrendingUp,
  Boxes,
  Warehouse,
  Tag
} from 'lucide-react';

import { routes } from '../../routes/routeConfig';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import ConfirmDialog from '../feedback/ConfirmDialog';

const AdminLayout = ({ children, title = "Overview" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setShowLogoutConfirm(false);
  }, [location.pathname]);

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: "Dashboard", path: routes.ADMIN },
    { icon: <Users size={18} />, label: "Users", path: routes.ADMIN_USERS },
    { icon: <Package size={18} />, label: "Orders", path: routes.ADMIN_ORDERS },
    { icon: <Package size={18} />, label: "Products", path: routes.ADMIN_PRODUCTS },
    { icon: <ShieldCheck size={18} />, label: "Approvals", path: routes.ADMIN_APPROVALS },
    { icon: <TrendingUp size={18} />, label: "Analytics", path: routes.ADMIN_ANALYTICS },
    { icon: <Boxes size={18} />, label: "Inventory", path: routes.ADMIN_INVENTORY },
    { icon: <Warehouse size={18} />, label: "Warehouse", path: routes.ADMIN_WAREHOUSE },
    { icon: <Tag size={18} />, label: "Promotions", path: routes.ADMIN_PROMOTIONS },
  ];

  const handleLogout = () => {
    logout();
    navigate(routes.LOGIN);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

      {/* ================= SIDEBAR ================= */}
      <aside style={{
        width: '240px',
        backgroundColor: '#0B0F1A',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>

        {/* Logo Section */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: '#2563eb',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={20} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0', color: 'white' }}>Mokshith</p>
              <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Enterprise</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: '24px 12px',
          overflow: 'auto',
        }}>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={index}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  margin: '4px 0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isActive ? 'white' : '#D1D5DB',
                  backgroundColor: isActive ? '#2563eb' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#D1D5DB';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#ef4444';
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <header style={{
          height: '56px',
          backgroundColor: 'white',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>

          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1F2937',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: 0
          }}>
            {title}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search resources..."
                style={{
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  width: '280px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Notification Bell */}
            <button style={{
              position: 'relative',
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              transition: 'all 0.2s ease'
            }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Bell size={18} />
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                backgroundColor: '#ef4444',
                borderRadius: '50%'
              }}></span>
            </button>

            {/* User Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingLeft: '24px',
              borderLeft: '1px solid #E5E7EB'
            }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', margin: '0' }}>{user?.name}</p>
                <p style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '2px 0 0 0', fontWeight: '600' }}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>

              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.15)'
              }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>

          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: '32px'
        }}>
          {children}
        </main>
      </div>

      {/* ================= LOGOUT MODAL ================= */}
      {showLogoutConfirm && (
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          title="Logout"
          message="Are you sure you want to logout?"
          confirmText="Logout"
        />
      )}
    </div>
  );
};

export default AdminLayout;