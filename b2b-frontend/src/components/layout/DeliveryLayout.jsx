import React, { useState, useEffect } from 'react';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { routes } from '../../routes/routeConfig.js';
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
  X,
  Activity,
  ShieldCheck,
  Settings,
  ChevronDown,
  RefreshCcw
} from 'lucide-react';
import ConfirmDialog from '../feedback/ConfirmDialog.jsx';

const DeliveryLayout = ({ title = "Logistics Command" }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const navItems = [
    { icon: <LayoutDashboard size={18} />, label: "Command", path: routes.DELIVERY_DASHBOARD },
    { icon: <Package size={18} />, label: "Manifests", path: routes.DELIVERY_SHIPMENTS },
    { icon: <History size={18} />, label: "History", path: routes.DELIVERY_HISTORY },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* High-End Sticky Top Navigation */}
      <header className={`sticky top-0 z-[100] transition-all duration-500 h-20 ${
        isScrolled ? 'bg-[#0F172A]/90 backdrop-blur-2xl border-b border-white/5 shadow-2xl' : 'bg-[#0F172A] border-b border-white/5'
      }`}>
        <div className="max-w-[1800px] h-full mx-auto px-4 md:px-12 flex items-center justify-between">
          {/* Brand Area */}
          <Link to={routes.DELIVERY_DASHBOARD} className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
              <Truck size={20} className="text-white" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-lg font-black text-white tracking-tighter leading-none uppercase">Mokshith <span className="text-blue-500 text-[10px] ml-1 tracking-widest font-black uppercase">Logistics</span></h1>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </Link>

          {/* Center Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5 mx-4">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={index} 
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[100px]">{user?.name || 'Partner'}</span>
                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">ID: {user?._id?.slice(-4).toUpperCase()}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>

            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/10 transition-all group"
            >
              <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 md:px-12 py-6 md:py-10">
        <Outlet />
      </main>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <style dangerouslySetInnerHTML={{ __html: `
            .delivery-confirm-btn {
              background-color: rgba(255, 255, 255, 0.05) !important;
              color: #94a3b8 !important;
              transition: all 0.3s ease !important;
              border: none !important;
            }
            .delivery-confirm-btn-logout:hover {
              background-color: #e11d48 !important;
              color: white !important;
              transform: scale(1.02);
              box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.2) !important;
            }
            .delivery-confirm-btn-cancel:hover {
              background-color: #0ea5e9 !important;
              color: white !important;
              transform: scale(1.02);
              box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.2) !important;
            }
          ` }} />
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)}></div>
          <div className="relative w-full max-w-md bg-[#1E293B] rounded-[3rem] border border-white/10 p-10 shadow-2xl text-center">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500 border border-rose-500/20">
              <LogOut size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">End Session?</h3>
            <p className="text-slate-400 font-bold text-sm leading-relaxed mb-10 uppercase tracking-wide">
              Confirming will synchronize your final telemetry and sign you out of the logistics network.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest delivery-confirm-btn delivery-confirm-btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 delivery-confirm-btn delivery-confirm-btn-logout"
              >
                {isLoggingOut ? <RefreshCcw size={16} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-6 inset-x-6 h-16 bg-[#1E293B]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] z-[100] flex items-center justify-around px-6 shadow-2xl">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={index} 
              to={item.path}
              className={`p-3 rounded-xl transition-all ${
                isActive ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500'
              }`}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default DeliveryLayout;