import React from 'react';

const MobileAppPromotion = () => {
  return (
    <section className="mobile-app-section">
      <div className="app-container">
        <div className="app-content">
          <div className="app-visual">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="screen-header">
                  <div className="status-bar"></div>
                  <div className="app-bar">Mokshith B2B</div>
                </div>
                <div className="screen-body">
                  <div className="screen-card card-1">
                    <div className="card-icon">📦</div>
                    <div className="card-text">Order Tracking</div>
                  </div>
                  <div className="screen-card card-2">
                    <div className="card-icon">💳</div>
                    <div className="card-text">Business Credit</div>
                  </div>
                  <div className="screen-card card-3">
                    <div className="card-icon">🛒</div>
                    <div className="card-text">Quick Orders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="app-info">
            <h2 className="app-title">
              Manage Your Business On The Go
            </h2>
            <p className="app-subtitle">
              Download our mobile app to track orders, manage inventory, and access business credit from anywhere. Stay connected to your B2B operations 24/7.
            </p>

            <div className="app-features">
              <div className="app-feature">
                <span className="feature-icon">📱</span>
                <div className="feature-text">
                  <div className="feature-title">Real-time Tracking</div>
                  <div className="feature-desc">Track shipments live</div>
                </div>
              </div>
              <div className="app-feature">
                <span className="feature-icon">🔔</span>
                <div className="feature-text">
                  <div className="feature-title">Instant Notifications</div>
                  <div className="feature-desc">Never miss updates</div>
                </div>
              </div>
              <div className="app-feature">
                <span className="feature-icon">💳</span>
                <div className="feature-text">
                  <div className="feature-title">Mobile Payments</div>
                  <div className="feature-desc">Pay on the go</div>
                </div>
              </div>
            </div>

            <div className="app-buttons">
              <a href="#" className="app-button google-play">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play"
                  className="app-badge-img"
                />
              </a>
              <a href="#" className="app-button app-store">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                  alt="Download on the App Store"
                  className="app-badge-img"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .mobile-app-section {
          padding: 6rem 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .app-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .app-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .app-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .phone-mockup {
          width: 280px;
          height: 560px;
          background: #1a1a1a;
          border-radius: 40px;
          padding: 12px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
          animation: phoneFloat 6s ease-in-out infinite;
        }

        @keyframes phoneFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-20px) rotate(-5deg); }
        }

        .phone-screen {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 32px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .screen-header {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          padding: 1rem;
        }

        .status-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          margin-bottom: 0.75rem;
        }

        .app-bar {
          color: white;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .screen-body {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: #f8fafc;
        }

        .screen-card {
          background: white;
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .card-icon {
          font-size: 1.5rem;
        }

        .card-text {
          font-weight: 600;
          font-size: 0.875rem;
          color: #0f172a;
        }

        .card-1 { animation: slideIn 0.5s ease 0.2s both; }
        .card-2 { animation: slideIn 0.5s ease 0.4s both; }
        .card-3 { animation: slideIn 0.5s ease 0.6s both; }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .app-info {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .app-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.2;
        }

        .app-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        .app-features {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .app-feature {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .feature-icon {
          font-size: 1.5rem;
        }

        .feature-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .feature-title {
          font-weight: 700;
          color: #0f172a;
          font-size: 1rem;
        }

        .feature-desc {
          font-size: 0.875rem;
          color: #64748b;
        }

        .app-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .app-button {
          display: inline-block;
          transition: all 0.3s ease;
        }

        .app-button:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .app-badge-img {
          height: 48px;
        }

        @media (max-width: 1024px) {
          .app-content {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .app-features {
            align-items: center;
          }

          .app-buttons {
            justify-content: center;
          }

          .app-title {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .mobile-app-section {
            padding: 4rem 1rem;
          }

          .phone-mockup {
            width: 240px;
            height: 480px;
          }

          .app-title {
            font-size: 1.75rem;
          }

          .app-subtitle {
            font-size: 1rem;
          }

          .app-buttons {
            flex-direction: column;
            align-items: center;
          }

          .app-badge-img {
            height: 40px;
          }
        }
      `}</style>
    </section>
  );
};

export default MobileAppPromotion;
