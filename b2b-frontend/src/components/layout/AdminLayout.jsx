import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
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
  Tag,
  Menu,
  X
} from 'lucide-react';

import { routes } from '../../routes/routeConfig.js';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import ConfirmDialog from '../feedback/ConfirmDialog.jsx';

const AdminLayout = ({ title = "Admin Panel" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(false);
    setIsSidebarOpen(false);
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
      navigate(routes.LOGIN, { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] overflow-x-hidden">

      {/* ================= MOBILE SIDEBAR OVERLAY ================= */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`
        fixed md:static
        left-0 top-0
        w-[280px] h-screen
        bg-[#0B1120] text-white
        flex flex-col
        shadow-2xl border-r border-white/5
        z-50 md:z-0
        transform md:translate-x-0 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Logo Section */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 flex-shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-base tracking-tight leading-tight uppercase">Mokshith</h1>
              <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mt-0.5">Enterprise</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col py-6 px-3 gap-0.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Command Center</p>
          <div className="flex flex-col gap-1 flex-1">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-300 group flex-shrink-0 w-full ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                      : 'text-slate-400 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-blue-400'} transition-colors`}>
                    {React.cloneElement(item.icon, { size: 18 })}
                  </div>
                  <span className="text-sm font-bold tracking-wide flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/15 transition-all duration-300 group hover:text-rose-300"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform flex-shrink-0" />
            <span className="font-bold uppercase tracking-widest text-xs whitespace-nowrap">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Header */}
        <header className="h-16 flex items-center px-4 md:px-8 bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-30 shadow-sm flex-shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-all text-slate-400 hover:text-slate-600 mr-4 flex-shrink-0"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight flex-1 min-w-0">
            {title}
          </h2>

          <div className="flex items-center gap-2 md:gap-4 ml-auto flex-shrink-0">
            <div className="relative hidden lg:flex">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search resources..."
                className="pl-10 pr-4 py-2 bg-white/50 backdrop-blur-md border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-[280px] hover:bg-white/60 transition-colors"
              />
            </div>

            <button className="p-2.5 hover:bg-white/60 rounded-lg transition-all text-slate-400 hover:text-blue-600 flex-shrink-0 backdrop-blur-sm" title="Notifications">
              <Bell size={20} />
            </button>
            
            <div className="h-6 w-px bg-gray-200 flex-shrink-0 hidden md:block"></div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right hidden sm:block pr-2">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name}</p>
                <p className="text-[10px] font-medium text-blue-600 uppercase mt-0.5">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg hover:shadow-blue-500/30 transition-shadow">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 w-full">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
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