import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { routes } from '../../routes/routeConfig.js';
import { 
  LayoutDashboard,
  Building2,
  Users,
  Truck,
  UserCog,
  Tag,
  Package,
  Warehouse,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Settings,
  Flag,
  Shield,
  FileText,
  Download,
  Activity,
  Cog,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const SuperAdminSidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuSections = [
    {
      id: 'overview',
      title: 'OVERVIEW',
      items: [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: routes.SUPER_ADMIN },
      ]
    },
    {
      id: 'user-management',
      title: 'USER MANAGEMENT',
      items: [
        { icon: <Building2 size={20} />, label: 'B2B Partners', path: routes.SUPER_ADMIN_PARTNERS },
        { icon: <Users size={20} />, label: 'B2B Customers', path: routes.SUPER_ADMIN_CUSTOMERS },
        { icon: <Truck size={20} />, label: 'Delivery Partners', path: routes.SUPER_ADMIN_DELIVERY_PARTNERS },
        { icon: <UserCog size={20} />, label: 'Administrators', path: routes.SUPER_ADMIN_ADMINS },
      ]
    },
    {
      id: 'product-management',
      title: 'PRODUCT MANAGEMENT',
      items: [
        { icon: <Tag size={20} />, label: 'Categories', path: routes.SUPER_ADMIN_CATEGORIES },
        { icon: <Package size={20} />, label: 'Products', path: routes.SUPER_ADMIN_PRODUCTS },
        { icon: <Warehouse size={20} />, label: 'Inventory', path: routes.SUPER_ADMIN_INVENTORY },
      ]
    },
    {
      id: 'business-operations',
      title: 'BUSINESS OPERATIONS',
      items: [
        { icon: <ShoppingCart size={20} />, label: 'Orders', path: routes.SUPER_ADMIN_ORDERS },
        { icon: <CreditCard size={20} />, label: 'Credit Management', path: routes.SUPER_ADMIN_CREDIT },
        { icon: <TrendingUp size={20} />, label: 'Revenue Analytics', path: routes.SUPER_ADMIN_REVENUE },
      ]
    },
    {
      id: 'system-management',
      title: 'SYSTEM MANAGEMENT',
      items: [
        { icon: <Settings size={20} />, label: 'System Configuration', path: routes.SUPER_ADMIN_CONFIGURATION },
        { icon: <Flag size={20} />, label: 'Feature Flags', path: routes.SUPER_ADMIN_FEATURES },
        { icon: <Shield size={20} />, label: 'Security Panel', path: routes.SUPER_ADMIN_SECURITY },
        { icon: <Activity size={20} />, label: 'Platform Health', path: routes.SUPER_ADMIN_MONITORING },
      ]
    },
    {
      id: 'audit-logs',
      title: 'AUDIT & LOGS',
      items: [
        { icon: <FileText size={20} />, label: 'Audit Trail', path: routes.SUPER_ADMIN_AUDIT },
        { icon: <Download size={20} />, label: 'Export Logs', path: routes.SUPER_ADMIN_LOGS },
      ]
    },
    {
      id: 'settings',
      title: 'SETTINGS',
      items: [
        { icon: <Cog size={20} />, label: 'Platform Settings', path: routes.SUPER_ADMIN_SETTINGS },
        { icon: <User size={20} />, label: 'Account Settings', path: routes.SUPER_ADMIN_PROFILE },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-gradient-to-b from-[#071A52] to-[#0B2C8F]
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-16' : 'w-64'}
          flex flex-col
        `}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <span className="font-bold text-white text-sm">Mokshith</span>
                <p className="text-[9px] text-blue-200/70 font-medium tracking-wider uppercase">Enterprises</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-sm">M</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} className="text-white/70" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3">
          {menuSections.map((section) => (
            <div key={section.id} className="mb-6">
              {/* Section Title */}
              {!isCollapsed && (
                <div className="px-3 mb-3">
                  <span className="text-[10px] font-bold text-blue-200/40 uppercase tracking-widest">
                    {section.title}
                  </span>
                </div>
              )}

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${isActive(item.path) 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40' 
                        : 'text-blue-100/60 hover:bg-white/5 hover:text-white'
                      }
                      ${isCollapsed ? 'justify-center px-2' : ''}
                    `}
                    title={isCollapsed ? item.label : ''}
                  >
                    <span className={isActive(item.path) ? 'text-white' : 'text-blue-300/60'}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="text-xs font-semibold">{item.label}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle (Desktop) */}
        <div className="p-3 border-t border-white/10 hidden lg:block">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 hover:bg-white/5 rounded-lg transition-colors text-blue-200/60 hover:text-white"
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={18} />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
