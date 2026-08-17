import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import Modal from '../../components/superadmin/Modal';
import superAdminService from '../../services/superAdminService';
import productService from '../../services/productService';

const inputClass =
  'w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

const emptyMappingForm = {
  productId: '',
  productName: '',
  minimumOrderQuantity: '',
  availabilityStatus: 'ACTIVE',
  notes: '',
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatSupplierPrice = (value) => {
  if (value == null || value === '') return 'Not set';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Not set';
  return `₹${amount.toFixed(2)}`;
};

export const validateSupplierProductForm = (form, { requireProduct = true } = {}) => {
  if (requireProduct && !form.productId) return 'Product is required';
  const moq = Number(form.minimumOrderQuantity);
  if (!Number.isInteger(moq) || moq < 1) return 'Minimum order quantity must be a positive number.';
  return '';
};

export const validateSupplierPriceForm = (priceValue) => {
  if (priceValue === '' || priceValue == null) return 'Supplier price must be a valid amount greater than 0.';
  const price = Number(priceValue);
  if (!Number.isFinite(price) || price <= 0) return 'Supplier price must be a valid amount greater than 0.';
  return '';
};

const mapMapping = (mapping) => ({
  id: mapping._id || mapping.id,
  productName: mapping.product?.name || '—',
  productSku: mapping.product?.sku || '—',
  minimumOrderQuantity: mapping.minimumOrderQuantity,
  currentSupplierPrice: mapping.currentSupplierPrice == null ? null : Number(mapping.currentSupplierPrice),
  priceLabel: formatSupplierPrice(mapping.currentSupplierPrice),
  availabilityStatus: mapping.availabilityStatus || 'ACTIVE',
  notes: mapping.notes || '—',
  createdAt: mapping.createdAt,
  updatedAt: mapping.updatedAt,
  raw: mapping,
});

const unwrapProducts = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload)) return payload;
  return [];
};

function SupplierProductsPanel({ supplier }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [mappingMode, setMappingMode] = useState(null);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [form, setForm] = useState(emptyMappingForm);
  const [formError, setFormError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [priceMode, setPriceMode] = useState(null);
  const [priceValue, setPriceValue] = useState('');
  const [priceError, setPriceError] = useState('');
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const isActiveSupplier = supplier?.rawStatus === 'ACTIVE';

  const loadRows = useCallback(async () => {
    if (!supplier?.id) return;
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.getSupplierProducts(supplier.id);
      const payload = response?.data ?? response;
      setRows((payload?.mappings || []).map(mapMapping));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to load supplier products'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [supplier?.id]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const loadProductOptions = useCallback(async (search) => {
    setProductLoading(true);
    try {
      const response = await productService.getAllProducts({
        search: search || undefined,
        page: 1,
        limit: 20,
      });
      setProductOptions(unwrapProducts(response));
    } catch {
      setProductOptions([]);
    } finally {
      setProductLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mappingMode !== 'create') return undefined;
    const timer = setTimeout(() => {
      loadProductOptions(productSearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [mappingMode, productSearch, loadProductOptions]);

  const openCreate = () => {
    setFormError('');
    setSelectedMapping(null);
    setForm(emptyMappingForm);
    setProductSearch('');
    setMappingMode('create');
  };

  const openEdit = (row) => {
    setFormError('');
    setSelectedMapping(row);
    setForm({
      productId: row.raw.productId,
      productName: row.productName,
      minimumOrderQuantity: String(row.minimumOrderQuantity),
      availabilityStatus: row.availabilityStatus,
      notes: row.notes === '—' ? '' : row.notes,
    });
    setMappingMode('edit');
  };

  const openView = (row) => {
    setSelectedMapping(row);
    setMappingMode('view');
  };

  const closeMappingModal = () => {
    setMappingMode(null);
    setSelectedMapping(null);
    setFormError('');
  };

  const openSetPrice = (row) => {
    setSelectedMapping(row);
    setPriceValue(row.currentSupplierPrice == null ? '' : String(row.currentSupplierPrice));
    setPriceError('');
    setPriceMode('set');
  };

  const openPriceHistory = async (row) => {
    setSelectedMapping(row);
    setPriceMode('history');
    setHistoryRows([]);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const response = await superAdminService.getSupplierProductPriceHistory(supplier.id, row.id);
      const payload = response?.data ?? response;
      setHistoryRows(payload?.history || []);
    } catch (err) {
      setHistoryError(getUserFacingErrorMessage(err, 'Failed to load price history'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const closePriceModal = () => {
    setPriceMode(null);
    setPriceValue('');
    setPriceError('');
    setHistoryRows([]);
    setHistoryError('');
    if (mappingMode !== 'view' && mappingMode !== 'edit' && mappingMode !== 'create') {
      setSelectedMapping(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validationMessage = validateSupplierProductForm(form, { requireProduct: mappingMode === 'create' });
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setActionLoading(true);
    try {
      if (mappingMode === 'create') {
        await superAdminService.createSupplierProduct(supplier.id, {
          productId: form.productId,
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          availabilityStatus: form.availabilityStatus,
          notes: form.notes.trim(),
        });
      } else {
        await superAdminService.updateSupplierProduct(supplier.id, selectedMapping.id, {
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          availabilityStatus: form.availabilityStatus,
          notes: form.notes.trim(),
        });
      }
      closeMappingModal();
      await loadRows();
    } catch (err) {
      setFormError(getUserFacingErrorMessage(err, 'Save failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriceSubmit = async (event) => {
    event.preventDefault();
    setPriceError('');
    const validationMessage = validateSupplierPriceForm(priceValue);
    if (validationMessage) {
      setPriceError(validationMessage);
      return;
    }

    setActionLoading(true);
    try {
      await superAdminService.updateSupplierProductPrice(
        supplier.id,
        selectedMapping.id,
        Number(priceValue)
      );
      closePriceModal();
      await loadRows();
    } catch (err) {
      setPriceError(getUserFacingErrorMessage(err, 'Price update failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const runStatusAction = async (row, status) => {
    setActionLoading(true);
    setError('');
    try {
      await superAdminService.updateSupplierProductStatus(supplier.id, row.id, status);
      await loadRows();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Status update failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const canSetPrice = (row) => isActiveSupplier && row.availabilityStatus === 'ACTIVE';

  const columns = useMemo(() => [
    { key: 'productName', label: 'Product' },
    { key: 'minimumOrderQuantity', label: 'MOQ' },
    {
      key: 'priceLabel',
      label: 'Supplier Price',
      render: (value) => (
        <span className={value === 'Not set' ? 'text-gray-500' : 'font-medium text-gray-900'}>
          {value}
        </span>
      ),
    },
    {
      key: 'availabilityStatus',
      label: 'Status',
      render: (value) => <StatusBadge status={String(value || '').toLowerCase()} />,
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => openView(row)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">View</button>
          <button type="button" onClick={() => openEdit(row)} className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50">Edit</button>
          {canSetPrice(row) && (
            <button
              type="button"
              onClick={() => openSetPrice(row)}
              className="px-3 py-1.5 text-sm rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              {row.currentSupplierPrice == null ? 'Set Price' : 'Update Price'}
            </button>
          )}
          <button
            type="button"
            onClick={() => openPriceHistory(row)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Price History
          </button>
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">Supplier Products</h3>
        {isActiveSupplier ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <FiPlus size={14} />
            Add Product
          </button>
        ) : (
          <p className="text-xs text-gray-500">Only active suppliers can receive new product mappings.</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading supplier products...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No products mapped to this supplier.</p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      <Modal
        isOpen={Boolean(mappingMode)}
        onClose={closeMappingModal}
        title={
          mappingMode === 'view'
            ? 'Supplier Product Details'
            : mappingMode === 'create'
              ? 'Add Supplier Product'
              : 'Edit Supplier Product'
        }
      >
        {mappingMode === 'view' && selectedMapping && (
          <div className="space-y-3 text-sm">
            <p><span className="font-medium">Product:</span> {selectedMapping.productName}</p>
            <p><span className="font-medium">MOQ:</span> {selectedMapping.minimumOrderQuantity}</p>
            <p><span className="font-medium">Supplier Price:</span> {selectedMapping.priceLabel}</p>
            <p><span className="font-medium">Status:</span> {selectedMapping.availabilityStatus}</p>
            <p><span className="font-medium">Notes:</span> {selectedMapping.notes}</p>
            <p><span className="font-medium">Created:</span> {formatDate(selectedMapping.createdAt)}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {canSetPrice(selectedMapping) && (
                <button
                  type="button"
                  onClick={() => openSetPrice(selectedMapping)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  {selectedMapping.currentSupplierPrice == null ? 'Set Price' : 'Update Price'}
                </button>
              )}
              <button
                type="button"
                onClick={() => openPriceHistory(selectedMapping)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Price History
              </button>
            </div>
          </div>
        )}

        {mappingMode !== 'view' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input className={inputClass} value={supplier.supplierName} readOnly />
            </div>

            {mappingMode === 'create' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <input
                  className={inputClass}
                  placeholder="Search existing products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {productLoading ? (
                    <p className="px-3 py-2 text-sm text-gray-500">Loading products...</p>
                  ) : productOptions.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-500">No products found.</p>
                  ) : (
                    productOptions.map((product) => (
                      <button
                        key={product._id || product.id}
                        type="button"
                        onClick={() => setForm({
                          ...form,
                          productId: product._id || product.id,
                          productName: product.name,
                        })}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${form.productId === (product._id || product.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                      >
                        {product.name}
                      </button>
                    ))
                  )}
                </div>
                {form.productName && (
                  <p className="mt-2 text-xs text-gray-600">Selected: {form.productName}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <input className={inputClass} value={form.productName} readOnly />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Quantity *</label>
              <input
                className={inputClass}
                type="number"
                step="1"
                placeholder="50"
                value={form.minimumOrderQuantity}
                onChange={(e) => setForm({ ...form, minimumOrderQuantity: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
              <select
                className={inputClass}
                value={form.availabilityStatus}
                onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <textarea
              className={`${inputClass} min-h-[88px]`}
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeMappingModal} className="px-4 py-2.5 text-sm border rounded-lg">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
                {actionLoading ? 'Saving...' : (mappingMode === 'create' ? 'Add Product' : 'Save')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={priceMode === 'set'}
        onClose={closePriceModal}
        title={selectedMapping?.currentSupplierPrice == null ? 'Set Supplier Price' : 'Update Supplier Price'}
      >
        {selectedMapping && (
          <form onSubmit={handlePriceSubmit} className="space-y-4">
            {priceError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {priceError}
              </div>
            )}
            <p className="text-sm text-gray-600">
              Product: <span className="font-medium text-gray-900">{selectedMapping.productName}</span>
            </p>
            <p className="text-sm text-gray-600">
              Current price: <span className="font-medium text-gray-900">{selectedMapping.priceLabel}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier purchase price (₹) *</label>
              <input
                className={inputClass}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="100.00"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Internal procurement cost only. Does not change customer selling price.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closePriceModal} className="px-4 py-2.5 text-sm border rounded-lg">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-4 py-2.5 text-sm bg-emerald-600 text-white rounded-lg disabled:opacity-50">
                {actionLoading ? 'Saving...' : 'Save Price'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={priceMode === 'history'}
        onClose={closePriceModal}
        title="Supplier Price History"
      >
        {selectedMapping && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Product: <span className="font-medium text-gray-900">{selectedMapping.productName}</span>
            </p>
            <p className="text-sm text-gray-600">
              Current price: <span className="font-medium text-gray-900">{selectedMapping.priceLabel}</span>
            </p>

            {historyError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {historyError}
              </div>
            )}

            {historyLoading ? (
              <p className="text-sm text-gray-500">Loading price history...</p>
            ) : historyRows.length === 0 ? (
              <p className="text-sm text-gray-500">No price history yet.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Price</th>
                      <th className="px-3 py-2 font-medium">Previous</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((entry) => (
                      <tr key={entry._id} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-700">{formatDate(entry.changedAt)}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{formatSupplierPrice(entry.price)}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {entry.previousPrice == null ? '—' : formatSupplierPrice(entry.previousPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SupplierProductsPanel;
