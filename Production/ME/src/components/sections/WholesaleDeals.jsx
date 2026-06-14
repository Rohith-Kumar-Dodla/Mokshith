import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import productService from '../../services/productService';
import { unwrapApiData } from '../../utils/apiResponse';
import { mapBackendProducts } from '../../utils/productMapper';

const WholesaleDeals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    productService
      .getAllProducts({ page: 1, limit: 4, isActive: true })
      .then((response) => {
        const payload = unwrapApiData(response);
        const list = Array.isArray(payload?.products) ? payload.products : [];
        if (mounted) setProducts(mapBackendProducts(list).slice(0, 4));
      })
      .catch(() => {
        if (mounted) setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="wholesale-deals-section">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">Wholesale Deals</h2>
          <p className="section-subtitle">Bulk pricing for registered B2B vendors</p>
        </div>

        {loading ? (
          <div className="deals-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="deal-card skeleton-card" aria-hidden="true">
                <div className="skeleton-block skeleton-image" />
                <div className="skeleton-block skeleton-title" />
                <div className="skeleton-block skeleton-text" />
                <div className="skeleton-block skeleton-price" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="deals-grid">
            {products.map((product) => (
              <article key={product.id || product._id} className="deal-card">
                <div className="deal-image-wrap">
                  {product.image || product.imageUrl ? (
                    <img
                      src={product.image || product.imageUrl}
                      alt={product.name}
                      className="deal-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="deal-image-fallback">
                      <Package size={28} />
                    </div>
                  )}
                  <span className="deal-badge">Wholesale</span>
                </div>
                <div className="deal-body">
                  <p className="deal-category">
                    {product.category || product.categoryName || 'General'}
                  </p>
                  <h3 className="deal-name">{product.name}</h3>
                  <div className="deal-pricing">
                    <span className="deal-price">
                      ₹{Number(product.price || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="deal-unit">
                      MOQ: {product.minOrderQty || product.moq || 1}
                    </span>
                  </div>
                  <Link to="/register" className="deal-cta">
                    Register to Order <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Package size={40} className="empty-state-icon" aria-hidden="true" />
            <p className="empty-state-title">No products listed yet</p>
            <p className="empty-state-text">
              Wholesale deals will appear here once products are added through the admin panel.
            </p>
            <Link to="/register" className="empty-state-cta">
              Register to get started <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .wholesale-deals-section {
          padding: 5rem 2rem;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
        }

        .section-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0 0 0.75rem 0;
        }

        .section-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          margin: 0;
        }

        .empty-state {
          max-width: 480px;
          margin: 0 auto;
          text-align: center;
          padding: 3rem 1.5rem;
          border: 1px dashed #cbd5e1;
          border-radius: 16px;
          background: #ffffff;
        }

        .empty-state-icon {
          color: #94a3b8;
          margin-bottom: 1rem;
        }

        .empty-state-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }

        .empty-state-text {
          font-size: 0.9375rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 1.25rem 0;
        }

        .empty-state-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #2563eb;
          text-decoration: none;
        }

        .deals-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .deal-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .deal-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
          border-color: #2563eb;
        }

        .deal-image-wrap {
          position: relative;
          height: 160px;
          background: #f1f5f9;
          overflow: hidden;
        }

        .deal-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .deal-image-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
        }

        .deal-badge {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          padding: 0.25rem 0.625rem;
          background: rgba(37, 99, 235, 0.92);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 999px;
          letter-spacing: 0.02em;
        }

        .deal-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .deal-category {
          font-size: 0.75rem;
          font-weight: 600;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }

        .deal-name {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .deal-pricing {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }

        .deal-price {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0f172a;
        }

        .deal-unit {
          font-size: 0.8125rem;
          color: #64748b;
          white-space: nowrap;
        }

        .deal-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          margin-top: auto;
          padding: 0.75rem 1rem;
          background: #2563eb;
          color: #ffffff;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s ease;
        }

        .deal-cta:hover {
          background: #1d4ed8;
        }

        .skeleton-card {
          pointer-events: none;
        }

        .skeleton-block {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
        }

        .skeleton-image {
          height: 160px;
          border-radius: 0;
        }

        .skeleton-title {
          height: 16px;
          margin: 1.25rem 1.25rem 0.5rem;
          width: 40%;
        }

        .skeleton-text {
          height: 18px;
          margin: 0 1.25rem 0.75rem;
          width: 80%;
        }

        .skeleton-price {
          height: 36px;
          margin: 0 1.25rem 1.25rem;
          width: 100%;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 1024px) {
          .deals-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .wholesale-deals-section {
            padding: 3.5rem 1rem;
          }

          .section-title {
            font-size: 1.75rem;
          }

          .deals-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default WholesaleDeals;
