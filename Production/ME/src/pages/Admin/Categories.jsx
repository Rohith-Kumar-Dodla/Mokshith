import React, { useState } from 'react';
import { FiEdit, FiTrash2, FiEye, FiPackage, FiTrendingUp } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/admin/Modal';
import { categories } from '../../data/categories';

const Categories = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setIsViewModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setIsAddModalOpen(true);
  };

  const handleDeleteCategory = (categoryId) => {
    console.log('Delete category:', categoryId);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Product Categories"
        subtitle="Manage product categories within your assigned area"
        buttonText="Add Category"
        onButtonClick={() => setIsAddModalOpen(true)}
      />

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer p-3 sm:p-4" onClick={() => handleViewCategory(category)}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <img
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
                <FiPackage size={14} sm:size={16} className="text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-600">{category.productCount} Products</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FiTrendingUp size={14} sm:size={16} className="text-green-600" />
                <span className="text-xs sm:text-sm text-gray-600">₹{(category.totalSales / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Category Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Category Name</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Products</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Total Sales</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{category.productCount}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">₹{category.totalSales.toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <StatusBadge status={category.status} />
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleViewCategory(category)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                        title="View"
                      >
                        <FiEye size={14} sm:size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                        title="Edit"
                      >
                        <FiEdit size={14} sm:size={16} className="text-green-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
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
      </Card>

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={selectedCategory ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <form className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category Name</label>
            <input
              type="text"
              defaultValue={selectedCategory?.name || ''}
              className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Description</label>
            <textarea
              rows="3"
              defaultValue={selectedCategory?.description || ''}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category Image URL</label>
            <input
              type="text"
              defaultValue={selectedCategory?.image || ''}
              className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter image URL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
            <select className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {/* View Category Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Category Details"
        size="md"
      >
        {selectedCategory && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <img
                src={selectedCategory.image}
                alt={selectedCategory.name}
                className="w-full sm:w-32 h-32 sm:h-32 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedCategory.name}</h3>
                <p className="text-sm sm:text-base text-gray-600 mt-2">{selectedCategory.description}</p>
                <div className="mt-4">
                  <StatusBadge status={selectedCategory.status} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-600">Total Products</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">{selectedCategory.productCount}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                <p className="text-xs sm:text-sm text-green-600">Total Sales</p>
                <p className="text-lg sm:text-2xl font-bold text-green-900">₹{selectedCategory.totalSales.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Categories;
