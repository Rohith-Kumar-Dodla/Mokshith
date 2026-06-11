import React from 'react';
import { ShoppingBag, CreditCard, Truck, Receipt, Activity, ShieldCheck } from 'lucide-react';

const BusinessFeatures = () => {
  const features = [
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: "Bulk Ordering",
      description: "Optimized for large volume purchases with multi-tier pricing and volume discounts.",
      color: "#2563eb"
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Credit System",
      description: "Manage business credit lines with flexible payment terms and automated invoicing.",
      color: "#7c3aed"
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Fast Delivery",
      description: "Reliable logistics network with next-day delivery options and real-time tracking.",
      color: "#059669"
    },
    {
      icon: <Receipt className="w-6 h-6" />,
      title: "GST Invoicing",
      description: "Automated GST-compliant invoices for all your business orders with tax calculations.",
      color: "#dc2626"
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Real-time Tracking",
      description: "Track your shipments in real-time from warehouse to doorstep with live updates.",
      color: "#ea580c"
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Secure Payments",
      description: "Multiple secure payment gateways with fraud protection and encrypted transactions.",
      color: "#0891b2"
    }
  ];

  return (
    <section className="business-features-section">
      <div className="features-container">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Scale</h2>
          <p className="section-subtitle">Powerful features designed for modern B2B operations</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-wrapper" style={{ backgroundColor: `${feature.color}15` }}>
                <div className="feature-icon" style={{ color: feature.color }}>
                  {feature.icon}
                </div>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .business-features-section {
          padding: 6rem 2rem;
          background: white;
        }

        .features-container {
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

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .feature-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.3s ease;
          cursor: default;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: #2563eb;
        }

        .feature-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
        }

        .feature-card:hover .feature-icon-wrapper {
          transform: scale(1.1);
        }

        .feature-icon {
          transition: all 0.3s ease;
        }

        .feature-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .feature-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .feature-description {
          font-size: 0.9375rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .section-title {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .business-features-section {
            padding: 4rem 1rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .section-title {
            font-size: 1.75rem;
          }

          .section-subtitle {
            font-size: 1rem;
          }

          .feature-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </section>
  );
};

export default BusinessFeatures;
