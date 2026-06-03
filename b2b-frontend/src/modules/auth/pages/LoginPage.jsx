import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useSelector } from "react-redux";
import { routes } from "../../../routes/routeConfig.js";
import { 
  Phone, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle,
  LayoutDashboard,
  Building2,
  ShieldCheck
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const { config } = useSelector((state) => state.superAdmin);

  const [form, setForm] = useState({
    mobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      // Only allow numbers and limit to 10 digits
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setForm(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
    } catch (err) {
      // Error handled by useAuth
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <div className="sidebar-content">
          <Link to={routes.LANDING} className="sidebar-logo">
            <span className="logo-text">Mokshith</span>
            <span className="logo-badge">B2B</span>
          </Link>
          <div className="sidebar-features">
            <div className="feature-item">
              <div className="feature-icon"><LayoutDashboard size={20} /></div>
              <div>
                <h4>Unified Dashboard</h4>
                <p>Manage all your business operations from a single professional interface.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Building2 size={20} /></div>
              <div>
                <h4>Vendor Management</h4>
                <p>Onboard and manage multiple vendors with ease and transparency.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><ShieldCheck size={20} /></div>
              <div>
                <h4>Secure Infrastructure</h4>
                <p>Enterprise-grade security protecting your business data 24/7.</p>
              </div>
            </div>
          </div>
          <div className="sidebar-footer">
            <p>© 2026 Mokshith Enterprises. All rights reserved.</p>
          </div>
        </div>
      </div>

      <div className="auth-main">
        <div className="auth-form-wrapper">
          <div className="auth-header">
            <h1>Welcome back</h1>
            <p>Enter your mobile number and password to access your account</p>
          </div>

          {config?.maintenanceMode && (
            <div className="maintenance-banner">
              <AlertCircle size={18} />
              <span>System Under Maintenance</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <div className="form-group">
              <label>Mobile Number</label>
              <div className="input-wrapper">
                <div className="input-prefix">+91</div>
                <input
                  type="text"
                  name="mobile"
                  placeholder="Enter 10 digit number"
                  value={form.mobile}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>Password</label>
                <Link to="#" className="forgot-link">Forgot password?</Link>
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span>Remember me for 30 days</span>
              </label>
            </div>

            <button 
              type="submit" 
              className="premium-button premium-button-primary auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-footer-text">
            Don't have an account? <Link to={routes.REGISTER}>Create an account</Link>
          </div>
        </div>
      </div>

      <style>{`
        .auth-container {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .auth-sidebar {
          flex: 0 0 450px;
          background-color: #0f172a;
          color: white;
          padding: 4rem;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        @media (max-width: 1024px) {
          .auth-sidebar {
            display: none;
          }
        }

        .auth-sidebar::before {
          content: "";
          position: absolute;
          top: -20%;
          right: -20%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          margin-bottom: 6rem;
        }

        .logo-text {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: white;
        }

        .logo-badge {
          background: #38bdf8;
          color: #0f172a;
          font-size: 0.75rem;
          padding: 0.25rem 0.625rem;
          border-radius: 6px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .sidebar-features {
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
          flex: 1;
        }

        .feature-item {
          display: flex;
          gap: 1.5rem;
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .feature-item:nth-child(1) { animation-delay: 0.1s; }
        .feature-item:nth-child(2) { animation-delay: 0.2s; }
        .feature-item:nth-child(3) { animation-delay: 0.3s; }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-icon {
          width: 3rem;
          height: 3rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #38bdf8;
        }

        .feature-item h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.625rem;
          color: white;
        }

        .feature-item p {
          color: #94a3b8;
          line-height: 1.6;
          font-size: 1rem;
        }

        .sidebar-footer {
          margin-top: auto;
          color: #64748b;
          font-size: 0.875rem;
        }

        .auth-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .auth-form-wrapper {
          width: 100%;
          max-width: 440px;
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .auth-header {
          margin-bottom: 3rem;
        }

        .auth-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 1rem;
          letter-spacing: -0.025em;
        }

        .auth-header p {
          color: #64748b;
          font-size: 1.125rem;
          line-height: 1.5;
        }

        .maintenance-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #fff7ed;
          color: #9a3412;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          border: 1px solid #ffedd5;
          font-size: 0.9375rem;
          font-weight: 500;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #fef2f2;
          color: #b91c1c;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          border: 1px solid #fee2e2;
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .form-group label {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #334155;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-link {
          color: #0284c7;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #0369a1;
          text-decoration: underline;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-prefix {
          position: absolute;
          left: 1.25rem;
          color: #64748b;
          font-weight: 600;
          font-size: 1rem;
          border-right: 1px solid #e2e8f0;
          padding-right: 0.75rem;
        }

        .input-icon {
          position: absolute;
          left: 1.25rem;
          color: #64748b;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
          background: white;
          color: #0f172a;
        }

        .form-group:first-child .input-wrapper input {
          padding-left: 4.5rem;
        }

        .form-group:nth-child(2) .input-wrapper input {
          padding-left: 3.25rem;
          padding-right: 3.25rem;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #0284c7;
          box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.1);
        }

        .input-wrapper input::placeholder {
          color: #94a3b8;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s, background 0.2s;
        }

        .password-toggle:hover {
          color: #0f172a;
          background: #f1f5f9;
        }

        .form-options {
          display: flex;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.9375rem;
          color: #64748b;
          user-select: none;
        }

        .checkbox-label input {
          display: none;
        }

        .checkbox-custom {
          width: 1.25rem;
          height: 1.25rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 6px;
          position: relative;
          transition: all 0.2s;
          background: white;
        }

        .checkbox-label input:checked + .checkbox-custom {
          background-color: #0284c7;
          border-color: #0284c7;
        }

        .checkbox-label input:checked + .checkbox-custom::after {
          content: "";
          position: absolute;
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .premium-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          width: 100%;
        }

        .premium-button-primary {
          background: #0284c7;
          color: white;
          box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2);
        }

        .premium-button-primary:hover:not(:disabled) {
          background: #0369a1;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.3);
        }

        .premium-button-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .premium-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background: #94a3b8;
        }

        .auth-footer-text {
          margin-top: 3rem;
          text-align: center;
          color: #64748b;
          font-size: 1rem;
        }

        .auth-footer-text a {
          color: #0284c7;
          text-decoration: none;
          font-weight: 700;
        }

        .auth-footer-text a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
