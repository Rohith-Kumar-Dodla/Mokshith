import React, { useEffect, useState } from 'react';
import { FiEdit, FiTrash2, FiEye, FiPackage, FiTrendingUp } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import TableResponsive from '../../components/common/TableResponsive';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/admin/Modal';
import ImageUpload from '../../components/common/ImageUpload';
import useCategories from '../../hooks/useCategories';
import { getImageVersion } from '../../utils/imageUtils';

const EMPTY_FORM = {
  name: '',
  description: '',
  isActive: true,
};

const Categories = () => {
  const {
    categories,
    loading,
    refreshing,
    saving,
    error,
    actionError,
    successMessage,
    createCategory,
    updateCategory,
    deleteCategory,
    clearMessages,
    refetch,
  } = useCategories();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [formError, setFormError] = useState(null);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setFormError(null);
    setSelectedCategory(null);
    clearMessages();
  };

  const openCreateModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setIsViewModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      isActive: category.status !== 'inactive',
    });
    setImageFile(null);
    setFormError(null);
    clearMessages();
    setIsAddModalOpen(true);
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    try {
      await deleteCategory(category.id);
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
      setFormError('Category name is required');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      isActive: formData.isActive,
    };

    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, payload, imageFile);
      } else {
        await createCategory(payload, imageFile);
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

  if (loading && categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <p className="text-sm text-gray-600">Loading categories...</p>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Failed to load categories</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-4">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Product Categories"
        subtitle="Manage product categories within your assigned area"
        buttonText="Add Category"
        onButtonClick={openCreateModal}
      />

      {refreshing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Refreshing categories...
        </div>
      )}

      {error && categories.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer p-3 sm:p-4" onClick={() => handleViewCategory(category)}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <img
                key={`${category.id}-${getImageVersion(category) || 'default'}`}
                src={category.image}
                alt={category.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
              />
              <StatusBadge status={category.status} />
            </div>
            <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{category.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{category.description}</p>
            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FiPackage size={14} className="text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-600">{category.productCount} Products</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FiTrendingUp size={14} className="text-green-600" />
                <span className="text-xs sm:text-sm text-gray-600">₹{((category.totalSales ?? 0) / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-gray-500">No categories yet. Create your first category.</p>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <TableResponsive>
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Category Name</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Products</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img src={category.image} alt={category.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{category.productCount}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <StatusBadge status={category.status} />
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button type="button" onClick={() => handleViewCategory(category)} className="p-2 hover:bg-blue-100 rounded-lg" title="View">
                        <FiEye size={14} className="text-blue-600" />
                      </button>
                      <button type="button" onClick={() => handleEditCategory(category)} className="p-2 hover:bg-green-100 rounded-lg" title="Edit">
                        <FiEdit size={14} className="text-green-600" />
                      </button>
                      <button type="button" onClick={() => handleDeleteCategory(category)} className="p-2 hover:bg-red-100 rounded-lg" title="Delete">
                        <FiTrash2 size={14} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableResponsive>
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title={selectedCategory ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {(formError || actionError) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError || actionError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category description"
            />
          </div>

          <ImageUpload
            key={selectedCategory?.id || 'new-category'}
            label="Category Image"
            value={imageFile}
            previewUrl={selectedCategory?.storedImage || ''}
            onChange={setImageFile}
            onClear={() => setImageFile(null)}
            disabled={saving}
          />

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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={handleCloseModal} className="px-4 sm:px-6 py-2.5 h-12 border border-gray-200 rounded-lg hover:bg-gray-50" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={saving}>
              {saving ? 'Saving...' : selectedCategory ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Category Details" size="md">
        {selectedCategory && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <img src={selectedCategory.image} alt={selectedCategory.name} className="w-full sm:w-32 h-32 rounded-lg object-cover" />
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedCategory.name}</h3>
                <p className="text-sm sm:text-base text-gray-600 mt-2">{selectedCategory.description}</p>
                <div className="mt-4">
                  <StatusBadge status={selectedCategory.status} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Categories;
