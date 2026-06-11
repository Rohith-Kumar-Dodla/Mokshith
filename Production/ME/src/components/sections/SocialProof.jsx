import React, { useState, useEffect } from 'react';
import { Building2, ShoppingCart, Package, Users } from 'lucide-react';

const SocialProof = () => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(true);
  }, []);

  const stats = [
    {
      icon: <Building2 className="w-6 h-6" />,
      value: "1,000+",
      label: "Businesses",
      description: "Trust our platform"
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      value: "50,000+",
      label: "Orders",
      description: "Successfully processed"
    },
    {
      icon: <Package className="w-6 h-6" />,
      value: "500+",
      label: "Vendors",
      description: "Across India"
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: "₹25,000",
      label: "Credit Line",
      description: "Average per business"
    }
  ];

  return (
    <section className="social-proof-section">
      <div className="proof-container">
        <div className="section-header">
          <h2 className="section-title">Trusted by Growing Businesses</h2>
          <p className="section-subtitle">Join thousands of businesses already scaling with our platform</p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon-wrapper">
                <div className="stat-icon">{stat.icon}</div>
              </div>
              <div className="stat-content">
                <div className={`stat-value ${animated ? 'animated' : ''}`}>
                  {stat.value}
                </div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-description">{stat.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="trust-badges">
          <div className="trust-badge">
            <div className="badge-icon">✓</div>
            <span>GST Compliant</span>
          </div>
          <div className="trust-badge">
            <div className="badge-icon">🔒</div>
            <span>Secure Payments</span>
          </div>
          <div className="trust-badge">
            <div className="badge-icon">⚡</div>
            <span>Fast Delivery</span>
          </div>
          <div className="trust-badge">
            <div className="badge-icon">💳</div>
            <span>Business Credit</span>
          </div>
        </div>
      </div>

      <style>{`
        .social-proof-section {
          padding: 6rem 2rem;
          background: white;
        }

        .proof-container {
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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: #2563eb;
        }

        .stat-icon-wrapper {
          width: 64px;
          height: 64px;
          background: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .stat-card:hover .stat-icon {
          color: white;
        }

        .stat-icon {
          color: #2563eb;
          transition: all 0.3s ease;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 0.5rem;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
        }

        .stat-value.animated {
          opacity: 1;
          transform: translateY(0);
        }

        .stat-label {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
        }

        .stat-description {
          font-size: 0.875rem;
          color: #64748b;
        }

        .trust-badges {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #475569;
          transition: all 0.3s ease;
        }

        .trust-badge:hover {
          background: white;
          border-color: #2563eb;
          color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.15);
        }

        .badge-icon {
          font-size: 1.25rem;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .section-title {
            font-size: 2rem;
          }

          .trust-badges {
            gap: 1rem;
          }
        }

        @media (max-width: 768px) {
          .social-proof-section {
            padding: 4rem 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .section-title {
            font-size: 1.75rem;
          }

          .section-subtitle {
            font-size: 1rem;
          }

          .stat-card {
            padding: 1.5rem;
          }

          .stat-value {
            font-size: 2rem;
          }

          .trust-badges {
            flex-direction: column;
            align-items: center;
          }

          .trust-badge {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
};

export default SocialProof;
