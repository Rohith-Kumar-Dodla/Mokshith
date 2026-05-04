import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { routes } from '../../routes/routeConfig.js';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../feedback/ConfirmDialog.jsx';
import Sidebar from '../common/Sidebar.jsx';
import { 
  Truck, 
  LogOut, 
  Package, 
  History, 
  LayoutDashboard,
  User,
  Bell,
  MapPin,
  Menu,
  X
} from 'lucide-react';

const DeliveryLayout = ({ title = "Delivery Portal" }) => {
  const { logout, user } = useAuth();
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

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Logistics", path: routes.DELIVERY_DASHBOARD },
    { icon: <Package size={20} />, label: "Shipments", path: routes.DELIVERY_SHIPMENTS },
    { icon: <History size={20} />, label: "History", path: routes.DELIVERY_HISTORY },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] overflow-x-hidden">
      {/* ================= MOBILE OVERLAY ================= */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`
        w-[280px] h-screen fixed left-0 top-0 z-50 bg-[#0B1120] text-white flex flex-col
        transition-transform duration-300 lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none uppercase">Mokshith</h1>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1.5">Delivery Portal</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-3 overflow-y-auto custom-scrollbar mt-6">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={index} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className={`${isActive ? 'text-white' : 'group-hover:text-emerald-400'} transition-colors`}>
                  {React.cloneElement(item.icon, { size: 20 })}
                </div>
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all duration-300 group"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="font-black uppercase tracking-widest text-xs">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[280px]">
        <header className="h-16 flex items-center px-4 md:px-10 bg-white/80 backdrop-blur-md border-b sticky top-0 z-30">
          <div className="flex-1 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Menu size={24} className="text-gray-600" />
              </button>
              <h2 className="text-lg font-black text-gray-800 hidden sm:block">{title}</h2>
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-50 rounded-lg transition-all text-slate-400">
                  <Bell size={20} />
                </button>
                <div className="h-6 w-px bg-gray-100"></div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-900 leading-none">{user?.name}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Delivery Agent</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'D'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      <Sidebar 
        isOpen={isProfileSidebarOpen} 
        onClose={() => setIsProfileSidebarOpen(false)} 
        user={user} 
        onLogout={() => setShowLogoutConfirm(true)} 
      />

      {showLogoutConfirm && (
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => !isLoggingOut && setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          loading={isLoggingOut}
          title="Sign Out"
          message="Are you sure you want to exit the delivery portal?"
          confirmText="Sign Out"
          variant="danger"
        />
      )}
    </div>
  );
};

export default DeliveryLayout;