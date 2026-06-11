import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { routes } from '../../../routes/routeConfig.js';

const WholesaleDeals = () => {
  const products = [
    {
      id: 1,
      name: "Sona Masoori Rice",
      price: "₹1,150",
      unit: "25kg Bag",
      minQty: 10,
      category: "Rice & Grains",
      emoji: "🍚",
      badge: "Best Seller"
    },
    {
      id: 2,
      name: "Toor Dal Premium",
      price: "₹145",
      unit: "1kg Pouch",
      minQty: 50,
      category: "Pulses & Dals",
      emoji: "🫘",
      badge: "Popular"
    },
    {
      id: 3,
      name: "Sunflower Oil",
      price: "₹1,770",
      unit: "15L Tin",
      minQty: 5,
      category: "Edible Oils",
      emoji: "🧴",
      badge: "Bulk Deal"
    },
    {
      id: 4,
      name: "Refined Sugar",
      price: "₹2,100",
      unit: "50kg Bag",
      minQty: 5,
      category: "Sugar & Salt",
      emoji: "🧂",
      badge: "New"
    }
  ];

  return (
    <section className="wholesale-deals-section">
      <div className="deals-container">
        <div className="section-header">
          <h2 className="section-title">Top Wholesale Deals</h2>
          <p className="section-subtitle">Direct from vendors with competitive bulk pricing</p>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`${routes.PRODUCTS}/${product.id}`}
              className="product-card"
            >
              <div className="product-badge">{product.badge}</div>
              <div className="product-image">
                <span className="product-emoji">{product.emoji}</span>
              </div>
              <div className="product-info">
                <div className="product-category">{product.category}</div>
                <h3 className="product-name">{product.name}</h3>
                <div className="product-meta">
                  <span className="product-price">{product.price}</span>
                  <span className="product-unit">/{product.unit}</span>
                </div>
                <div className="product-min-qty">Min. Order: {product.minQty} units</div>
              </div>
              <button className="add-button">
                <Plus size={16} />
                <span>Add to Order</span>
              </button>
            </Link>
          ))}
        </div>

        <div className="view-all-container">
          <Link to={routes.PRODUCTS} className="view-all-button">
            View All Products
          </Link>
        </div>
      </div>

      <style>{`
        .wholesale-deals-section {
          padding: 6rem 2rem;
          background: white;
        }

        .deals-container {
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

        .products-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .product-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          text-decoration: none;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          overflow: hidden;
        }

        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: #2563eb;
        }

        .product-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .product-image {
          width: 100%;
          height: 120px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .product-category {
          font-size: 0.8125rem;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .product-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .product-meta {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .product-price {
          font-size: 1.5rem;
          font-weight: 800;
          color: #2563eb;
        }

        .product-unit {
          font-size: 0.875rem;
          color: #64748b;
        }

        .product-min-qty {
          font-size: 0.8125rem;
          color: #64748b;
          font-weight: 500;
        }

        .add-button {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          color: #0f172a;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .product-card:hover .add-button {
          background: #2563eb;
          border-color: #2563eb;
          color: white;
        }

        .view-all-container {
          text-align: center;
        }

        .view-all-button {
          display: inline-block;
          padding: 1rem 2.5rem;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          font-weight: 700;
          font-size: 1rem;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
        }

        .view-all-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(37, 99, 235, 0.4);
        }

        @media (max-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .section-title {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .wholesale-deals-section {
            padding: 4rem 1rem;
          }

          .products-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .section-title {
            font-size: 1.75rem;
          }

          .section-subtitle {
            font-size: 1rem;
          }

          .product-card {
            padding: 1.25rem;
          }

          .product-image {
            height: 100px;
            font-size: 2.5rem;
          }

          .product-name {
            font-size: 1rem;
          }

          .product-price {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </section>
  );
};

export default WholesaleDeals;
