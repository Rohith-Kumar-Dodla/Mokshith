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
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">

      {/* ================= MOBILE SIDEBAR (DRAWER) ================= */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <aside className={`absolute left-0 top-0 w-[280px] h-full bg-[#000000] text-white flex flex-col shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent 
            location={location} 
            menuItems={menuItems} 
            setShowLogoutConfirm={setShowLogoutConfirm} 
          />
        </aside>
      </div>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex w-[280px] h-full bg-[#000000] text-white flex-col shadow-2xl flex-shrink-0 z-50">
        <SidebarContent 
          location={location} 
          menuItems={menuItems} 
          setShowLogoutConfirm={setShowLogoutConfirm} 
        />
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white">
        {/* Top Header */}
        <header className="h-24 bg-white border-b border-gray-100 flex items-center px-6 md:px-12 flex-shrink-0 z-40">
          <div className="flex-1 flex justify-between items-center gap-8 md:gap-16">
            <div className="flex items-center gap-4 md:gap-10">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-4 md:gap-6">
                <div className="hidden sm:block">
                  <X size={24} className="text-gray-300 cursor-pointer hover:text-rose-500 transition-colors" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight whitespace-nowrap">Overview</h2>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl hidden lg:block">
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10">
                  <Search size={22} />
                </div>
                <input 
                  type="text" 
                  placeholder="Search resources..." 
                  className="w-full h-16 bg-gray-50 border-2 border-transparent focus:border-blue-500/10 focus:bg-white rounded-[2rem] pl-16 pr-8 text-lg font-medium transition-all outline-none shadow-inner text-center"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 md:gap-10">
              <div className="relative">
                <button className="p-3 md:p-4 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all relative group">
                  <Bell size={24} className="md:w-[28px] md:h-[28px] group-hover:rotate-12 transition-transform" />
                  <span className="absolute top-3 right-3 md:top-4 md:right-4 w-3 h-3 md:w-3.5 md:h-3.5 bg-rose-500 border-2 md:border-4 border-white rounded-full"></span>
                </button>
              </div>

              <div className="h-10 md:h-12 w-px bg-gray-100 hidden sm:block"></div>

              <div className="flex items-center gap-3 md:gap-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm md:text-lg font-black text-gray-900 leading-none tracking-tight truncate max-w-[120px]">{user?.name}</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1 md:mt-2">Admin</span>
                </div>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg md:text-xl font-black shadow-xl md:shadow-2xl shadow-blue-600/40 border-2 md:border-4 border-white cursor-pointer hover:scale-105 md:hover:scale-110 transition-transform flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 md:p-16 lg:p-24 max-w-[1900px] mx-auto w-full bg-[#fbfcfd] custom-scrollbar">
          <Outlet />
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

const SidebarContent = ({ location, menuItems, setShowLogoutConfirm }) => (
  <div className="flex flex-col h-full overflow-hidden">
    {/* Logo Section */}
    <div className="px-10 py-16 flex flex-col items-center text-center flex-shrink-0 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
      <div className="bg-[#2563EB] p-5 rounded-[2rem] shadow-[0_0_50px_rgba(37,99,235,0.3)] flex-shrink-0 mb-6 group-hover:scale-110 transition-transform duration-500 border border-blue-400/20">
        <ShieldCheck size={48} className="text-white" />
      </div>
      <div>
        <h1 className="font-black text-5xl tracking-tighter leading-none text-white uppercase mb-3">Mokshith</h1>
        <p className="text-[12px] font-black text-[#2563EB] uppercase tracking-[0.6em] leading-none">Enterprise</p>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 flex flex-col py-12 px-6 overflow-y-auto custom-scrollbar no-scrollbar">
      <div className="flex-1">
        <p className="px-10 text-[12px] font-black text-slate-600 uppercase tracking-[0.5em] mb-12 text-center">Main Menu</p>
        <div className="space-y-8 flex flex-col items-center">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-8 px-12 py-7 rounded-[2.5rem] transition-all duration-500 group relative overflow-hidden w-full max-w-[240px] ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/50 scale-[1.05]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 hover:scale-[1.02]'
                }`}
              >
                <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-500'} transition-colors duration-300`}>
                  {React.cloneElement(item.icon, { size: 32 })}
                </div>
                <span className={`text-[18px] tracking-[0.15em] uppercase ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                
                {/* Active Highlight Effect */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none"></div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-16 pt-12 border-t border-white/5 flex justify-center px-4">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center justify-center gap-6 w-full max-w-[240px] px-10 py-7 rounded-[2.5rem] bg-[#1A0B0B] text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-500 group font-black uppercase tracking-[0.4em] text-[13px] border border-rose-600/20 hover:border-rose-600 shadow-2xl shadow-rose-900/20"
        >
          <LogOut size={26} className="group-hover:-translate-x-1 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  </div>
);



export default AdminLayout;
