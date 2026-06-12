import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import searchService from '../../services/searchService';

const WholesaleDeals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    searchService
      .searchProducts('')
      .then((response) => {
        const list = response?.data ?? response?.products ?? response ?? [];
        if (mounted) setProducts(Array.isArray(list) ? list.slice(0, 4) : []);
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
          <div className="text-center py-8 text-gray-500 text-sm">Loading deals...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Register to access wholesale pricing and bulk deals.</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm">
              Get Started <Plus size={16} />
            </Link>
          </div>
        ) : (
          <div className="deals-grid">
            {products.map((product) => (
              <div key={product._id || product.id} className="deal-card">
                <div className="deal-header">
                  <span className="deal-badge">Wholesale</span>
                </div>
                <h3 className="deal-name">{product.name}</h3>
                <p className="deal-category">{product.category?.name || product.categoryName || 'General'}</p>
                <div className="deal-pricing">
                  <span className="deal-price">₹{Number(product.price || product.basePrice || 0).toLocaleString('en-IN')}</span>
                  <span className="deal-unit">MOQ: {product.minOrderQty || product.moq || 1}</span>
                </div>
                <Link to="/register" className="deal-cta">
                  Register to Order
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default WholesaleDeals;
