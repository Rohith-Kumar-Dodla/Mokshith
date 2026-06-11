import React from 'react';
import { Link } from 'react-router-dom';
import { Wheat, Package, Droplets, LayoutGrid, Cookie, Coffee, ArrowRight } from 'lucide-react';

const routes = {
  LANDING: '/',
  DASHBOARD: '/dashboard',
  REGISTER: '/register',
  LOGIN: '/login',
  PRODUCTS: '/products',
  PRICING: '/pricing',
  SOLUTIONS: '/solutions',
  CONTACT: '/contact',
  ABOUT: '/about'
};

const ProductCategories = () => {
  const categories = [
    {
      name: "Rice & Grains",
      icon: <Wheat className="w-8 h-8" />,
      slug: "rice-grains",
      count: 150,
      color: "#f59e0b",
      bgGradient: "from-amber-50 to-orange-50"
    },
    {
      name: "Pulses & Dals",
      icon: <Package className="w-8 h-8" />,
      slug: "pulses-dals",
      count: 120,
      color: "#8b5cf6",
      bgGradient: "from-purple-50 to-violet-50"
    },
    {
      name: "Edible Oils",
      icon: <Droplets className="w-8 h-8" />,
      slug: "edible-oils",
      count: 85,
      color: "#06b6d4",
      bgGradient: "from-cyan-50 to-teal-50"
    },
    {
      name: "FMCG",
      icon: <LayoutGrid className="w-8 h-8" />,
      slug: "fmcg",
      count: 200,
      color: "#ec4899",
      bgGradient: "from-pink-50 to-rose-50"
    },
    {
      name: "Sugar & Salt",
      icon: <Cookie className="w-8 h-8" />,
      slug: "sugar-salt",
      count: 65,
      color: "#10b981",
      bgGradient: "from-emerald-50 to-green-50"
    },
    {
      name: "Beverages",
      icon: <Coffee className="w-8 h-8" />,
      slug: "beverages",
      count: 95,
      color: "#f97316",
      bgGradient: "from-orange-50 to-amber-50"
    }
  ];

  return (
    <section className="product-categories-section">
      <div className="categories-container">
        <div className="section-header">
          <h2 className="section-title">Browse by Category</h2>
          <p className="section-subtitle">Explore our wide range of product categories</p>
        </div>

        <div className="categories-grid">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`${routes.PRODUCTS}/${category.slug}`}
              className="category-card"
            >
              <div className={`category-icon-wrapper bg-gradient-to-br ${category.bgGradient}`}>
                <div className="category-icon" style={{ color: category.color }}>
                  {category.icon}
                </div>
              </div>
              <div className="category-content">
                <h3 className="category-name">{category.name}</h3>
                <p className="category-count">{category.count}+ Products</p>
              </div>
              <div className="category-cta">
                <span>Explore</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .product-categories-section {
          padding: 6rem 2rem;
          background: #f8fafc;
        }

        .categories-container {
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

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .category-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 2rem;
          text-decoration: none;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .category-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .category-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: #2563eb;
        }

        .category-card:hover::before {
          opacity: 1;
        }

        .category-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .category-card:hover .category-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }

        .category-icon {
          transition: all 0.3s ease;
        }

        .category-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .category-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .category-count {
          font-size: 0.9375rem;
          color: #64748b;
          margin: 0;
        }

        .category-cta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #2563eb;
          margin-top: auto;
          transition: all 0.3s ease;
        }

        .category-card:hover .category-cta {
          transform: translateX(4px);
        }

        @media (max-width: 1024px) {
          .categories-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .section-title {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .product-categories-section {
            padding: 4rem 1rem;
          }

          .categories-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .section-title {
            font-size: 1.75rem;
          }

          .section-subtitle {
            font-size: 1rem;
          }

          .category-card {
            padding: 1.5rem;
          }

          .category-icon-wrapper {
            width: 64px;
            height: 64px;
          }

          .category-name {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </section>
  );
};

export default ProductCategories;
