import React, { useCallback, useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import StatusBadge from '../../components/superadmin/StatusBadge';
import Modal from '../../components/superadmin/Modal';
import superAdminService from '../../services/superAdminService';
import SupplierActivationBanner from './SupplierActivationBanner';
import { isActiveSupplierStatus } from './supplierActivationUtils';

const inputClass =
  'w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

const unwrapList = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload)) return payload;
  return [];
};

function SupplierCategoriesPanel({
  supplier,
  onViewProductsForCategory,
  onCatalogChange,
  onActivateSupplier,
  onApproveSupplier,
  supplierActionLoading = false,
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [formError, setFormError] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryOptionsLoading, setCategoryOptionsLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  const isActiveSupplier = isActiveSupplierStatus(supplier?.rawStatus);

  const loadCategories = useCallback(async () => {
    if (!supplier?.id) return;
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.getSupplierCategories(supplier.id);
      const payload = response?.data ?? response;
      setCategories(payload?.categories || []);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Unable to load supplier categories. Please try again.'));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [supplier?.id]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadGlobalCategories = useCallback(async (search) => {
    setCategoryOptionsLoading(true);
    try {
      const response = await superAdminService.getCategories();
      const allCategories = unwrapList(response);
      const associatedIds = new Set(categories.map((item) => String(item.categoryId)));
      const normalizedSearch = String(search || '').trim().toLowerCase();
      const filtered = allCategories.filter((category) => {
        if (associatedIds.has(String(category._id || category.id))) return false;
        if (!normalizedSearch) return true;
        return String(category.name || '').toLowerCase().includes(normalizedSearch);
      });
      setCategoryOptions(filtered);
    } catch {
      setCategoryOptions([]);
    } finally {
      setCategoryOptionsLoading(false);
    }
  }, [categories]);

  useEffect(() => {
    if (modalMode !== 'create') return undefined;
    const timer = setTimeout(() => {
      loadGlobalCategories(categorySearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [modalMode, categorySearch, loadGlobalCategories]);

  const notifyCatalogChange = async () => {
    await loadCategories();
    if (onCatalogChange) {
      await onCatalogChange();
    }
  };

  const openCreate = () => {
    setFormError('');
    setCategorySearch('');
    setSelectedCategoryId('');
    setSelectedCategoryName('');
    setModalMode('create');
  };

  const closeModal = () => {
    setModalMode(null);
    setFormError('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!selectedCategoryId) {
      setFormError('Select an existing category to associate with this supplier.');
      return;
    }

    setActionLoading(true);
    try {
      await superAdminService.createSupplierCategory(supplier.id, {
        categoryId: selectedCategoryId,
      });
      closeModal();
      await notifyCatalogChange();
    } catch (err) {
      setFormError(getUserFacingErrorMessage(err, 'Unable to associate category. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const runStatusAction = async (mapping, status) => {
    setActionLoading(true);
    setError('');
    try {
      await superAdminService.updateSupplierCategoryStatus(supplier.id, mapping._id, status);
      await notifyCatalogChange();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Status update failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const summary = supplier?.catalogSummary;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Supplier Categories</h3>
          <p className="text-sm text-gray-600 mt-1">
            {loading ? 'Loading categories...' : `${categories.length} Supplier Categor${categories.length === 1 ? 'y' : 'ies'}`}
          </p>
          {summary && (
            <p className="text-xs text-gray-500 mt-1">
              Explicit supplier-category associations linked to canonical global categories.
            </p>
          )}
        </div>
        {isActiveSupplier && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0"
          >
            <FiPlus size={14} />
            Add Supplier Category
          </button>
        )}
      </div>

      {!isActiveSupplier && (
        <SupplierActivationBanner
          supplier={supplier}
          context="categories"
          onActivateSupplier={onActivateSupplier}
          onApproveSupplier={onApproveSupplier}
          actionLoading={supplierActionLoading}
        />
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((key) => (
            <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-sm text-gray-500">No supplier categories configured.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <div
              key={category._id || category.categoryId}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                  Supplier Category
                </span>
                <StatusBadge status={String(category.status || 'ACTIVE').toLowerCase()} />
              </div>
              <h4 className="mt-2 text-base font-semibold text-gray-900">{category.name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {category.productCount} Supplier Product{category.productCount === 1 ? '' : 's'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewProductsForCategory?.(category.categoryId)}
                  className="inline-flex text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  View Products →
                </button>
                {category.status === 'INACTIVE' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => runStatusAction(category, 'ACTIVE')}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Activate
                  </button>
                )}
                {category.status === 'ACTIVE' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => runStatusAction(category, 'INACTIVE')}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalMode === 'create'}
        onClose={closeModal}
        title="Add Supplier Category"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input className={inputClass} value={supplier?.supplierName || ''} readOnly />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Global Category *</label>
            <input
              className={inputClass}
              placeholder="Search existing categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Select a canonical category. This does not create a new global category.
            </p>
            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
              {categoryOptionsLoading ? (
                <p className="px-3 py-2 text-sm text-gray-500">Loading categories...</p>
              ) : categoryOptions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-500">No available categories found.</p>
              ) : (
                categoryOptions.map((category) => (
                  <button
                    key={category._id || category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(category._id || category.id);
                      setSelectedCategoryName(category.name);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${selectedCategoryId === (category._id || category.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                  >
                    {category.name}
                  </button>
                ))
              )}
            </div>
            {selectedCategoryName && (
              <p className="mt-2 text-xs text-gray-600">Selected: {selectedCategoryName}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="px-4 py-2.5 text-sm border rounded-lg">Cancel</button>
            <button type="submit" disabled={actionLoading} className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {actionLoading ? 'Saving...' : 'Add Supplier Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SupplierCategoriesPanel;
