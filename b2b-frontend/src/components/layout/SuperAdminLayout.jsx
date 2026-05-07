import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { routes } from '../../routes/routeConfig.js';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../feedback/ConfirmDialog.jsx';
import { ShieldCheck, LogOut } from 'lucide-react';
import Sidebar from '../common/Sidebar.jsx';

const SuperAdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDbShell, setShowDbShell] = useState(false);

  useEffect(() => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(false);
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

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] overflow-x-hidden">
      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 flex items-center px-4 md:px-10 bg-white border-b sticky top-0 z-40 shadow-sm">
          <div className="flex-1 flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4">
              <span className="w-1.5 md:w-2 h-6 md:h-8 bg-rose-600 rounded-full"></span>
              <h2 className="text-base md:text-xl font-bold text-gray-900 tracking-tight">Root Control</h2>
              <span className="hidden sm:inline-block px-3 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded-lg border border-rose-500/20 uppercase tracking-widest ml-2">
                Omega Access
              </span>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <button 
                onClick={() => setShowDbShell(true)}
                className="hidden lg:block px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 text-slate-600 shadow-sm"
              >
                Database Shell
              </button>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2 px-3 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 border border-rose-200 hover:bg-rose-50 transition-all active:scale-95 shadow-sm"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>

              <div className="hidden md:block h-8 w-px bg-gray-100"></div>

              <div className="flex items-center gap-3 md:gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-900 truncate max-w-[100px]">{user?.name}</span>
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Root</span>
                </div>

              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-10 max-w-[1600px] mx-auto w-full">
          <Outlet context={{ showDbShell, setShowDbShell }} />
        </main>
      </div>



      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          title="Terminate Session"
          message="Are you sure you want to log out of the root control console?"
          confirmText={isLoggingOut ? "Processing..." : "Logout"}
          onConfirm={handleLogout}
          onClose={() => setShowLogoutConfirm(false)}
          variant="danger"
        />
      )}
    </div>
  );
};

export default SuperAdminLayout;