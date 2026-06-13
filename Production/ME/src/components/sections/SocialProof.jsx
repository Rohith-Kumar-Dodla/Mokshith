import React from 'react';
import { Building2, ShoppingCart, Package, Users } from 'lucide-react';

const SocialProof = () => {
  const stats = [
    { icon: Building2, label: 'B2B Businesses', description: 'Wholesale procurement platform', color: '#2563eb' },
    { icon: ShoppingCart, label: 'Order Management', description: 'End-to-end order tracking', color: '#7c3aed' },
    { icon: Package, label: 'Vendor Network', description: 'Verified suppliers nationwide', color: '#059669' },
    { icon: Users, label: 'Business Credit', description: 'Flexible payment options', color: '#ea580c' },
  ];

  return (
    <section className="social-proof-section">
      <div className="proof-container">
        <div className="proof-header">
          <h2 className="proof-title">Built for B2B Commerce</h2>
          <p className="proof-subtitle">Enterprise-grade tools for wholesale businesses</p>
        </div>
        <div className="proof-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="proof-stat">
                <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15` }}>
                  <Icon className="stat-icon" size={24} style={{ color: stat.color }} />
                </div>
                <h3 className="stat-value">{stat.label}</h3>
                <p className="stat-label">{stat.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .social-proof-section {
          padding: 5rem 2rem;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }

        .proof-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .proof-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .proof-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0 0 0.75rem 0;
        }

        .proof-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          margin: 0;
        }

        .proof-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .proof-stat {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.75rem 1.5rem;
          text-align: center;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .proof-stat:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
          border-color: #cbd5e1;
        }

        .stat-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
        }

        .stat-value {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }

        .stat-label {
          font-size: 0.9375rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .proof-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .social-proof-section {
            padding: 3.5rem 1rem;
          }

          .proof-title {
            font-size: 1.75rem;
          }

          .proof-subtitle {
            font-size: 1rem;
          }

          .proof-stats {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .proof-stat {
            display: grid;
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto;
            gap: 0.25rem 1rem;
            text-align: left;
            align-items: center;
            padding: 1.25rem;
          }

          .stat-icon-wrapper {
            grid-row: span 2;
            margin: 0;
            width: 48px;
            height: 48px;
          }

          .stat-value {
            margin: 0;
            align-self: end;
          }

          .stat-label {
            align-self: start;
          }
        }
      `}</style>
    </section>
  );
};

export default SocialProof;
