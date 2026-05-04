import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { routes } from '../../routes/routeConfig.js';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../feedback/ConfirmDialog.jsx';
import { ShieldCheck, LogOut } from 'lucide-react';
import Sidebar from '../common/Sidebar.jsx';

const SuperAdminLayout = ({ children, onDbShellOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);

  useEffect(() => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(false);
    setIsProfileSidebarOpen(false);
  }, [location.pathname]);

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
          <div className="bg-rose-600 p-2.5 rounded-2xl shadow-lg shadow-rose-500/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none uppercase">Mokshith</h1>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1.5">Root Control</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          <Link
            to={routes.ADMIN}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
              location.pathname === routes.ADMIN 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck size={18} />
            <span className="font-bold tracking-wide text-sm">System Dashboard</span>
          </Link>
          {/* Add more SuperAdmin specific links here if needed */}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 group"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="font-black uppercase tracking-widest text-xs">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="ml-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-[90px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Root Control</h2>
            <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-black rounded-lg border border-rose-500/20 uppercase tracking-widest">
              Omega Access
            </span>
          </div>

          <div className="flex items-center gap-6">
            {onDbShellOpen && (
              <button 
                onClick={onDbShellOpen}
                className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 text-slate-600"
              >
                Database Shell
              </button>
            )}

            <div className="h-6 w-px bg-gray-100 mx-2"></div>

            {/* User Section */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none">{user?.name}</p>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1.5">
                  System Administrator
                </p>
              </div>

              <button 
                onClick={() => setIsProfileSidebarOpen(true)}
                className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-black shadow-lg shadow-rose-900/20 border-2 border-white overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                {user?.name?.[0]?.toUpperCase() || 'S'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 flex-1">
          <div className="relative">
            {/* Subtle background glow */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-rose-600/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* ================= PROFILE SIDEBAR ================= */}
      <Sidebar 
        isOpen={isProfileSidebarOpen} 
        onClose={() => setIsProfileSidebarOpen(false)} 
        user={user} 
        onLogout={() => setShowLogoutConfirm(true)} 
      />

      {/* ================= LOGOUT MODAL ================= */}
      {showLogoutConfirm && (
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => !isLoggingOut && setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          loading={isLoggingOut}
          title="Logout"
          message="Are you sure you want to terminate the root session?"
          confirmText="Terminate"
          variant="danger"
        />
      )}
    </div>
  );
};

export default SuperAdminLayout;