import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { routes } from '../../../routes/routeConfig.js';
import { useAuth } from '../../auth/hooks/useAuth.js';

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

      <style>{`
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
      `}</style>
    </section>
  );
};

export default HeroSection;
