import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiList, FiFilter, FiShoppingCart } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import ProductCard from '../../components/vendor/ProductCard';
import SearchBar from '../../components/vendor/SearchBar';
import FilterPanel from '../../components/vendor/FilterPanel';
import BulkAddToCartModal from '../../components/vendor/BulkAddToCartModal';
import useProducts from '../../hooks/useProducts';
import useCategories from '../../hooks/useCategories';
import useCart from '../../hooks/useCart';
import useWishlist from '../../hooks/useWishlist';
import {
  clampCartQuantity,
  getCartAddErrorMessage,
  getDefaultCartQuantity,
  getProductId,
  isProductSelectable,
} from '../../utils/bulkAddToCartUtils';

const Products = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedById, setSelectedById] = useState({});
  const [quantities, setQuantities] = useState({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [failedAdds, setFailedAdds] = useState([]);
  const bulkAddingRef = useRef(false);
  const { addToCart, actionLoading } = useCart({ autoLoad: false });
  const { addToWishlist, actionLoading: wishlistLoading } = useWishlist({ autoLoad: false });
  const {
    products,
    filteredProducts,
    loading,
    error,
    categoryIdFromUrl,
    brands,
    handleSearch,
    handleFilterChange,
  } = useProducts();
  const { categories } = useCategories();

  const selectedProducts = useMemo(() => Object.values(selectedById), [selectedById]);
  const selectedCount = selectedProducts.length;
  const visibleSelectableProducts = useMemo(
    () => filteredProducts.filter(isProductSelectable),
    [filteredProducts]
  );
  const allVisibleSelected =
    visibleSelectableProducts.length > 0 &&
    visibleSelectableProducts.every((product) => selectedById[getProductId(product)]);

  const showToast = (type, message, extra = null) => {
    setToast({ type, message, extra });
    window.setTimeout(() => setToast(null), 6000);
  };

  const toggleSelect = (product) => {
    const productId = getProductId(product);
    if (!productId || !isProductSelectable(product)) return;

    setSelectedById((prev) => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = product;
      }
      return next;
    });
    setQuantities((prev) => {
      if (prev[productId]) return prev;
      return { ...prev, [productId]: getDefaultCartQuantity(product) };
    });
  };

  const handleSelectAllVisible = () => {
    setSelectedById((prev) => {
      const next = { ...prev };
      visibleSelectableProducts.forEach((product) => {
        next[getProductId(product)] = product;
      });
      return next;
    });
    setQuantities((prev) => {
      const next = { ...prev };
      visibleSelectableProducts.forEach((product) => {
        const productId = getProductId(product);
        if (next[productId] == null) {
          next[productId] = getDefaultCartQuantity(product);
        }
      });
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedById({});
    setFailedAdds([]);
  };

  const handleQuantityChange = (product, delta) => {
    const productId = getProductId(product);
    setQuantities((prev) => ({
      ...prev,
      [productId]: clampCartQuantity(
        product,
        (prev[productId] ?? getDefaultCartQuantity(product)) + delta
      ),
    }));
  };

  const handleAddToWishlist = async (product) => {
    const productId = getProductId(product);

    try {
      await addToWishlist(productId);
      showToast('success', `${product.name} added to wishlist`);
    } catch (wishlistError) {
      showToast('error', getCartAddErrorMessage(wishlistError));
    }
  };

  const handleSingleAddToCart = async (product) => {
    const productId = getProductId(product);
    const quantity = clampCartQuantity(
      product,
      product.selectedQuantity ?? getDefaultCartQuantity(product)
    );

    try {
      await addToCart(productId, quantity);
      showToast('success', `${product.name} added to cart`);
    } catch (addError) {
      showToast('error', getCartAddErrorMessage(addError));
    }
  };

  const openSummary = () => {
    if (selectedCount === 0 || bulkAdding) return;
    setFailedAdds([]);
    setQuantities((prev) => {
      const next = { ...prev };
      selectedProducts.forEach((product) => {
        const productId = getProductId(product);
        next[productId] = clampCartQuantity(product, next[productId] ?? getDefaultCartQuantity(product));
      });
      return next;
    });
    setSummaryOpen(true);
  };

  const closeSummary = useCallback(() => {
    if (bulkAdding) return;
    setSummaryOpen(false);
  }, [bulkAdding]);

  const handleBulkAddToCart = async () => {
    if (selectedProducts.length === 0 || bulkAddingRef.current) return;

    bulkAddingRef.current = true;
    setBulkAdding(true);
    setProgressLabel(`Adding ${selectedProducts.length} products...`);
    const successes = [];
    const failures = [];

    try {
      for (const product of selectedProducts) {
        const productId = getProductId(product);
        const quantity = clampCartQuantity(product, quantities[productId] ?? getDefaultCartQuantity(product));

        if (!isProductSelectable(product)) {
          failures.push({
            productId,
            name: product.name,
            reason: 'This product is not available.',
          });
          continue;
        }

        try {
          const result = await addToCart(productId, quantity);
          if (result === undefined) {
            failures.push({
              productId,
              name: product.name,
              reason: 'Please wait for the current request to finish.',
            });
            continue;
          }
          successes.push(productId);
        } catch (addError) {
          failures.push({
            productId,
            name: product.name,
            reason: getCartAddErrorMessage(addError),
          });
        }
      }

      if (successes.length > 0 && failures.length === 0) {
        showToast(
          'success',
          `${successes.length} product${successes.length === 1 ? '' : 's'} added to your cart.`,
          'viewCart'
        );
        setSelectedById({});
        setFailedAdds([]);
        setSummaryOpen(false);
      } else if (successes.length > 0) {
        showToast(
          'error',
          `${successes.length} product${successes.length === 1 ? '' : 's'} added successfully. ${failures.length} product${failures.length === 1 ? '' : 's'} could not be added.`
        );
        setFailedAdds(failures);
        setSelectedById((prev) => {
          const next = { ...prev };
          successes.forEach((id) => {
            delete next[id];
          });
          return next;
        });
        setSummaryOpen(false);
      } else {
        showToast('error', 'No products could be added to your cart.');
        setFailedAdds(failures);
      }
    } finally {
      bulkAddingRef.current = false;
      setBulkAdding(false);
      setProgressLabel('');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <p className="text-sm text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Failed to load products</h3>
        <p className="text-xs sm:text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border p-3 sm:p-4 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <p className="text-xs sm:text-sm">{toast.message}</p>
          {toast.extra === 'viewCart' && (
            <Link to="/vendor/cart" className="inline-block mt-2 text-xs sm:text-sm font-medium text-blue-700 hover:text-blue-800">
              View Cart
            </Link>
          )}
        </div>
      )}

      {failedAdds.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4" role="alert">
          <p className="text-sm font-medium text-red-800 mb-2">Some products could not be added</p>
          <ul className="space-y-1">
            {failedAdds.map((failure) => (
              <li key={failure.productId} className="text-xs sm:text-sm text-red-700">
                <span className="font-medium">{failure.name}</span>
                <span> — Could not be added: {failure.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <PageHeader
        title="Browse Products"
        subtitle={
          categoryIdFromUrl
            ? 'Showing products for the selected category.'
            : 'Explore our wide range of wholesale products for your business needs.'
        }
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

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search products by name, category, or brand..."
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {showFilters && (
          <div className="w-full lg:w-72 flex-shrink-0">
            <FilterPanel
              categories={categories}
              brands={brands}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}

        <div className={`flex-1 ${showFilters ? '' : 'w-full'}`}>
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
              {selectedCount > 0 ? ` · Selected: ${selectedCount}` : ''}
            </p>
            <div className="flex items-center gap-3">
              {visibleSelectableProducts.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {allVisibleSelected ? 'All visible selected' : 'Select All'}
                </button>
              )}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Selection
                </button>
              )}
            </div>
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
                  selectable
                  selected={Boolean(selectedById[getProductId(product)])}
                  onToggleSelect={toggleSelect}
                  hideStock
                  onAddToCart={handleSingleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredProducts.map((product) => {
                const productId = getProductId(product);
                const selected = Boolean(selectedById[productId]);
                return (
                  <div
                    key={productId}
                    className={`bg-white rounded-lg border p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 ${
                      selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
                    }`}
                  >
                    <label className="flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!isProductSelectable(product)}
                        onChange={() => toggleSelect(product)}
                        aria-label={`Select ${product.name}`}
                        className="w-4 h-4 mt-1 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </label>
                    <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={product.imageUrl || product.image}
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs text-gray-500">
                          MOQ: {product.minimumOrderQuantity} {product.unit}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSingleAddToCart(product)}
                          disabled={product.status === 'out_of_stock'}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 h-10 sm:h-12 rounded-lg text-xs sm:text-sm font-medium ${
                            product.status === 'out_of_stock'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <FiShoppingCart className="w-4 h-4" />
                          {product.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg sm:static sm:border sm:rounded-lg sm:shadow-sm sm:mt-2 sm:bg-white">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-800">
              {selectedCount} product{selectedCount === 1 ? '' : 's'} selected
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleClearSelection}
                disabled={bulkAdding}
                className="inline-flex items-center justify-center px-4 py-2.5 h-11 sm:h-12 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 min-h-[44px]"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={openSummary}
                disabled={bulkAdding || actionLoading || wishlistLoading}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 h-11 sm:h-12 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                <FiShoppingCart className="w-4 h-4" />
                Add Selected to Cart ({selectedCount})
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkAddToCartModal
        isOpen={summaryOpen}
        products={selectedProducts}
        quantities={quantities}
        onQuantityChange={handleQuantityChange}
        onClose={closeSummary}
        onConfirm={handleBulkAddToCart}
        busy={bulkAdding}
        progressLabel={progressLabel}
      />
    </div>
  );
};

export default Products;
