import React, { useState } from 'react';
import { FiGrid, FiList, FiFilter } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import ProductCard from '../../components/vendor/ProductCard';
import SearchBar from '../../components/vendor/SearchBar';
import FilterPanel from '../../components/vendor/FilterPanel';
import { vendorProducts, vendorCategories } from '../../data';

const Products = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState(vendorProducts);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = vendorCategories.map(cat => cat.name);
  const brands = [...new Set(vendorProducts.map(p => p.brand).filter(Boolean))];

  const handleSearch = (term) => {
    setSearchTerm(term);
    applyFilters({ searchTerm: term });
  };

  const handleFilterChange = (filters) => {
    applyFilters(filters);
  };

  const applyFilters = (filters) => {
    let result = [...vendorProducts];

    // Search filter
    if (filters.searchTerm || searchTerm) {
      const term = (filters.searchTerm || searchTerm).toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.brand && product.brand.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter(product =>
        filters.categories.includes(product.category)
      );
    }

    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
      result = result.filter(product =>
        filters.brands.includes(product.brand)
      );
    }

    // Price range filter
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      if (min) {
        result = result.filter(product => product.price >= parseFloat(min));
      }
      if (max) {
        result = result.filter(product => product.price <= parseFloat(max));
      }
    }

    // Availability filter
    if (filters.availability && filters.availability !== 'all') {
      if (filters.availability === 'in_stock') {
        result = result.filter(product => product.status === 'active' || product.status === 'low_stock');
      } else if (filters.availability === 'out_of_stock') {
        result = result.filter(product => product.status === 'out_of_stock');
      }
    }

    // Sort
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_low':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          result.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
          break;
        case 'popularity':
          result.sort((a, b) => b.sales - a.sales);
          break;
        default:
          break;
      }
    }

    setFilteredProducts(result);
  };

  const handleAddToCart = (product) => {
    console.log('Add to cart:', product);
  };

  const handleAddToWishlist = (product) => {
    console.log('Add to wishlist:', product);
  };

  const handleViewDetails = (product) => {
    console.log('View details:', product);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Browse Products"
        subtitle="Explore our wide range of wholesale products for your business needs."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiFilter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">Filter</span>
            </button>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search products by name, category, or brand..."
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Filter Panel */}
        {showFilters && (
          <div className="w-full lg:w-72 flex-shrink-0">
            <FilterPanel
              categories={vendorCategories}
              brands={brands}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}

        {/* Products Grid/List */}
        <div className={`flex-1 ${showFilters ? '' : 'w-full'}`}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {filteredProducts.length} of {vendorProducts.length} products
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
              <FiGrid className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-xs sm:text-sm text-gray-600">Try adjusting your filters or search terms</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">{product.category}</p>
                        {product.brand && (
                          <p className="text-xs text-gray-400">{product.brand}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' :
                        product.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? 'In Stock' :
                         product.status === 'low_stock' ? 'Low Stock' :
                         'Out of Stock'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-lg sm:text-xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                      {product.mrp && (
                        <span className="text-xs sm:text-sm text-gray-400 line-through">₹{product.mrp.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="text-xs text-gray-500">
                        MOQ: {product.minimumOrderQuantity} {product.unit} • Stock: {product.stock}
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.status === 'out_of_stock'}
                        className={`px-3 sm:px-4 py-2.5 h-10 sm:h-12 rounded-lg text-xs sm:text-sm font-medium ${
                          product.status === 'out_of_stock'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {product.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
