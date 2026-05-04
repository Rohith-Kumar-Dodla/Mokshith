import React, { useState, useEffect } from 'react';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { useOrder } from '../../modules/order/hooks/useOrder.js';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { routes } from '../../routes/routeConfig.js';
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard, Package, CreditCard } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import CartDrawer from './CartDrawer.jsx';
import ConfirmDialog from '../feedback/ConfirmDialog.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart, updateQuantity, removeFromCart } = useOrder();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(false);
  }, [location.pathname]);

  const cartCount = cart?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const isLandingPage = location.pathname === routes.LANDING;

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
    <>
      <header className="h-[90px] bg-white border-b border-gray-100 sticky top-0 z-[100]">
        <div className="max-w-[1400px] h-full mx-auto px-10 flex items-center justify-between">
          <Link to={routes.LANDING} className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tighter">Mokshith</span>
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">B2B</span>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            <Link to={routes.PRODUCTS} className={`text-sm font-bold transition-colors ${location.pathname === routes.PRODUCTS ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>
              Products
            </Link>
            {!user && (
              <Link to="#" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                Pricing
              </Link>
            )}
            {user && (
              <>
                <Link to={routes.DASHBOARD} className={`text-sm font-bold transition-colors ${location.pathname === routes.DASHBOARD ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>
                  Dashboard
                </Link>
                <Link to={routes.ORDERS} className={`text-sm font-bold transition-colors ${location.pathname === routes.ORDERS ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>
                  Orders
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all relative group"
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg group-hover:scale-110 transition-transform">
                  {cartCount}
                </span>
              )}
            </button>
            
            {user ? (
              <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-900/20 border-2 border-white transition-all hover:scale-105 active:scale-95"
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link to={routes.LOGIN} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                  Login
                </Link>
                <Link to={routes.REGISTER} className="px-8 py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user} 
        onLogout={() => {
          console.log('Navbar: onLogout triggered');
          setIsSidebarOpen(false);
          setShowLogoutConfirm(true);
        }} 
      />

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

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        onUpdateQuantity={updateQuantity} 
        onRemoveItem={removeFromCart} 
      />

      <style>{`
        .navbar-header {
          background-color: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 0 2rem;
          height: 72px;
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
        }

        .navbar-container {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          color: #000000;
          letter-spacing: -0.02em;
        }

        .logo-badge {
          background-color: var(--primary);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .navbar-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-link {
          font-weight: 500;
          color: #4b5563;
          text-decoration: none;
          font-size: 0.9375rem;
          transition: var(--transition-fast);
        }

        .nav-link:hover, .nav-link.active {
          color: var(--primary);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .action-icon-button {
          position: relative;
          background: none;
          border: none;
          color: var(--text-muted);
          padding: 0.5rem;
          cursor: pointer;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-icon-button:hover {
          color: var(--primary);
        }

        .cart-badge {
          position: absolute;
          top: 0;
          right: 0;
          background-color: var(--primary);
          color: white;
          font-size: 0.7rem;
          border-radius: 9999px;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          padding: 0 4px;
        }

        .user-avatar-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--primary-light);
          color: var(--primary);
          border: 1px solid var(--primary);
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .user-avatar-button:hover {
          box-shadow: 0 0 0 4px var(--primary-light);
        }

        .auth-buttons {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .login-link {
          color: var(--text-main);
          font-weight: 600;
          font-size: 0.9375rem;
          text-decoration: none;
        }

        .register-cta {
          padding: 0.625rem 1.25rem;
          font-size: 0.9375rem;
        }

        @media (max-width: 768px) {
          .navbar-links {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
