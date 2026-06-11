import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../routes/routeConfig.js';
import PublicNavbar from '../../../components/common/PublicNavbar.jsx';
import Footer from '../../../components/common/Footer.jsx';

const SolutionsPage = () => {
  return (
    <div className="solutions-page">
      <PublicNavbar />
      <main className="solutions-main">
        <div className="solutions-container">
          <div className="solutions-header">
            <h1>Our Solutions</h1>
            <p>Tailored solutions for your B2B needs</p>
          </div>
          <div className="solutions-content">
            <p>Coming soon - Comprehensive solutions for bulk ordering, logistics, and business credit management.</p>
            <Link to={routes.LANDING} className="back-link">Back to Home</Link>
          </div>
        </div>
      </main>
      <Footer />
      
      <style>{`
        .solutions-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .solutions-main {
          flex: 1;
          padding: 6rem 2rem;
          background: #f8fafc;
        }

        .solutions-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .solutions-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .solutions-header h1 {
          font-size: 3rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 1rem 0;
        }

        .solutions-header p {
          font-size: 1.25rem;
          color: #64748b;
          margin: 0;
        }

        .solutions-content {
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

export default SolutionsPage;
