import React from 'react';
import { createPortal } from 'react-dom';

console.log('Sidebar.jsx module loaded');

import { useNavigate, Link } from 'react-router-dom';
import { routes } from '../../routes/routeConfig.js';
import { 
  User, 
  Package, 
  CreditCard, 
  Settings, 
  Shield, 
  HelpCircle, 
  LogOut, 
  X,
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Boxes,
  Warehouse,
  Tag,
  Truck,
  Heart,
  History,
  Settings as SettingsIcon,
  Package as PackageIcon,
  MapPin
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, user, onLogout }) => {
  const navigate = useNavigate();

  // Debugging log
  React.useEffect(() => {
    if (isOpen) {
      console.log('Sidebar is now OPEN', { userRole: user?.role });
    }
  }, [isOpen, user]);

  const adminLinks = [
    { icon: <LayoutDashboard size={18} />, label: "Dashboard", path: routes.ADMIN },
    { icon: <BarChart3 size={18} />, label: "Analytics", path: routes.ADMIN_ANALYTICS },
    { icon: <Users size={18} />, label: "Manage Users", path: routes.ADMIN_USERS },
    { icon: <PackageIcon size={18} />, label: "Products", path: routes.ADMIN_PRODUCTS },
    { icon: <PackageIcon size={18} />, label: "Orders", path: routes.ADMIN_ORDERS },
    { icon: <Building2 size={18} />, label: "Vendors", path: routes.ADMIN_VENDORS },
    { icon: <Boxes size={18} />, label: "Inventory", path: routes.ADMIN_INVENTORY },
    { icon: <Warehouse size={18} />, label: "Warehouse", path: routes.ADMIN_WAREHOUSE },
    { icon: <Tag size={18} />, label: "Promotions", path: routes.ADMIN_PROMOTIONS },
    { icon: <SettingsIcon size={18} />, label: "Settings", path: routes.ADMIN_SETTINGS },
  ];

  const vendorLinks = [
    { icon: <LayoutDashboard size={18} />, label: "Dashboard", path: routes.ADMIN },
    { icon: <Building2 size={18} />, label: "Company Profile", path: routes.VENDOR_COMPANY },
    { icon: <Boxes size={18} />, label: "Inventory", path: routes.VENDOR_INVENTORY },
    { icon: <PackageIcon size={18} />, label: "Orders", path: routes.ADMIN_ORDERS },
    { icon: <SettingsIcon size={18} />, label: "Settings", path: routes.ADMIN_SETTINGS },
  ];

  const deliveryLinks = [
    { icon: <LayoutDashboard size={18} />, label: "Logistics Dashboard", path: routes.DELIVERY_DASHBOARD },
    { icon: <Truck size={18} />, label: "My Shipments", path: routes.DELIVERY_SHIPMENTS },
    { icon: <History size={18} />, label: "History", path: routes.DELIVERY_HISTORY },
  ];

  const b2bCustomerLinks = [
    { icon: <User size={18} />, label: "My Profile", path: routes.PROFILE },
    { icon: <PackageIcon size={18} />, label: "My Orders", path: routes.ORDERS },
    { icon: <CreditCard size={18} />, label: "Credit Balance", path: routes.CREDIT },
    { icon: <Shield size={18} />, label: "Security", path: routes.SECURITY },
    { icon: <HelpCircle size={18} />, label: "Help & Support", path: routes.HELP },
  ];

  const b2cCustomerLinks = [
    { icon: <LayoutDashboard size={18} />, label: "Home", path: routes.HOME },
    { icon: <User size={18} />, label: "My Profile", path: routes.PROFILE },
    { icon: <PackageIcon size={18} />, label: "My Orders", path: routes.ORDERS },
    { icon: <Heart size={18} />, label: "Wishlist", path: routes.WISHLIST },
    { icon: <Shield size={18} />, label: "Security", path: routes.SECURITY },
    { icon: <HelpCircle size={18} />, label: "Help & Support", path: routes.HELP },
  ];

  const getLinksByRole = () => {
    switch (user?.role) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return adminLinks;
      case "VENDOR":
        return vendorLinks;
      case "DELIVERY_PARTNER":
        return deliveryLinks;
      case "B2B_CUSTOMER":
        return b2bCustomerLinks;
      case "B2C_CUSTOMER":
        return b2cCustomerLinks;
      default:
        return b2cCustomerLinks;
    }
  };

  const links = getLinksByRole();

  console.log('Sidebar component rendered', { isOpen, userRole: user?.role });

  if (!isOpen) return null;

  const target = document.body;
  if (!target) {
    console.error('Sidebar: document.body not found!');
    return null;
  }
  console.log('Sidebar: Portaling to', target.tagName);

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex justify-end"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className="absolute right-0 top-0 w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-6 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-gray-900 tracking-tight">Mokshith</span>
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">B2B</span>
          </div>
          <button 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors" 
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        {/* User Identity Card */}
        <div className="p-6">
          <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100 shadow-sm">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profileImage}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  user?.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{user?.name || 'T Nagaraju'}</h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email || 'tnrventions@gmail.com'}</p>
                <div className="mt-3">
                  <span className="px-3 py-1 bg-blue-500 text-[10px] font-bold text-white uppercase tracking-wider rounded-full">
                    {user?.role?.replace('_', ' ') || 'B2B CUSTOMER'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-2">
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Navigation</p>
            {links.map((link, index) => (
              <button 
                key={index}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                onClick={() => { navigate(link.path); onClose(); }}
              >
                <span className="text-gray-400 group-hover:text-blue-600 transition-colors">{link.icon}</span>
                <span className="font-semibold text-sm">{link.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button 
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition-all" 
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>,
    target
  );
};

export default Sidebar;