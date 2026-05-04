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

import { routes } from '../../routes/routeConfig.js';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import ConfirmDialog from '../feedback/ConfirmDialog.jsx';

const AdminLayout = ({ children, title = "Overview" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(false);
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">

      {/* ================= SIDEBAR ================= */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-slate-900 text-white flex flex-col z-40">

        {/* Logo Section */}
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none uppercase">Mokshith</h1>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1.5">Enterprise</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`${isActive ? 'text-white' : 'group-hover:text-blue-400'} transition-colors`}>
                  {item.icon}
                </div>
                <span className="font-bold tracking-wide text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 group"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="font-black uppercase tracking-widest text-xs">Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="ml-72 flex flex-col min-h-screen">

        {/* Header */}
        <header className="h-[90px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-30">

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>

          <div className="flex items-center gap-8">

            {/* Search */}
            <div className="relative hidden lg:block">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources..."
                className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-[320px]"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900 relative">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>

              <div className="h-6 w-px bg-gray-100 mx-2"></div>

              {/* User Section */}
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 leading-none">{user?.name}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1.5">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-900/20 border-2 border-white overflow-hidden">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || 'A'
                  )}
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 flex-1">
          {children}
        </main>
      </div>

      {/* ================= LOGOUT MODAL ================= */}
      {showLogoutConfirm && (
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => !isLoggingOut && setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          loading={isLoggingOut}
          title="Logout"
          message="Are you sure you want to logout?"
          confirmText="Logout"
        />
      )}
    </div>
  );
};

export default AdminLayout;