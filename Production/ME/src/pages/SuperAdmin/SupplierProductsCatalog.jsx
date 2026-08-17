import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import Modal from '../../components/superadmin/Modal';
import superAdminService from '../../services/superAdminService';
import SupplierProductCreateModal from './SupplierProductCreateModal';
import SupplierActivationBanner from './SupplierActivationBanner';
import { formatSupplierPrice } from './SupplierProductsCatalog.utils';
import { isActiveSupplierStatus } from './supplierActivationUtils';

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const PRICE_OPTIONS = [
  { label: 'All Prices', value: 'all' },
  { label: 'Price Set', value: 'set' },
  { label: 'Price Not Set', value: 'not_set' },
];

const inputClass =
  'w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

const mapMapping = (mapping) => ({
  id: mapping._id || mapping.id,
  productName: mapping.product?.name || '—',
  categoryName: mapping.product?.category?.name || '—',
  categoryId: mapping.product?.categoryId || mapping.product?.category?._id || null,
  minimumOrderQuantity: mapping.minimumOrderQuantity,
  currentSupplierPrice: mapping.currentSupplierPrice == null ? null : Number(mapping.currentSupplierPrice),
  priceLabel: formatSupplierPrice(mapping.currentSupplierPrice),
  availabilityStatus: mapping.availabilityStatus || 'ACTIVE',
  notes: mapping.notes || '',
  raw: mapping,
});

function SupplierProductsCatalog({
  supplier,
  categoryFilter = 'all',
  onCatalogChange,
  onActivateSupplier,
  onApproveSupplier,
  supplierActionLoading = false,
}) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [categoryId, setCategoryId] = useState(categoryFilter);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [priceModal, setPriceModal] = useState(null);
  const [priceValue, setPriceValue] = useState('');
  const [priceError, setPriceError] = useState('');

  const isActiveSupplier = isActiveSupplierStatus(supplier?.rawStatus);

  useEffect(() => {
    setCategoryId(categoryFilter);
  }, [categoryFilter]);

  const loadCategories = useCallback(async () => {
    if (!supplier?.id) return;
    try {
      const response = await superAdminService.getSupplierCategories(supplier.id);
      const payload = response?.data ?? response;
      const categories = payload?.categories || [];
      setCategoryOptions([
        { label: 'All Categories', value: 'all' },
        ...categories.map((category) => ({
          label: category.name,
          value: category.categoryId,
        })),
      ]);
    } catch {
      setCategoryOptions([{ label: 'All Categories', value: 'all' }]);
    }
  }, [supplier?.id]);

  const loadRows = useCallback(async () => {
    if (!supplier?.id) return;
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.getSupplierProducts(supplier.id, {
        page: 1,
        limit: 100,
        search: searchTerm || undefined,
        status: statusFilter,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        priceStatus: priceFilter,
      });
      const payload = response?.data ?? response;
      setRows((payload?.mappings || []).map(mapMapping));
      setTotal(payload?.total || 0);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Unable to load supplier products. Please try again.'));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [supplier?.id, searchTerm, statusFilter, priceFilter, categoryId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const refreshAll = async () => {
    await loadRows();
    if (onCatalogChange) {
      await onCatalogChange();
    }
  };

  const runStatusAction = async (row, status) => {
    setActionLoading(true);
    setError('');
    try {
      await superAdminService.updateSupplierProductStatus(supplier.id, row.id, status);
      await refreshAll();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Status update failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const openSetPrice = (row) => {
    setPriceModal(row);
    setPriceValue(row.currentSupplierPrice == null ? '' : String(row.currentSupplierPrice));
    setPriceError('');
  };

  const handlePriceSubmit = async (event) => {
    event.preventDefault();
    setPriceError('');
    const price = Number(priceValue);
    if (!Number.isFinite(price) || price <= 0) {
      setPriceError('Supplier purchase price must be greater than ₹0.');
      return;
    }
    setActionLoading(true);
    try {
      await superAdminService.updateSupplierProductPrice(supplier.id, priceModal.id, price);
      setPriceModal(null);
      await refreshAll();
    } catch (err) {
      setPriceError(getUserFacingErrorMessage(err, 'Price update failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo(() => [
    {
      key: 'productName',
      label: 'Product',
      render: (value) => (
        <div className="space-y-1">
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
            Supplier Product
          </span>
          <p className="font-medium text-gray-900">{value}</p>
        </div>
      ),
    },
    {
      key: 'priceLabel',
      label: 'Supplier Purchase Price',
      render: (value) => (
        <span className={value === 'Not Set' ? 'text-amber-700 font-medium' : 'font-medium text-gray-900'}>
          {value}{value === 'Not Set' ? ' ⚠' : ''}
        </span>
      ),
    },
    { key: 'minimumOrderQuantity', label: 'Supplier MOQ' },
    {
      key: 'availabilityStatus',
      label: 'Status',
      render: (value) => <StatusBadge status={String(value || '').toLowerCase()} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-2">
          {isActiveSupplier && row.availabilityStatus === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => openSetPrice(row)}
              className="px-3 py-1.5 text-sm rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              {row.currentSupplierPrice == null ? 'Set Price' : 'Update Price'}
            </button>
          )}
          {row.availabilityStatus === 'INACTIVE' && (
            <button type="button" disabled={actionLoading} onClick={() => runStatusAction(row, 'ACTIVE')} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
              Activate
            </button>
          )}
          {row.availabilityStatus === 'ACTIVE' && (
            <button type="button" disabled={actionLoading} onClick={() => runStatusAction(row, 'INACTIVE')} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
              Deactivate
            </button>
          )}
        </div>
      ),
    },
  ], [actionLoading, isActiveSupplier]);

  const summary = supplier?.catalogSummary;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Supplier Products</h3>
        </div>
        {isActiveSupplier && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0"
          >
            <FiPlus size={14} />
            Create Supplier Product
          </button>
        )}
      </div>

      {!isActiveSupplier && (
        <SupplierActivationBanner
          supplier={supplier}
          context="products"
          onActivateSupplier={onActivateSupplier}
          onApproveSupplier={onApproveSupplier}
          actionLoading={supplierActionLoading}
        />
      )}

      <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-600">
          {loading && !summary ? 'Loading summary...' : `${total} Supplier Product${total === 1 ? '' : 's'}`}
        </p>
        {summary && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-4">
            <span>Products: {summary.productCount}</span>
            <span>Categories: {summary.categoryCount}</span>
            <span>Prices Configured: {summary.pricesConfigured}</span>
            <span className={summary.pricesNotSet > 0 ? 'text-amber-700' : ''}>
              Prices Not Set: {summary.pricesNotSet}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="flex-1 min-w-[220px]">
          <SearchBar placeholder="Search products..." value={searchTerm} onSearch={setSearchTerm} />
        </div>
        <FilterDropdown label="Category" options={categoryOptions} selected={categoryId} onSelect={setCategoryId} onClear={() => setCategoryId('all')} />
        <FilterDropdown label="Status" options={STATUS_OPTIONS} selected={statusFilter} onSelect={setStatusFilter} onClear={() => setStatusFilter('all')} />
        <FilterDropdown label="Price" options={PRICE_OPTIONS} selected={priceFilter} onSelect={setPriceFilter} onClear={() => setPriceFilter('all')} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading supplier products...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No supplier products configured.</p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      <SupplierProductCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        supplier={supplier}
        onSuccess={refreshAll}
      />

      <Modal
        isOpen={Boolean(priceModal)}
        onClose={() => setPriceModal(null)}
        title={priceModal?.currentSupplierPrice == null ? 'Set Supplier Purchase Price' : 'Update Supplier Purchase Price'}
      >
        {priceModal && (
          <form onSubmit={handlePriceSubmit} className="space-y-4">
            {priceError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{priceError}</div>
            )}
            <p className="text-sm text-gray-600">
              Product: <span className="font-medium text-gray-900">{priceModal.productName}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Purchase Price (₹) *</label>
              <input className={inputClass} type="number" min="0.01" step="0.01" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} required />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPriceModal(null)} className="px-4 py-2.5 text-sm border rounded-lg">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-4 py-2.5 text-sm bg-emerald-600 text-white rounded-lg disabled:opacity-50">
                {actionLoading ? 'Saving...' : 'Save Price'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default SupplierProductsCatalog;
