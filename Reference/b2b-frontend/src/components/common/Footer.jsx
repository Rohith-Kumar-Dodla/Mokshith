import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../routes/routeConfig.js';
import { Globe, Mail, Phone, MapPin, Share2, MessageSquare, } from 'lucide-react';

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
            </div>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><Link to={routes.ABOUT}>About Us</Link></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><Link to={routes.CONTACT}>Contact</Link></li>
            </ul>
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
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">FAQs</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contact</h4>
            <ul>
              <li><MapPin size={18} /> 123 Business Avenue, Tech City</li>
              <li><Phone size={18} /> +1 (555) 000-0000</li>
              <li><Mail size={18} /> support@mokshith.com</li>
            </ul>
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
          background-color: #0f172a;
          border-top: 1px solid #1e293b;
          padding: 80px 0 40px;
          margin-top: 80px;
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr;
          gap: 40px;
          margin-bottom: 60px;
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
          color: white;
          letter-spacing: -1px;
        }

        .logo-badge {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .brand-description {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
          max-width: 300px;
        }

        .social-links {
          display: flex;
          gap: 12px;
        }

        .social-links a {
          color: #94a3b8;
          transition: all 0.2s;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
        }

        .social-links a:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .footer-links h4, .footer-contact h4 {
          font-size: 16px;
          font-weight: 700;
          color: white;
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
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: white;
        }

        .footer-contact li {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .footer-contact svg {
          color: #2563eb;
        }

        .footer-bottom {
          padding-top: 40px;
          border-top: 1px solid #1e293b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-bottom p {
          color: #94a3b8;
          font-size: 14px;
        }

        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }

        .footer-bottom-links a {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-bottom-links a:hover {
          color: white;
        }

        @media (max-width: 1280px) {
          .footer-grid {
            grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
          }
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }

          .footer-brand {
            grid-column: 1 / -1;
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
        }
      `}</style>
    </footer>
  );
};

export default Footer;
