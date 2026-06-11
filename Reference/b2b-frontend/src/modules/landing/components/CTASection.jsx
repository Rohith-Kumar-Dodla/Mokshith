import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { routes } from '../../../routes/routeConfig.js';
import { useAuth } from '../../auth/hooks/useAuth.js';

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

      <style>{`
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
      `}</style>
    </section>
  );
};

export default CTASection;
