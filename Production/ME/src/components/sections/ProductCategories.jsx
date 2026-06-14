import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import categoryService from '../../services/categoryService';
import { unwrapApiData, unwrapApiList } from '../../utils/apiResponse';
import { mapBackendCategories } from '../../utils/categoryMapper';

const ProductCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    categoryService
      .getCategories()
      .then((response) => {
        const list = unwrapApiList(unwrapApiData(response));
        const mapped = mapBackendCategories(list).filter((item) => item.status !== 'inactive');
        if (mounted) setCategories(mapped.slice(0, 8));
      })
      .catch(() => {
        if (mounted) setCategories([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="product-categories-section">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">Product Categories</h2>
          <p className="section-subtitle">Browse wholesale categories for your business</p>
        </div>

        {loading ? (
          <div className="categories-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="category-card skeleton-card" aria-hidden="true">
                <div className="skeleton-block skeleton-image" />
                <div className="skeleton-block skeleton-title" />
                <div className="skeleton-block skeleton-text" />
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="categories-grid">
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/register"
                className="category-card"
              >
                <div className="category-image-wrap">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="category-image" loading="lazy" />
                  ) : (
                    <div className="category-image-fallback">
                      <LayoutGrid size={28} />
                    </div>
                  )}
                </div>
                <div className="category-body">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-description">
                    {category.description || 'Wholesale category for B2B buyers'}
                  </p>
                  <span className="category-link">
                    Explore category <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <LayoutGrid size={40} className="empty-state-icon" aria-hidden="true" />
            <p className="empty-state-title">No categories available yet</p>
            <p className="empty-state-text">
              Categories will appear here once they are added through the admin panel.
            </p>
            <Link to="/register" className="empty-state-cta">
              Register your business <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .product-categories-section {
          padding: 5rem 2rem;
          background: #ffffff;
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
          background: #f8fafc;
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

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .category-card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          min-height: 100%;
        }

        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
          border-color: #2563eb;
        }

        .category-image-wrap {
          height: 140px;
          background: #f1f5f9;
          overflow: hidden;
        }

        .category-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .category-image-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
        }

        .category-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .category-name {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .category-description {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .category-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: auto;
          padding-top: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #2563eb;
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
          height: 140px;
          border-radius: 0;
        }

        .skeleton-title {
          height: 18px;
          margin: 1.25rem 1.25rem 0.5rem;
          width: 70%;
        }

        .skeleton-text {
          height: 14px;
          margin: 0 1.25rem 1.25rem;
          width: 90%;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 1024px) {
          .categories-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .product-categories-section {
            padding: 3.5rem 1rem;
          }

          .section-title {
            font-size: 1.75rem;
          }

          .categories-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default ProductCategories;
