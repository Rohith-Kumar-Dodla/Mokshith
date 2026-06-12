import React, { useState } from 'react';
import { FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const getCategoryId = (category) => {
  if (typeof category === 'object') {
    return category.id || category._id || category.name;
  }
  return category;
};

const getCategoryName = (category) => {
  if (typeof category === 'object') {
    return category.name;
  }
  return category;
};

const FilterPanel = ({ categories, brands, onFilterChange, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  const handleCategoryToggle = (category) => {
    const categoryId = getCategoryId(category);
    const newCategoryIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    setSelectedCategoryIds(newCategoryIds);
    applyFilters({ categoryIds: newCategoryIds });
  };

  const handleBrandToggle = (brand) => {
    const newBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(newBrands);
    applyFilters({ brands: newBrands });
  };

  const handlePriceChange = (field, value) => {
    const newPriceRange = { ...priceRange, [field]: value };
    setPriceRange(newPriceRange);
    applyFilters({ priceRange: newPriceRange });
  };

  const handleAvailabilityChange = (value) => {
    setAvailability(value);
    applyFilters({ availability: value });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    applyFilters({ sortBy: value });
  };

  const applyFilters = (filters) => {
    if (onFilterChange) {
      onFilterChange({
        categoryIds: selectedCategoryIds,
        categories: [],
        brands: selectedBrands,
        priceRange,
        availability,
        sortBy,
        ...filters,
      });
    }
  };

  const clearFilters = () => {
    setSelectedCategoryIds([]);
    setSelectedBrands([]);
    setPriceRange({ min: '', max: '' });
    setAvailability('all');
    setSortBy('relevance');
    if (onFilterChange) {
      onFilterChange({
        categoryIds: [],
        categories: [],
        brands: [],
        priceRange: { min: '', max: '' },
        availability: 'all',
        sortBy: 'relevance',
      });
    }
  };

  const hasActiveFilters =
    selectedCategoryIds.length > 0 ||
    selectedBrands.length > 0 ||
    priceRange.min ||
    priceRange.max ||
    availability !== 'all' ||
    sortBy !== 'relevance';

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            {isExpanded ? (
              <FiChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            ) : (
              <FiChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>

          {categories && categories.length > 0 && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Categories</label>
              <div className="space-y-2 max-h-36 sm:max-h-40 overflow-y-auto">
                {categories.map((category) => {
                  const categoryId = getCategoryId(category);
                  return (
                    <label key={categoryId} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(categoryId)}
                        onChange={() => handleCategoryToggle(category)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-xs sm:text-sm text-gray-700">{getCategoryName(category)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {brands && brands.length > 0 && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Brands</label>
              <div className="space-y-2 max-h-36 sm:max-h-40 overflow-y-auto">
                {brands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-xs sm:text-sm text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Price Range (₹)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Availability</label>
            <select
              value={availability}
              onChange={(e) => handleAvailabilityChange(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              <option value="all">All</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
