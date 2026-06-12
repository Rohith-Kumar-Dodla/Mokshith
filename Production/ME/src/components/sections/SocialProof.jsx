import React from 'react';
import { Building2, ShoppingCart, Package, Users } from 'lucide-react';

const SocialProof = () => {
  const stats = [
    { icon: <Building2 className="w-6 h-6" />, label: 'B2B Businesses', description: 'Wholesale procurement platform' },
    { icon: <ShoppingCart className="w-6 h-6" />, label: 'Order Management', description: 'End-to-end order tracking' },
    { icon: <Package className="w-6 h-6" />, label: 'Vendor Network', description: 'Verified suppliers nationwide' },
    { icon: <Users className="w-6 h-6" />, label: 'Business Credit', description: 'Flexible payment options' },
  ];

  return (
    <section className="social-proof-section">
      <div className="proof-container">
        <div className="proof-header">
          <h2 className="proof-title">Built for B2B Commerce</h2>
          <p className="proof-subtitle">Enterprise-grade tools for wholesale businesses</p>
        </div>
        <div className="proof-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="proof-stat">
              <div className="stat-icon">{stat.icon}</div>
              <h3 className="stat-value text-lg font-semibold">{stat.label}</h3>
              <p className="stat-label">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
