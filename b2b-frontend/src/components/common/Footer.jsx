import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../routes/routeConfig.js';
import { Globe, Mail, Phone, MapPin, Share2, MessageSquare } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-main">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to={routes.LANDING} className="footer-logo">
              <span className="logo-text">Mokshith</span>
              <span className="logo-badge">B2B</span>
            </Link>
            <p className="brand-description">
              The leading B2B commerce platform for growing businesses. 
              Simplifying bulk ordering, credit management, and logistics.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Website"><Globe size={20} /></a>
              <a href="#" aria-label="Contact"><MessageSquare size={20} /></a>
              <a href="#" aria-label="Share"><Share2 size={20} /></a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Products</h4>
            <ul>
              <li><Link to={routes.PRODUCTS}>Browse Products</Link></li>
              <li><a href="#">Bulk Orders</a></li>
              <li><a href="#">Custom Pricing</a></li>
              <li><a href="#">New Arrivals</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contact Us</h4>
            <ul>
              <li><MapPin size={18} /> 123 Business Avenue, Tech City</li>
              <li><Phone size={18} /> +1 (555) 000-0000</li>
              <li><Mail size={18} /> support@mokshith.com</li>
            </ul>
          </div>
        </div>

        {/* Download App Section */}
        <div className="footer-download-app">
          <div className="download-content">
            <div className="download-text">
              <h3>For better experience download our mobile application</h3>
              <p>Get real-time updates, track orders, and manage bulk purchases on the go.</p>
              <div className="app-badges">
                <a href="#" className="app-badge">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" />
                </a>
                <a href="#" className="app-badge">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" />
                </a>
              </div>
            </div>
            <div className="download-visual">
              <div className="mini-mockup">
                <div className="mini-mockup-screen">
                  <div className="mini-header"></div>
                  <div className="mini-body">
                    <div className="mini-card"></div>
                    <div className="mini-card"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Mokshith Enterprises. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>

      <style>{`
        .footer-main {
          background-color: var(--surface);
          border-top: 1px solid var(--border);
          padding: 80px 0 40px;
          margin-top: 80px;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 60px;
          margin-bottom: 80px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          text-decoration: none;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -1px;
        }

        .logo-badge {
          background-color: var(--primary);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .brand-description {
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
          max-width: 300px;
        }

        .social-links {
          display: flex;
          gap: 16px;
        }

        .social-links a {
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .social-links a:hover {
          color: var(--primary);
        }

        .footer-links h4, .footer-contact h4 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 24px;
        }

        .footer-links ul, .footer-contact ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 12px;
        }

        .footer-links a {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: var(--primary);
        }

        .footer-contact li {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 14px;
          margin-bottom: 16px;
        }

        .footer-contact svg {
          color: var(--primary);
        }

        /* Download App Section Styles */
        .footer-download-app {
          background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%);
          border-radius: 24px;
          padding: 40px;
          color: white;
          margin-bottom: 60px;
          position: relative;
          overflow: hidden;
        }

        .download-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          position: relative;
          z-index: 2;
        }

        .download-text h3 {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .download-text p {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 24px;
          max-width: 450px;
        }

        .app-badges {
          display: flex;
          gap: 12px;
        }

        .app-badge img {
          height: 40px;
        }

        .download-visual {
          display: none;
        }

        @media (min-width: 1024px) {
          .download-visual {
            display: block;
          }
        }

        .mini-mockup {
          width: 180px;
          height: 240px;
          background: #111;
          border-radius: 20px;
          padding: 10px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          transform: rotate(5deg);
        }

        .mini-mockup-screen {
          height: 100%;
          background: #f8fafc;
          border-radius: 12px;
          overflow: hidden;
        }

        .mini-header {
          height: 30px;
          background: white;
          border-bottom: 1px solid #eee;
        }

        .mini-body {
          padding: 10px;
        }

        .mini-card {
          height: 60px;
          background: white;
          border-radius: 8px;
          margin-bottom: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .footer-bottom {
          padding-top: 40px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-bottom p {
          color: var(--text-muted);
          font-size: 14px;
        }

        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }

        .footer-bottom-links a {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-bottom-links a:hover {
          color: var(--primary);
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }

        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
          
          .footer-bottom {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .footer-download-app {
            padding: 30px;
          }

          .download-text h3 {
            font-size: 20px;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
