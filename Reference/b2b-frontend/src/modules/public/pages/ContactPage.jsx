import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../routes/routeConfig.js';
import PublicNavbar from '../../../components/common/PublicNavbar.jsx';
import Footer from '../../../components/common/Footer.jsx';

const ContactPage = () => {
  return (
    <div className="contact-page">
      <PublicNavbar />
      <main className="contact-main">
        <div className="contact-container">
          <div className="contact-header">
            <h1>Contact Us</h1>
            <p>Get in touch with our team</p>
          </div>
          <div className="contact-content">
            <p>Coming soon - Contact form and support information.</p>
            <Link to={routes.LANDING} className="back-link">Back to Home</Link>
          </div>
        </div>
      </main>
      <Footer />
      
      <style>{`
        .contact-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .contact-main {
          flex: 1;
          padding: 6rem 2rem;
          background: #f8fafc;
        }

        .contact-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .contact-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .contact-header h1 {
          font-size: 3rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 1rem 0;
        }

        .contact-header p {
          font-size: 1.25rem;
          color: #64748b;
          margin: 0;
        }

        .contact-content {
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

export default ContactPage;
