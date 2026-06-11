import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../routes/routeConfig.js';
import PublicNavbar from '../../../components/common/PublicNavbar.jsx';
import Footer from '../../../components/common/Footer.jsx';

const PricingPage = () => {
  return (
    <div className="pricing-page">
      <PublicNavbar />
      <main className="pricing-main">
        <div className="pricing-container">
          <div className="pricing-header">
            <h1>Pricing Plans</h1>
            <p>Choose the perfect plan for your business needs</p>
          </div>
          <div className="pricing-content">
            <p>Coming soon - Flexible pricing plans for businesses of all sizes.</p>
            <Link to={routes.LANDING} className="back-link">Back to Home</Link>
          </div>
        </div>
      </main>
      <Footer />
      
      <style>{`
        .pricing-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .pricing-main {
          flex: 1;
          padding: 6rem 2rem;
          background: #f8fafc;
        }

        .pricing-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .pricing-header h1 {
          font-size: 3rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 1rem 0;
        }

        .pricing-header p {
          font-size: 1.25rem;
          color: #64748b;
          margin: 0;
        }

        .pricing-content {
          text-align: center;
          padding: 4rem;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .back-link {
          display: inline-block;
          margin-top: 2rem;
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }

        .back-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default PricingPage;
