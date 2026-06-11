import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiArrowLeft, FiStar, FiCheck, FiTruck } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import BulkPricingTable from '../../components/vendor/BulkPricingTable';
import ProductCard from '../../components/vendor/ProductCard';
import { vendorProducts } from '../../data';

const ProductDetails = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(25);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedTab, setSelectedTab] = useState('description');

  const product = vendorProducts.find(p => p.id === id);

  if (!product) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h2>
        <Link to="/vendor/products" className="text-blue-600 hover:text-blue-700">
          Back to Products
        </Link>
      </div>
    );
  }

  const relatedProducts = vendorProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    console.log('Add to cart:', product, quantity);
  };

  const handleAddToWishlist = () => {
    console.log('Add to wishlist:', product);
  };

  const calculateDiscount = () => {
    if (product.mrp && product.price) {
      return Math.round(((product.mrp - product.price) / product.mrp) * 100);
    }
    return 0;
  };

  const calculateBulkPrice = (qty) => {
    const tier = product.bulkPricing?.find(t => qty >= t.minQty && (!t.maxQty || qty <= t.maxQty));
    return tier ? tier.price : product.price;
  };

  const currentBulkPrice = calculateBulkPrice(quantity);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
        <Link to="/vendor/products" className="hover:text-blue-600">Products</Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      {/* Back Button */}
      <Link
        to="/vendor/products"
        className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      {/* Product Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 sm:mb-4">
              <img
                src={product.images?.[selectedImage] || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium rounded-full">
                {product.category}
              </span>
              {product.brand && (
                <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-full">
                  {product.brand}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs sm:text-sm text-gray-600">{product.rating} ({product.reviews} reviews)</span>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-baseline gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{currentBulkPrice.toFixed(2)}</span>
                {product.mrp && (
                  <>
                    <span className="text-base sm:text-xl text-gray-400 line-through">₹{product.mrp.toFixed(2)}</span>
                    {calculateDiscount() > 0 && (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 text-xs sm:text-sm font-semibold rounded-full">
                        {calculateDiscount()}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                <span>MRP: ₹{product.mrp?.toFixed(2) || 'N/A'}</span>
                <span>•</span>
                <span>Wholesale: ₹{product.wholesalePrice?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                product.status === 'active' ? 'bg-green-500' :
                product.status === 'low_stock' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {product.status === 'active' ? 'In Stock' :
                 product.status === 'low_stock' ? 'Low Stock' :
                 'Out of Stock'}
              </span>
              <span className="text-xs sm:text-sm text-gray-500">({product.stock} available)</span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">{product.description}</p>

            {/* Quantity Selector */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity ({product.unit})
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setQuantity(Math.max(product.minimumOrderQuantity, quantity - 1))}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.minimumOrderQuantity, parseInt(e.target.value) || 0))}
                  min={product.minimumOrderQuantity}
                  max={product.stock}
                  className="w-20 sm:w-24 h-10 sm:h-12 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
                <span className="text-xs sm:text-sm text-gray-500">
                  MOQ: {product.minimumOrderQuantity}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-700">Total:</span>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">₹{(currentBulkPrice * quantity).toFixed(2)}</span>
              </div>
              {quantity > 50 && (
                <p className="text-xs sm:text-sm text-green-600 mt-1">
                  <FiCheck className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  Bulk pricing applied
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.status === 'out_of_stock'}
                className={`flex-1 py-2.5 h-10 sm:h-12 px-4 sm:px-6 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors ${
                  product.status === 'out_of_stock'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <FiShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {product.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleAddToWishlist}
                className="py-2.5 h-10 sm:h-12 px-4 sm:px-6 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <FiHeart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Wishlist</span>
                <span className="sm:hidden">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 sm:gap-6 px-4 sm:px-6 overflow-x-auto">
            {['description', 'specifications', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-3 sm:py-4 px-2 sm:px-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {selectedTab === 'description' && (
            <div className="prose max-w-none">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Product Description</h3>
              <p className="text-xs sm:text-sm text-gray-600">{product.description}</p>
              <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <span className="text-xs sm:text-sm text-gray-500">Category:</span>
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-900">{product.category}</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-500">Brand:</span>
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-900">{product.brand || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-500">Unit:</span>
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-900">{product.unit}</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-500">MOQ:</span>
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-900">{product.minimumOrderQuantity} {product.unit}</span>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'specifications' && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-500">Category</span>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{product.category}</p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-500">Brand</span>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{product.brand || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-500">Unit</span>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{product.unit}</p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-500">Minimum Order Quantity</span>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{product.minimumOrderQuantity} {product.unit}</p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-500">Available Stock</span>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{product.stock} {product.unit}</p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-500">Area</span>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{product.area}</p>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'reviews' && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Customer Reviews</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                        RK
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900">Rajesh Kumar</span>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Excellent quality product. Great for bulk orders. Will definitely order again.</p>
                  <p className="text-xs text-gray-400 mt-1 sm:mt-2">2 days ago</p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                        PS
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900">Priya Sharma</span>
                    </div>
                    <div className="flex items-center">
                      {[...Array(4)].map((_, i) => (
                        <FiStar key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                      ))}
                      <FiStar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Good quality and competitive pricing. Delivery was on time.</p>
                  <p className="text-xs text-gray-400 mt-1 sm:mt-2">1 week ago</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Pricing */}
      <BulkPricingTable bulkPricing={product.bulkPricing} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
