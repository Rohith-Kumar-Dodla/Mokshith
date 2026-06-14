import React, { useEffect, useState } from 'react';
import { FiEye, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import StatusBadge from '../../components/admin/StatusBadge';
import SearchBar from '../../components/admin/SearchBar';
import FilterDropdown from '../../components/admin/FilterDropdown';
import Modal from '../../components/admin/Modal';
import ImageUpload from '../../components/common/ImageUpload';
import useProducts from '../../hooks/useProducts';
import useCategories from '../../hooks/useCategories';
import { getProductImageKey } from '../../utils/productMapper';

const EMPTY_FORM = {
  name: '',
  description: '',
  categoryId: '',
  price: '',
  stock: '',
  moq: '1',
  isActive: true,
};

const Products = () => {
  const {
    products,
    loading,
    saving,
    error,
    actionError,
    successMessage,
    createProduct,
    updateProduct,
    deleteProduct,
    clearMessages,
  } = useProducts();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [formError, setFormError] = useState(null);

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((cat) => ({ value: cat.name, label: cat.name })),
  ];

  const stockOptions = [
    { value: 'all', label: 'All Stock Levels' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStock =
      selectedStock === 'all' ||
      (selectedStock === 'in_stock' && product.stock > 50) ||
      (selectedStock === 'low_stock' && product.stock > 0 && product.stock <= 50) ||
      (selectedStock === 'out_of_stock' && product.stock === 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setFormError(null);
    setSelectedProduct(null);
    clearMessages();
  };

  const openCreateModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      categoryId: product.categoryId || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      moq: String(product.minimumOrderQuantity ?? 1),
      isActive: product.status !== 'inactive' && product.status !== 'out_of_stock',
    });
    setImageFile(null);
    setFormError(null);
    clearMessages();
    setIsAddModalOpen(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    try {
      await deleteProduct(product.id);
    } catch {
      // actionError surfaced via hook
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Please select a category');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setFormError('Price must be greater than 0');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      categoryId: formData.categoryId,
      price: Number(formData.price),
      stock: Number(formData.stock) || 0,
      moq: Number(formData.moq) || 1,
      isActive: formData.isActive,
    };

    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload, imageFile);
      } else {
        await createProduct(payload, imageFile);
      }
      handleCloseModal();
    } catch (submitError) {
      setFormError(submitError.message);
    }
  };

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => clearMessages(), 4000);
    return () => clearTimeout(timer);
  }, [successMessage, clearMessages]);

  if (loading || categoriesLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <p className="text-sm text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error || categoriesError) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Failed to load products</h3>
        <p className="text-xs sm:text-sm text-gray-600">{error || categoriesError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Product Management"
        subtitle="Manage products within your assigned area"
        buttonText="Add Product"
        onButtonClick={openCreateModal}
      />

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {actionError && !isAddModalOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

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
            <FilterDropdown label="Category" options={categoryOptions} selected={selectedCategory} onSelect={setSelectedCategory} />
            <FilterDropdown label="Stock" options={stockOptions} selected={selectedStock} onSelect={setSelectedStock} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Product</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Category</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Price</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Stock</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        key={getProductImageKey(product)}
                        src={product.imageUrl || product.image || 'https://via.placeholder.com/48'}
                        alt={product.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{product.category}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">₹{product.price.toFixed(2)}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{product.stock}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button type="button" onClick={() => handleViewProduct(product)} className="p-2 hover:bg-blue-100 rounded-lg" title="View">
                        <FiEye size={14} className="text-blue-600" />
                      </button>
                      <button type="button" onClick={() => handleEditProduct(product)} className="p-2 hover:bg-green-100 rounded-lg" title="Edit">
                        <FiEdit size={14} className="text-green-600" />
                      </button>
                      <button type="button" onClick={() => handleDeleteProduct(product)} className="p-2 hover:bg-red-100 rounded-lg" title="Delete">
                        <FiTrash2 size={14} className="text-red-600" />
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

      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title={selectedProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {(formError || actionError) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError || actionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Description</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Price (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Minimum Order Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.moq}
                onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <ImageUpload
                key={selectedProduct?.id || 'new-product'}
                label="Product Image"
                value={imageFile}
                previewUrl={selectedProduct?.storedImage || ''}
                onChange={setImageFile}
                onClear={() => setImageFile(null)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={handleCloseModal} className="px-4 sm:px-6 py-2.5 h-12 border border-gray-200 rounded-lg hover:bg-gray-50" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={saving}>
              {saving ? 'Saving...' : selectedProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Product Details" size="lg">
        {selectedProduct && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <img
                src={selectedProduct.imageUrl || selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full sm:w-48 h-48 rounded-lg object-cover"
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
                <p className="text-xs sm:text-sm text-gray-600">Category</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">{selectedProduct.category}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Price</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">₹{selectedProduct.price.toFixed(2)}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Stock</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">{selectedProduct.stock}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">MOQ</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900">{selectedProduct.minimumOrderQuantity}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;
