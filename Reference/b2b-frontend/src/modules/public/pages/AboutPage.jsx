import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../routes/routeConfig.js';
import PublicNavbar from '../../../components/common/PublicNavbar.jsx';
import Footer from '../../../components/common/Footer.jsx';

const AboutPage = () => {
  return (
    <div className="about-page">
      <PublicNavbar />
      <main className="about-main">
        <div className="about-container">
          <div className="about-header">
            <h1>About Us</h1>
            <p>Learn more about Mokshith Enterprises</p>
          </div>
          <div className="about-content">
            <p>Coming soon - Company information, mission, and values.</p>
            <Link to={routes.LANDING} className="back-link">Back to Home</Link>
          </div>
        </div>
      </main>
      <Footer />
      
      <style>{`
        .about-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .about-main {
          flex: 1;
          padding: 6rem 2rem;
          background: #f8fafc;
        }

        .about-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .about-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .about-header h1 {
          font-size: 3rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 1rem 0;
        }

        .about-header p {
          font-size: 1.25rem;
          color: #64748b;
          margin: 0;
        }

        .about-content {
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

export default AboutPage;
