import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { routes } from '../../routes/routeConfig.js';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { Menu, X } from 'lucide-react';

const PublicNavbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: routes.PRODUCTS, label: 'Products' },
    { path: routes.PRICING, label: 'Pricing' },
    { path: routes.SOLUTIONS, label: 'Solutions' },
  ];

  return (
    <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to={routes.LANDING} className="navbar-logo">
          <span className="logo-text">Mokshith</span>
          <span className="logo-badge">B2B</span>
        </Link>

        <nav className="navbar-links desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="navbar-actions">
          {user ? (
            <div className="auth-buttons desktop-auth">
              <Link to={routes.DASHBOARD} className="login-link">
                Dashboard
              </Link>
              <Link to={routes.PRODUCTS} className="register-cta primary-cta">
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="auth-buttons desktop-auth">
              <Link to={routes.LOGIN} className="login-link">
                Login
              </Link>
              <Link to={routes.REGISTER} className="register-cta primary-cta">
                Register
              </Link>
            </div>
          )}

          <button
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mobile-auth-buttons">
              {user ? (
                <>
                  <Link
                    to={routes.DASHBOARD}
                    className="mobile-auth-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to={routes.PRODUCTS}
                    className="mobile-auth-cta"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Shop Now
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={routes.LOGIN}
                    className="mobile-auth-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to={routes.REGISTER}
                    className="mobile-auth-cta"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      <style>{`
        .navbar-header {
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          padding: 0 2rem;
          height: 72px;
          position: sticky;
          top: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
        }

        .navbar-header.scrolled {
          background-color: rgba(255, 255, 255, 0.98);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .navbar-container {
          max-width: 1400px;
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
          transition: transform 0.2s ease;
        }

        .navbar-logo:hover {
          transform: scale(1.02);
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .logo-badge {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.625rem;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        .navbar-links {
          display: flex;
          gap: 2.5rem;
          align-items: center;
        }

        .nav-link {
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          font-size: 0.9375rem;
          transition: all 0.2s ease;
          position: relative;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transition: width 0.3s ease;
        }

        .nav-link:hover::after,
        .nav-link.active::after {
          width: 100%;
        }

        .nav-link:hover,
        .nav-link.active {
          color: #2563eb;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .auth-buttons {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .login-link {
          text-decoration: none;
          color: #475569;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: color 0.2s ease;
        }

        .login-link:hover {
          color: #0f172a;
        }

        .register-cta {
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.875rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .primary-cta {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .primary-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }

        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          color: #475569;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .mobile-menu-button:hover {
          background-color: #f1f5f9;
          color: #2563eb;
        }

        .mobile-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-nav {
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mobile-nav-link {
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          font-size: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .mobile-nav-link:hover,
        .mobile-nav-link.active {
          background-color: #f1f5f9;
          color: #2563eb;
        }

        .mobile-auth-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .mobile-auth-link {
          text-decoration: none;
          color: #475569;
          font-weight: 600;
          font-size: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          text-align: center;
        }

        .mobile-auth-link:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }

        .mobile-auth-cta {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9375rem;
          text-decoration: none;
          text-align: center;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          transition: all 0.2s ease;
        }

        .mobile-auth-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }

        @media (max-width: 1024px) {
          .desktop-nav,
          .desktop-auth {
            display: none;
          }

          .mobile-menu-button {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .mobile-menu {
            display: block;
          }
        }

        @media (max-width: 640px) {
          .navbar-header {
            padding: 0 1rem;
            height: 64px;
          }

          .logo-text {
            font-size: 1.25rem;
          }

          .mobile-nav {
            padding: 1rem;
          }
        }
      `}</style>
    </header>
  );
};

export default PublicNavbar;
