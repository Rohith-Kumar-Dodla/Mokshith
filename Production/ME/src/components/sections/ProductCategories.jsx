import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wheat, Package, Droplets, LayoutGrid, Cookie, Coffee, ArrowRight } from 'lucide-react';
import categoryService from '../../services/categoryService';

const ICONS = [Wheat, Package, Droplets, LayoutGrid, Cookie, Coffee];
const COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#3b82f6'];
const GRADIENTS = [
  'from-amber-50 to-orange-50',
  'from-purple-50 to-violet-50',
  'from-cyan-50 to-teal-50',
  'from-pink-50 to-rose-50',
  'from-emerald-50 to-green-50',
  'from-blue-50 to-indigo-50',
];

const ProductCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    categoryService
      .getCategories()
      .then((response) => {
        const list = response?.data ?? response ?? [];
        if (mounted) setCategories(Array.isArray(list) ? list.slice(0, 6) : []);
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
          <div className="text-center py-8 text-gray-500 text-sm">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Sign in to explore our product categories.</p>
            <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 font-medium">
              Sign In <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category, index) => {
              const Icon = ICONS[index % ICONS.length];
              return (
                <Link
                  key={category._id || category.id}
                  to="/login"
                  className={`category-card bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]}`}
                >
                  <div className="category-icon" style={{ color: COLORS[index % COLORS.length] }}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-count">Wholesale category</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductCategories;
