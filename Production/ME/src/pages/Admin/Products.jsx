import React, { useState } from 'react';
import { FiEye, FiEdit, FiTrash2, FiCopy, FiPower, FiSearch, FiFilter, FiDownload } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import StatusBadge from '../../components/admin/StatusBadge';
import SearchBar from '../../components/admin/SearchBar';
import FilterDropdown from '../../components/admin/FilterDropdown';
import Modal from '../../components/admin/Modal';
import { products } from '../../data/products';
import { categories } from '../../data/categories';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  const stockOptions = [
    { value: 'all', label: 'All Stock Levels' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStock = selectedStock === 'all' ||
                        (selectedStock === 'in_stock' && product.stock > 50) ||
                        (selectedStock === 'low_stock' && product.stock > 0 && product.stock <= 50) ||
                        (selectedStock === 'out_of_stock' && product.stock === 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsAddModalOpen(true);
  };

  const handleDeleteProduct = (productId) => {
    console.log('Delete product:', productId);
  };

  const handleDuplicateProduct = (product) => {
    console.log('Duplicate product:', product);
  };

  const handleToggleStatus = (product) => {
    console.log('Toggle status:', product);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Product Management"
        subtitle="Manage products within your assigned area"
        buttonText="Add Product"
        onButtonClick={() => setIsAddModalOpen(true)}
      />

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search products by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <FilterDropdown
              label="Category"
              options={categoryOptions}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
            <FilterDropdown
              label="Stock"
              options={stockOptions}
              selected={selectedStock}
              onSelect={setSelectedStock}
            />
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Product</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Category</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Price</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Stock</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Area</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Created</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{product.category}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">₹{product.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">MRP: ₹{product.mrp.toFixed(2)}</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{product.stock}</p>
                      <p className="text-xs text-gray-500">Min: {product.minimumOrderQuantity}</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{product.area}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{product.createdDate}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                        title="View"
                      >
                        <FiEye size={14} sm:size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                        title="Edit"
                      >
                        <FiEdit size={14} sm:size={16} className="text-green-600" />
                      </button>
                      <button
                        onClick={() => handleDuplicateProduct(product)}
                        className="p-2 hover:bg-purple-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                        title="Duplicate"
                      >
                        <FiCopy size={14} sm:size={16} className="text-purple-600" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className="p-2 hover:bg-orange-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                        title="Toggle Status"
                      >
                        <FiPower size={14} sm:size={16} className="text-orange-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                        title="Delete"
                      >
                        <FiTrash2 size={14} sm:size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500">No products found</p>
          </div>
        )}
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={selectedProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Product Name</label>
              <input
                type="text"
                defaultValue={selectedProduct?.name || ''}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category</label>
              <select className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Description</label>
              <textarea
                rows="3"
                defaultValue={selectedProduct?.description || ''}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Price (₹)</label>
              <input
                type="number"
                defaultValue={selectedProduct?.price || ''}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter selling price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">MRP (₹)</label>
              <input
                type="number"
                defaultValue={selectedProduct?.mrp || ''}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter MRP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Wholesale Price (₹)</label>
              <input
                type="number"
                defaultValue={selectedProduct?.wholesalePrice || ''}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter wholesale price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Stock Quantity</label>
              <input
                type="number"
                defaultValue={selectedProduct?.stock || ''}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter stock quantity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Minimum Order Quantity</label>
              <input
                type="number"
                defaultValue={selectedProduct?.minimumOrderQuantity || ''}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter MOQ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
              <select className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 sm:px-6 py-2.5 h-12 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* View Product Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Product Details"
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full sm:w-48 h-48 sm:h-48 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-sm sm:text-base text-gray-600 mt-2">{selectedProduct.description}</p>
                <div className="mt-4">
                  <StatusBadge status={selectedProduct.status} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Product ID</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">{selectedProduct.id}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Category</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">{selectedProduct.category}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Price</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">₹{selectedProduct.price.toFixed(2)}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">MRP</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">₹{selectedProduct.mrp.toFixed(2)}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Wholesale Price</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">₹{selectedProduct.wholesalePrice.toFixed(2)}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Stock</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">{selectedProduct.stock}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Min Order Qty</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">{selectedProduct.minimumOrderQuantity}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Area</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">{selectedProduct.area}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-600">Total Sales</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">{selectedProduct.sales}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                <p className="text-xs sm:text-sm text-green-600">Rating</p>
                <p className="text-lg sm:text-2xl font-bold text-green-900">{selectedProduct.rating}/5</p>
              </div>
              <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                <p className="text-xs sm:text-sm text-purple-600">Created Date</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-900">{selectedProduct.createdDate}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;
