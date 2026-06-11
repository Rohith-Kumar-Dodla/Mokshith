import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, Zap, 
  Sparkles, Truck, ShoppingCart, CheckCircle, Clock, Package, 
  Menu, X, Globe, Mail, Phone, MapPin 
} from 'lucide-react';

// Note: Replace these with your actual route configuration
const routes = {
  LANDING: '/',
  DASHBOARD: '/dashboard',
  REGISTER: '/register',
  LOGIN: '/login',
  PRODUCTS: '/products',
  PRICING: '/pricing',
  SOLUTIONS: '/solutions',
  CONTACT: '/contact',
  ABOUT: '/about'
};

// Note: Replace with your actual auth hook or remove if not needed
const useAuth = () => ({
  user: null // Set to mock user object for testing
});

// ==================== PUBLIC NAVBAR ====================
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
    </header>
  );
};

// ==================== HERO SECTION ====================
const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate(routes.DASHBOARD);
    } else {
      navigate(routes.REGISTER);
    }
  };

  const trustBadges = [
    { icon: <CheckCircle2 size={16} />, text: 'GST Compliant' },
    { icon: <ShieldCheck size={16} />, text: 'Secure Payments' },
    { icon: <TrendingUp size={16} />, text: 'Business Credit' },
    { icon: <Zap size={16} />, text: 'Fast Delivery' },
  ];

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>Trusted by 1,000+ businesses</span>
          </div>
          
          <h1 className="hero-title">
            Smart B2B Commerce Platform for Growing Businesses
          </h1>
          
          <p className="hero-subtitle">
            Manage bulk purchases, vendor relationships, business credit, logistics, and enterprise procurement in one powerful platform.
          </p>
          
          <div className="hero-actions">
            <button onClick={handleGetStarted} className="hero-button primary">
              {user ? 'Go to Dashboard' : 'Get Started'} <ArrowRight size={18} />
            </button>
            <Link to={routes.PRODUCTS} className="hero-button secondary">
              Browse Products
            </Link>
          </div>

          <div className="trust-badges">
            {trustBadges.map((badge, index) => (
              <div key={index} className="trust-badge">
                <span className="trust-icon">{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="mockup-title">Business Dashboard</div>
            </div>
            <div className="mockup-body">
              <div className="mockup-stats">
                <div className="stat-card">
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-value">2,847</div>
                  <div className="stat-change positive">+12.5%</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Credit Available</div>
                  <div className="stat-value">₹2.5L</div>
                  <div className="stat-change">Active</div>
                </div>
              </div>
              <div className="mockup-list">
                <div className="list-item">
                  <div className="item-icon">📦</div>
                  <div className="item-info">
                    <div className="item-name">Bulk Rice Order</div>
                    <div className="item-status">In Transit</div>
                  </div>
                  <div className="item-amount">₹45,000</div>
                </div>
                <div className="list-item">
                  <div className="item-icon">🛢️</div>
                  <div className="item-info">
                    <div className="item-name">Edible Oil Supply</div>
                    <div className="item-status">Delivered</div>
                  </div>
                  <div className="item-amount">₹32,000</div>
                </div>
                <div className="list-item">
                  <div className="item-icon">🫘</div>
                  <div className="item-info">
                    <div className="item-name">Pulses Bulk Order</div>
                    <div className="item-status">Processing</div>
                  </div>
                  <div className="item-amount">₹28,500</div>
                </div>
              </div>
            </div>
          </div>

          <div className="floating-card card-1">
            <div className="card-icon">💳</div>
            <div className="card-content">
              <div className="card-label">Credit Line</div>
              <div className="card-value">₹25,000</div>
            </div>
          </div>

          <div className="floating-card card-2">
            <div className="card-icon">🚚</div>
            <div className="card-content">
              <div className="card-label">Active Shipments</div>
              <div className="card-value">12</div>
            </div>
          </div>

          <div className="floating-card card-3">
            <div className="card-icon">✓</div>
            <div className="card-content">
              <div className="card-label">Orders Completed</div>
              <div className="card-value">156</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ==================== PLATFORM SHOWCASE ====================
const PlatformShowcase = () => {
  return (
    <section className="platform-showcase-section">
      <div className="showcase-container">
        <div className="section-header">
          <h2 className="section-title">Platform Capabilities</h2>
          <p className="section-subtitle">Experience seamless B2B operations with our powerful tools</p>
        </div>

        <div className="showcase-grid">
          {/* Order Tracking Widget */}
          <div className="showcase-card tracking-card">
            <div className="card-header">
              <div className="card-icon tracking-icon">
                <Truck size={24} />
              </div>
              <h3 className="card-title">Order Tracking</h3>
            </div>
            <div className="card-body">
              <div className="tracking-info">
                <div className="tracking-id">Order #ME1234567890</div>
                <div className="tracking-status">In Transit</div>
              </div>
              <div className="tracking-timeline">
                <div className="timeline-step completed">
                  <div className="step-icon">
                    <CheckCircle size={16} />
                  </div>
                  <div className="step-content">
                    <div className="step-label">Order Confirmed</div>
                    <div className="step-time">10:30 AM</div>
                  </div>
                </div>
                <div className="timeline-step completed">
                  <div className="step-icon">
                    <Package size={16} />
                  </div>
                  <div className="step-content">
                    <div className="step-label">Packed</div>
                    <div className="step-time">11:45 AM</div>
                  </div>
                </div>
                <div className="timeline-step active">
                  <div className="step-icon">
                    <Truck size={16} />
                  </div>
                  <div className="step-content">
                    <div className="step-label">Shipped</div>
                    <div className="step-time">2:00 PM</div>
                  </div>
                </div>
                <div className="timeline-step pending">
                  <div className="step-icon">
                    <Clock size={16} />
                  </div>
                  <div className="step-content">
                    <div className="step-label">Out for Delivery</div>
                    <div className="step-time">Expected: Tomorrow</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Widget */}
          <div className="showcase-card checkout-card">
            <div className="card-header">
              <div className="card-icon checkout-icon">
                <ShoppingCart size={24} />
              </div>
              <h3 className="card-title">Quick Checkout</h3>
            </div>
            <div className="card-body">
              <div className="checkout-items">
                <div className="checkout-item">
                  <div className="item-emoji">🍚</div>
                  <div className="item-details">
                    <div className="item-name">Sona Masoori Rice</div>
                    <div className="item-qty">10 × 25kg</div>
                  </div>
                  <div className="item-price">₹11,500</div>
                </div>
                <div className="checkout-item">
                  <div className="item-emoji">🧴</div>
                  <div className="item-details">
                    <div className="item-name">Sunflower Oil</div>
                    <div className="item-qty">5 × 15L</div>
                  </div>
                  <div className="item-price">₹8,850</div>
                </div>
              </div>
              <div className="checkout-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹20,350</span>
                </div>
                <div className="summary-row">
                  <span>GST (5%)</span>
                  <span>₹1,018</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹21,368</span>
                </div>
              </div>
              <button className="checkout-button">
                Proceed to Payment <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ==================== CTA SECTION ====================
const CTASection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate(routes.DASHBOARD);
    } else {
      navigate(routes.REGISTER);
    }
  };

  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-content">
          <div className="cta-badge">
            <Sparkles size={16} />
            <span>Start Your Journey Today</span>
          </div>
          
          <h2 className="cta-title">
            Ready to Transform Your Business?
          </h2>
          
          <p className="cta-subtitle">
            Join thousands of businesses already scaling with our platform. 
            Get started in minutes and unlock exclusive bulk pricing, business credit, and more.
          </p>
          
          <div className="cta-actions">
            <button onClick={handleGetStarted} className="cta-button primary">
              {user ? 'Go to Dashboard' : 'Create Your Account'} <ArrowRight size={18} />
            </button>
            <Link to={routes.CONTACT} className="cta-button secondary">
              Contact Sales
            </Link>
          </div>

          <div className="cta-features">
            <div className="cta-feature">
              <span className="feature-check">✓</span>
              <span>Free to sign up</span>
            </div>
            <div className="cta-feature">
              <span className="feature-check">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="cta-feature">
              <span className="feature-check">✓</span>
              <span>Instant business credit</span>
            </div>
          </div>
        </div>

        <div className="cta-visual">
          <div className="credit-card-mockup">
            <div className="card-chip">💳</div>
            <div className="card-number">•••• •••• •••• 4532</div>
            <div className="card-holder">
              <div className="holder-label">BUSINESS CREDIT</div>
              <div className="holder-value">₹25,000</div>
            </div>
            <div className="card-brand">MOKSHITH B2B</div>
          </div>

          <div className="floating-badge badge-1">
            <span>🎉</span>
            <span>Welcome Bonus</span>
          </div>

          <div className="floating-badge badge-2">
            <span>⚡</span>
            <span>Instant Approval</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ==================== FOOTER ====================
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-main">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to={routes.LANDING} className="footer-logo">
              <span className="logo-text">Mokshith</span>
              <span className="logo-badge">B2B</span>
            </Link>
            <p className="brand-description">
              The leading B2B commerce platform for growing businesses. 
              Simplifying bulk ordering, credit management, and logistics.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Website"><Globe size={20} /></a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><Link to={routes.ABOUT}>About Us</Link></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><Link to={routes.CONTACT}>Contact</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Products</h4>
            <ul>
              <li><Link to={routes.PRODUCTS}>Browse Products</Link></li>
              <li><a href="#">Bulk Orders</a></li>
              <li><a href="#">Custom Pricing</a></li>
              <li><a href="#">New Arrivals</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">FAQs</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contact</h4>
            <ul>
              <li><MapPin size={18} /> 123 Business Avenue, Tech City</li>
              <li><Phone size={18} /> +1 (555) 000-0000</li>
              <li><Mail size={18} /> support@mokshith.com</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Mokshith Enterprises. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ==================== MAIN HOMEPAGE COMPONENT ====================
const HomePage = () => {
  return (
    <>
      <PublicNavbar />
      <HeroSection />
      <PlatformShowcase />
      <CTASection />
      <Footer />
      
      <style>{`
        /* ==================== GLOBAL RESET ==================== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ==================== NAVBAR STYLES ==================== */
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

        /* ==================== HERO SECTION STYLES ==================== */
        .hero-section {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
          padding: 6rem 2rem 4rem;
          position: relative;
          overflow: hidden;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse 8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .hero-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          width: fit-content;
          font-size: 0.875rem;
          font-weight: 600;
          color: #2563eb;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: blink 2s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
          max-width: 600px;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .hero-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 12px;
          transition: all 0.3s ease;
          text-decoration: none;
          cursor: pointer;
          border: none;
        }

        .hero-button.primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4);
        }

        .hero-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(37, 99, 235, 0.5);
        }

        .hero-button.secondary {
          background: white;
          color: #0f172a;
          border: 2px solid #e2e8f0;
        }

        .hero-button.secondary:hover {
          border-color: #2563eb;
          color: #2563eb;
          transform: translateY(-2px);
        }

        .trust-badges {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .trust-icon {
          color: #22c55e;
        }

        .hero-visual {
          position: relative;
          height: 600px;
        }

        .dashboard-mockup {
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .mockup-header {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .mockup-dots {
          display: flex;
          gap: 0.5rem;
        }

        .mockup-dots span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
        }

        .mockup-title {
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .mockup-body {
          padding: 1.5rem;
        }

        .mockup-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .stat-change {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .stat-change.positive {
          color: #22c55e;
        }

        .mockup-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .list-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .item-icon {
          font-size: 1.5rem;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: #0f172a;
        }

        .item-status {
          font-size: 0.75rem;
          color: #64748b;
        }

        .item-amount {
          font-weight: 700;
          color: #2563eb;
          font-size: 0.875rem;
        }

        .floating-card {
          position: absolute;
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
          animation: float 6s ease-in-out infinite;
        }

        .card-1 {
          top: 10%;
          right: -10%;
          animation-delay: -2s;
        }

        .card-2 {
          top: 50%;
          right: -15%;
          animation-delay: -4s;
        }

        .card-3 {
          bottom: 15%;
          right: -5%;
          animation-delay: -1s;
        }

        .card-icon {
          font-size: 2rem;
        }

        .card-content {
          display: flex;
          flex-direction: column;
        }

        .card-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .card-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
        }

        @media (max-width: 1024px) {
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero-content {
            align-items: center;
          }

          .hero-actions {
            justify-content: center;
          }

          .trust-badges {
            justify-content: center;
          }

          .hero-visual {
            height: 500px;
            margin-top: 2rem;
          }

          .floating-card {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .hero-section {
            padding: 4rem 1rem 2rem;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .hero-actions {
            flex-direction: column;
            width: 100%;
          }

          .hero-button {
            width: 100%;
            justify-content: center;
          }

          .trust-badges {
            flex-direction: column;
            align-items: center;
          }

          .mockup-stats {
            grid-template-columns: 1fr;
          }
        }

        /* ==================== PLATFORM SHOWCASE STYLES ==================== */
        .platform-showcase-section {
          padding: 6rem 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .showcase-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0 0 1rem 0;
        }

        .section-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          margin: 0;
        }

        .showcase-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .showcase-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .showcase-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .card-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .tracking-icon {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .checkout-icon {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Tracking Styles */
        .tracking-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .tracking-id {
          font-weight: 700;
          color: #0f172a;
          font-size: 1rem;
        }

        .tracking-status {
          background: #dcfce7;
          color: #166534;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .tracking-timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .timeline-step {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .timeline-step.completed {
          background: #f0fdf4;
        }

        .timeline-step.active {
          background: #eff6ff;
          border: 2px solid #2563eb;
        }

        .timeline-step.pending {
          background: #f8fafc;
          opacity: 0.6;
        }

        .step-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .timeline-step.completed .step-icon {
          background: #22c55e;
          color: white;
        }

        .timeline-step.active .step-icon {
          background: #2563eb;
          color: white;
        }

        .timeline-step.pending .step-icon {
          background: #e2e8f0;
          color: #64748b;
        }

        .step-content {
          flex: 1;
        }

        .step-label {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.9375rem;
          margin-bottom: 0.25rem;
        }

        .step-time {
          font-size: 0.8125rem;
          color: #64748b;
        }

        /* Checkout Styles */
        .checkout-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checkout-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .item-emoji {
          font-size: 1.5rem;
        }

        .item-details {
          flex: 1;
        }

        .item-name {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.9375rem;
        }

        .item-qty {
          font-size: 0.8125rem;
          color: #64748b;
        }

        .item-price {
          font-weight: 700;
          color: #2563eb;
          font-size: 1rem;
        }

        .checkout-summary {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9375rem;
          color: #64748b;
        }

        .summary-row.total {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0f172a;
          border-top: 1px dashed #cbd5e1;
          padding-top: 0.75rem;
          margin-top: 0.5rem;
        }

        .checkout-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .checkout-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
        }

        @media (max-width: 1024px) {
          .showcase-grid {
            grid-template-columns: 1fr;
          }

          .section-title {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .platform-showcase-section {
            padding: 4rem 1rem;
          }

          .section-title {
            font-size: 1.75rem;
          }

          .section-subtitle {
            font-size: 1rem;
          }

          .showcase-card {
            padding: 1.5rem;
          }

          .card-header {
            flex-direction: column;
            text-align: center;
          }

          .card-title {
            font-size: 1.25rem;
          }
        }

        /* ==================== CTA SECTION STYLES ==================== */
        .cta-section {
          padding: 6rem 2rem;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%);
          position: relative;
          overflow: hidden;
        }

        .cta-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -20%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        }

        .cta-section::after {
          content: '';
          position: absolute;
          bottom: -50%;
          right: -20%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        }

        .cta-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .cta-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .cta-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          width: fit-content;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
        }

        .cta-title {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.1;
          color: white;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .cta-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          margin: 0;
          max-width: 600px;
        }

        .cta-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 12px;
          transition: all 0.3s ease;
          text-decoration: none;
          cursor: pointer;
          border: none;
        }

        .cta-button.primary {
          background: white;
          color: #2563eb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .cta-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .cta-button.secondary {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .cta-button.secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        .cta-features {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .cta-feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .feature-check {
          color: #4ade80;
          font-weight: 700;
        }

        .cta-visual {
          position: relative;
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .credit-card-mockup {
          width: 340px;
          height: 220px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-20px) rotate(-5deg); }
        }

        .card-chip {
          font-size: 2rem;
        }

        .card-number {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          letter-spacing: 0.1em;
        }

        .card-holder {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .holder-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .holder-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
        }

        .card-brand {
          font-size: 0.875rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .floating-badge {
          position: absolute;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          animation: float 6s ease-in-out infinite;
        }

        .badge-1 {
          top: 10%;
          right: 0;
          animation-delay: -2s;
        }

        .badge-2 {
          bottom: 20%;
          right: -10%;
          animation-delay: -4s;
        }

        @media (max-width: 1024px) {
          .cta-container {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .cta-content {
            align-items: center;
          }

          .cta-actions {
            justify-content: center;
          }

          .cta-features {
            justify-content: center;
          }

          .cta-visual {
            display: none;
          }

          .cta-title {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .cta-section {
            padding: 4rem 1rem;
          }

          .cta-title {
            font-size: 2rem;
          }

          .cta-subtitle {
            font-size: 1rem;
          }

          .cta-actions {
            flex-direction: column;
            width: 100%;
          }

          .cta-button {
            width: 100%;
            justify-content: center;
          }

          .cta-features {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
        }

        /* ==================== FOOTER STYLES ==================== */
        .footer-main {
          background-color: #0f172a;
          border-top: 1px solid #1e293b;
          padding: 80px 0 40px;
          margin-top: 80px;
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr;
          gap: 40px;
          margin-bottom: 60px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          text-decoration: none;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 800;
          color: white;
          letter-spacing: -1px;
        }

        .logo-badge {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .brand-description {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
          max-width: 300px;
        }

        .social-links {
          display: flex;
          gap: 12px;
        }

        .social-links a {
          color: #94a3b8;
          transition: all 0.2s;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
        }

        .social-links a:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .footer-links h4, .footer-contact h4 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin-bottom: 24px;
        }

        .footer-links ul, .footer-contact ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 12px;
        }

        .footer-links a {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: white;
        }

        .footer-contact li {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .footer-contact svg {
          color: #2563eb;
        }

        .footer-bottom {
          padding-top: 40px;
          border-top: 1px solid #1e293b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-bottom p {
          color: #94a3b8;
          font-size: 14px;
        }

        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }

        .footer-bottom-links a {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-bottom-links a:hover {
          color: white;
        }

        @media (max-width: 1280px) {
          .footer-grid {
            grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
          }
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }

          .footer-brand {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
          
          .footer-bottom {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
};

export default HomePage;
