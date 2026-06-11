import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/vendor/PageHeader';
import { vendorCategories } from '../../data';

const Categories = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Browse products by category to find exactly what you need."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {vendorCategories.map((category) => (
          <Link
            key={category.id}
            to="/vendor/products"
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
          >
            <div className="aspect-video bg-gray-100 overflow-hidden">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{category.name}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">{category.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  {category.productCount} products
                </span>
                <span className="text-xs sm:text-sm font-medium text-blue-600 group-hover:text-blue-700">
                  View Products →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;
