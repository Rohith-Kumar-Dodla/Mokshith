import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import PageHeader from '../../components/superadmin/PageHeader';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import Modal from '../../components/superadmin/Modal';
import superAdminService from '../../services/superAdminService';
import SupplierSummaryCard from './SupplierSummaryCard';
import SupplierProductsCatalog from './SupplierProductsCatalog';
import SupplierCategoriesPanel from './SupplierCategoriesPanel';
import SupplierActivationBanner from './SupplierActivationBanner';

const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const inputClass =
  'w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

const emptyForm = {
  supplierName: '',
  companyName: '',
  contactPerson: '',
  phone: '',
  email: '',
  businessAddress: '',
  gstNumber: '',
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

const mapSupplier = (supplier) => ({
  id: supplier._id || supplier.id,
  supplierName: supplier.supplierName || '—',
  companyName: supplier.companyName || '—',
  contactPerson: supplier.contactPerson || '—',
  phone: supplier.phone || '—',
  email: supplier.email || '—',
  businessAddress: supplier.businessAddress || '—',
  gstNumber: supplier.gstNumber || '—',
  notes: supplier.notes || '—',
  status: String(supplier.status || 'PENDING').toLowerCase(),
  rawStatus: supplier.status || 'PENDING',
  createdAt: supplier.createdAt,
  updatedAt: supplier.updatedAt,
  catalogSummary: supplier.catalogSummary || {
    productCount: 0,
    categoryCount: 0,
    pricesConfigured: 0,
    pricesNotSet: 0,
    activeProductCount: 0,
  },
});

const validateSupplierForm = (form) => {
  if (!form.supplierName.trim()) return 'Supplier name is required';
  if (!form.companyName.trim()) return 'Company name is required';
  if (!/^\d{10}$/.test(String(form.phone).replace(/\D/g, ''))) return 'Phone must be 10 digits';
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) return 'Enter a valid email address';
  if (form.gstNumber.trim() && !GST_PATTERN.test(form.gstNumber.trim().toUpperCase())) {
    return 'Invalid GST number format';
  }
  return '';
};

const buildPayload = (form) => ({
  supplierName: form.supplierName.trim(),
  companyName: form.companyName.trim(),
  contactPerson: form.contactPerson.trim(),
  phone: String(form.phone).replace(/\D/g, ''),
  email: form.email.trim() || undefined,
  businessAddress: form.businessAddress.trim(),
  gstNumber: form.gstNumber.trim().toUpperCase() || undefined,
  notes: form.notes.trim(),
});

function Suppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [viewTab, setViewTab] = useState('overview');
  const [productsCategoryFilter, setProductsCategoryFilter] = useState('all');

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.getSuppliers({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter,
      });
      const payload = response?.data ?? response;
      const suppliers = payload?.suppliers || [];
      setRows(suppliers.map(mapSupplier));
      setTotalPages(payload?.pages || 1);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to load suppliers'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const openCreateModal = () => {
    setFormError('');
    setSelectedRow(null);
    setForm(emptyForm);
    setModalMode('create');
  };

  const openEditModal = (row) => {
    setFormError('');
    setSelectedRow(row);
    setForm({
      supplierName: row.supplierName === '—' ? '' : row.supplierName,
      companyName: row.companyName === '—' ? '' : row.companyName,
      contactPerson: row.contactPerson === '—' ? '' : row.contactPerson,
      phone: row.phone === '—' ? '' : row.phone,
      email: row.email === '—' ? '' : row.email,
      businessAddress: row.businessAddress === '—' ? '' : row.businessAddress,
      gstNumber: row.gstNumber === '—' ? '' : row.gstNumber,
      notes: row.notes === '—' ? '' : row.notes,
    });
    setModalMode('edit');
  };

  const openViewModal = (row) => {
    setSelectedRow(row);
    setViewTab('overview');
    setProductsCategoryFilter('all');
    setModalMode('view');
  };

  const openViewFromCard = (row) => {
    openViewModal(row);
  };

  const handleViewProductsForCategory = (categoryId) => {
    setProductsCategoryFilter(categoryId);
    setViewTab('products');
  };

  const refreshSelectedSupplierSummary = useCallback(async () => {
    if (!selectedRow?.id) return;
    try {
      const response = await superAdminService.getSupplier(selectedRow.id);
      const payload = response?.data ?? response;
      const refreshed = mapSupplier(payload);
      setSelectedRow(refreshed);
      setRows((current) => current.map((row) => (row.id === refreshed.id ? refreshed : row)));
      return refreshed;
    } catch {
      // Keep existing summary if refresh fails.
      return selectedRow;
    }
  }, [selectedRow?.id, selectedRow]);

  const handleActivateSelectedSupplier = async () => {
    if (!selectedRow?.id) return;
    setActionLoading(true);
    setError('');
    try {
      await superAdminService.updateSupplierStatus(selectedRow.id, 'ACTIVE');
      await refreshSelectedSupplierSummary();
      await loadRows();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Status update failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSelectedSupplier = async () => {
    if (!selectedRow?.id) return;
    setActionLoading(true);
    setError('');
    try {
      await superAdminService.updateSupplierStatus(selectedRow.id, 'APPROVED');
      await refreshSelectedSupplierSummary();
      await loadRows();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Status update failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedRow(null);
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validationMessage = validateSupplierForm(form);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setActionLoading(true);
    try {
      const payload = buildPayload(form);
      if (modalMode === 'create') {
        await superAdminService.createSupplier(payload);
      } else {
        await superAdminService.updateSupplier(selectedRow.id, payload);
      }
      closeModal();
      await loadRows();
    } catch (err) {
      setFormError(getUserFacingErrorMessage(err, 'Save failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const runStatusAction = async (row, status) => {
    setActionLoading(true);
    setError('');
    try {
      await superAdminService.updateSupplierStatus(row.id, status);
      await loadRows();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Status update failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo(() => [
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'companyName', label: 'Company' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
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
          <button type="button" onClick={() => openViewModal(row)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">View</button>
          <button type="button" onClick={() => openEditModal(row)} className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50">Edit</button>
          {row.rawStatus === 'PENDING' && (
            <button type="button" disabled={actionLoading} onClick={() => runStatusAction(row, 'APPROVED')} className="px-3 py-1.5 text-sm rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50">
              Approve
            </button>
          )}
          {(row.rawStatus === 'APPROVED' || row.rawStatus === 'INACTIVE') && (
            <button type="button" disabled={actionLoading} onClick={() => runStatusAction(row, 'ACTIVE')} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
              Activate
            </button>
          )}
          {row.rawStatus === 'ACTIVE' && (
            <button type="button" disabled={actionLoading} onClick={() => runStatusAction(row, 'INACTIVE')} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
              Deactivate
            </button>
          )}
        </div>
      ),
    },
  ], [actionLoading]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Suppliers"
        subtitle="Onboard and manage supplier records."
        actions={(
          <div className="flex flex-wrap gap-3">
            <Link
              to="/super-admin/suppliers/comparison"
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Compare Suppliers
            </Link>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <FiPlus size={16} />
              Add Supplier
            </button>
          </div>
        )}
      />

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <SearchBar placeholder="Search suppliers..." value={searchTerm} onSearch={setSearchTerm} />
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={statusFilter}
          onSelect={setStatusFilter}
          onClear={() => setStatusFilter('all')}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Supplier Overview</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <SupplierSummaryCard key={key} supplier={{}} loading />
            ))}
          </div>
        ) : rows.length === 0 ? null : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <SupplierSummaryCard key={row.id} supplier={row} onView={openViewFromCard} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading suppliers...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No suppliers found.</p>
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}

      <Modal
        isOpen={Boolean(modalMode)}
        onClose={closeModal}
        size={modalMode === 'view' ? 'xl' : 'md'}
        title={
          modalMode === 'view'
            ? 'Supplier Details'
            : modalMode === 'create'
              ? 'Add Supplier'
              : 'Edit Supplier'
        }
      >
        {modalMode === 'view' && selectedRow && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setViewTab('overview')}
                className={`px-3 py-2.5 min-h-[44px] text-sm rounded-lg font-medium ${viewTab === 'overview' ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setViewTab('products')}
                className={`px-3 py-2.5 min-h-[44px] text-sm rounded-lg font-medium ${viewTab === 'products' ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => setViewTab('categories')}
                className={`px-3 py-2.5 min-h-[44px] text-sm rounded-lg font-medium ${viewTab === 'categories' ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Categories
              </button>
            </div>

            {viewTab === 'overview' ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-gray-500">Products</p>
                    <p className="font-semibold text-gray-900">{selectedRow.catalogSummary.productCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Categories</p>
                    <p className="font-semibold text-gray-900">{selectedRow.catalogSummary.categoryCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Prices Configured</p>
                    <p className="font-semibold text-gray-900">{selectedRow.catalogSummary.pricesConfigured}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Prices Not Set</p>
                    <p className={`font-semibold ${selectedRow.catalogSummary.pricesNotSet > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
                      {selectedRow.catalogSummary.pricesNotSet}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <p><span className="font-medium">Supplier name:</span> {selectedRow.supplierName}</p>
                  <p><span className="font-medium">Company:</span> {selectedRow.companyName}</p>
                  <p><span className="font-medium">Contact person:</span> {selectedRow.contactPerson}</p>
                  <p><span className="font-medium">Phone:</span> {selectedRow.phone}</p>
                  <p><span className="font-medium">Email:</span> {selectedRow.email}</p>
                  <p><span className="font-medium">Address:</span> {selectedRow.businessAddress}</p>
                  <p><span className="font-medium">GST:</span> {selectedRow.gstNumber}</p>
                  <p><span className="font-medium">Notes:</span> {selectedRow.notes}</p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <StatusBadge status={selectedRow.status} />
                    <span className="text-gray-700">{selectedRow.rawStatus}</span>
                  </p>
                  {selectedRow.rawStatus !== 'ACTIVE' && (
                    <SupplierActivationBanner
                      supplier={selectedRow}
                      context="overview"
                      onActivateSupplier={handleActivateSelectedSupplier}
                      onApproveSupplier={handleApproveSelectedSupplier}
                      actionLoading={actionLoading}
                    />
                  )}
                  <p><span className="font-medium">Created:</span> {formatDate(selectedRow.createdAt)}</p>
                  <p><span className="font-medium">Updated:</span> {formatDate(selectedRow.updatedAt)}</p>
                </div>
              </div>
            ) : viewTab === 'products' ? (
              <SupplierProductsCatalog
                supplier={selectedRow}
                categoryFilter={productsCategoryFilter}
                onCatalogChange={refreshSelectedSupplierSummary}
                onActivateSupplier={handleActivateSelectedSupplier}
                onApproveSupplier={handleApproveSelectedSupplier}
                supplierActionLoading={actionLoading}
              />
            ) : (
              <SupplierCategoriesPanel
                supplier={selectedRow}
                onViewProductsForCategory={handleViewProductsForCategory}
                onCatalogChange={refreshSelectedSupplierSummary}
                onActivateSupplier={handleActivateSelectedSupplier}
                onApproveSupplier={handleApproveSelectedSupplier}
                supplierActionLoading={actionLoading}
              />
            )}
          </div>
        )}

        {modalMode !== 'view' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <input className={inputClass} placeholder="Supplier Name *" value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} required />
            <input className={inputClass} placeholder="Company Name *" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
            <input className={inputClass} placeholder="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            <input className={inputClass} placeholder="Phone Number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <input className={inputClass} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={inputClass} placeholder="Business Address" value={form.businessAddress} onChange={(e) => setForm({ ...form, businessAddress: e.target.value })} />
            <input className={inputClass} placeholder="GST Number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} />
            <textarea className={`${inputClass} min-h-[88px]`} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="px-4 py-2.5 text-sm border rounded-lg">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
                {actionLoading ? 'Saving...' : (modalMode === 'create' ? 'Create Supplier' : 'Save')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default Suppliers;
export { validateSupplierForm };
