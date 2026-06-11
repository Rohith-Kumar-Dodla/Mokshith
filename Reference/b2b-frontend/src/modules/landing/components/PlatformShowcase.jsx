import React from 'react';
import { Truck, ShoppingCart, CheckCircle, Clock, Package, ArrowRight } from 'lucide-react';

const PlatformShowcase = () => {
  return (
    <section className="platform-showcase-section">
      <div className="showcase-container">
        <div className="section-header">
          <h2 className="section-title">Platform Capabilities</h2>
          <p className="section-subtitle">Experience seamless B2B operations with our powerful tools</p>
        </div>

        <div className="showcase-grid">
          {/* Order Tracking Widget */}
          <div className="showcase-card tracking-card">
            <div className="card-header">
              <div className="card-icon tracking-icon">
                <Truck size={24} />
              </div>
              <h3 className="card-title">Order Tracking</h3>
            </div>
            <div className="card-body">
              <div className="tracking-info">
                <div className="tracking-id">Order #ME1234567890</div>
                <div className="tracking-status">In Transit</div>
              </div>
              <div className="tracking-timeline">
                <div className="timeline-step completed">
                  <div className="step-icon">
                    <CheckCircle size={16} />
                  </div>
                  <div className="step-content">
                    <div className="step-label">Order Confirmed</div>
                    <div className="step-time">10:30 AM</div>
                  </div>
                </div>
                <div className="timeline-step completed">
                  <div className="step-icon">
                    <Package size={16} />
                  </div>
                  <div className="step-content">
                    <div className="step-label">Packed</div>
                    <div className="step-time">11:45 AM</div>
                  </div>
                </div>
                <div className="timeline-step active">
                  <div className="step-icon">
                    <Truck size={16} />
                  </div>
                  <div className="step-content">
                    <div className="step-label">Shipped</div>
                    <div className="step-time">2:00 PM</div>
                  </div>
                </div>
                <div className="timeline-step pending">
                  <div className="step-icon">
                    <Clock size={16} />
                  </div>
                  <div className="step-content">
                    <div className="step-label">Out for Delivery</div>
                    <div className="step-time">Expected: Tomorrow</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Widget */}
          <div className="showcase-card checkout-card">
            <div className="card-header">
              <div className="card-icon checkout-icon">
                <ShoppingCart size={24} />
              </div>
              <h3 className="card-title">Quick Checkout</h3>
            </div>
            <div className="card-body">
              <div className="checkout-items">
                <div className="checkout-item">
                  <div className="item-emoji">🍚</div>
                  <div className="item-details">
                    <div className="item-name">Sona Masoori Rice</div>
                    <div className="item-qty">10 × 25kg</div>
                  </div>
                  <div className="item-price">₹11,500</div>
                </div>
                <div className="checkout-item">
                  <div className="item-emoji">🧴</div>
                  <div className="item-details">
                    <div className="item-name">Sunflower Oil</div>
                    <div className="item-qty">5 × 15L</div>
                  </div>
                  <div className="item-price">₹8,850</div>
                </div>
              </div>
              <div className="checkout-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹20,350</span>
                </div>
                <div className="summary-row">
                  <span>GST (5%)</span>
                  <span>₹1,018</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹21,368</span>
                </div>
              </div>
              <button className="checkout-button">
                Proceed to Payment <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .platform-showcase-section {
          padding: 6rem 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .showcase-container {
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

        .showcase-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .showcase-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .showcase-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .card-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .tracking-icon {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .checkout-icon {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Tracking Styles */
        .tracking-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .tracking-id {
          font-weight: 700;
          color: #0f172a;
          font-size: 1rem;
        }

        .tracking-status {
          background: #dcfce7;
          color: #166534;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .tracking-timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .timeline-step {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .timeline-step.completed {
          background: #f0fdf4;
        }

        .timeline-step.active {
          background: #eff6ff;
          border: 2px solid #2563eb;
        }

        .timeline-step.pending {
          background: #f8fafc;
          opacity: 0.6;
        }

        .step-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .timeline-step.completed .step-icon {
          background: #22c55e;
          color: white;
        }

        .timeline-step.active .step-icon {
          background: #2563eb;
          color: white;
        }

        .timeline-step.pending .step-icon {
          background: #e2e8f0;
          color: #64748b;
        }

        .step-content {
          flex: 1;
        }

        .step-label {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.9375rem;
          margin-bottom: 0.25rem;
        }

        .step-time {
          font-size: 0.8125rem;
          color: #64748b;
        }

        /* Checkout Styles */
        .checkout-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checkout-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .item-emoji {
          font-size: 1.5rem;
        }

        .item-details {
          flex: 1;
        }

        .item-name {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.9375rem;
        }

        .item-qty {
          font-size: 0.8125rem;
          color: #64748b;
        }

        .item-price {
          font-weight: 700;
          color: #2563eb;
          font-size: 1rem;
        }

        .checkout-summary {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9375rem;
          color: #64748b;
        }

        .summary-row.total {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0f172a;
          border-top: 1px dashed #cbd5e1;
          padding-top: 0.75rem;
          margin-top: 0.5rem;
        }

        .checkout-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .checkout-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
        }

        @media (max-width: 1024px) {
          .showcase-grid {
            grid-template-columns: 1fr;
          }

          .section-title {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .platform-showcase-section {
            padding: 4rem 1rem;
          }

          .section-title {
            font-size: 1.75rem;
          }

          .section-subtitle {
            font-size: 1rem;
          }

          .showcase-card {
            padding: 1.5rem;
          }

          .card-header {
            flex-direction: column;
            text-align: center;
          }

          .card-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </section>
  );
};

export default PlatformShowcase;
