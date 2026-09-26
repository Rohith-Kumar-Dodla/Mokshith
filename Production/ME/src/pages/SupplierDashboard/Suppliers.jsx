import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import StatusBadge from '../../components/superadmin/StatusBadge';
import superAdminService from '../../services/superAdminService';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { mapSupplierListResponse } from '../../utils/supplierMapper';

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

export default function SupplierNetwork() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ suppliers: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.getSuppliers({
        page,
        limit: 12,
        search: search || undefined,
        status,
      });
      setResult(mapSupplierListResponse(response));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Unable to load suppliers.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);
  useEffect(() => { setPage(1); }, [search, status]);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Suppliers" subtitle="View and manage all suppliers associated with the platform." />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1"><SearchBar placeholder="Search suppliers..." value={search} onSearch={setSearch} /></div>
        <div className="flex flex-wrap gap-3">
          <FilterDropdown label="Status" options={statusOptions} selected={status} onSelect={setStatus} onClear={() => setStatus('all')} />
          <button type="button" onClick={loadSuppliers} disabled={loading} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <FiRefreshCw aria-hidden="true" className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={loadSuppliers} className="mt-3 rounded-lg border border-red-300 px-3 py-2 font-medium hover:bg-red-100">Retry</button>
        </div>
      )}

      {loading ? (
        <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Loading suppliers">
          {[1, 2, 3, 4].map((key) => <div key={key} className="h-56 animate-pulse rounded-xl border border-gray-100 bg-white" />)}
        </div>
      ) : !error && result.suppliers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center"><h2 className="font-semibold text-gray-900">No suppliers found</h2><p className="mt-2 text-sm text-gray-500">Suppliers associated with the platform will appear here.</p></div>
      ) : !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {result.suppliers.map((supplier) => (
            <article key={supplier.id} className="flex min-w-0 flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="min-w-0"><h2 className="truncate text-lg font-semibold text-gray-900">{supplier.supplierName}</h2><p className="mt-1 truncate text-sm text-gray-500">{supplier.companyName}</p></div>
              <div className="mt-4"><StatusBadge status={supplier.status.toLowerCase()} /></div>
              <dl className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
                <div><dt className="text-xs text-gray-500">Categories</dt><dd className="mt-1 text-xl font-bold text-gray-900">{supplier.categoryCount}</dd></div>
                <div><dt className="text-xs text-gray-500">Products</dt><dd className="mt-1 text-xl font-bold text-gray-900">{supplier.productCount}</dd></div>
              </dl>
              <Link to={`/supplier-dashboard/suppliers/${supplier.id}`} className="mt-5 inline-flex min-h-[44px] items-center font-semibold text-blue-700 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">View Supplier <span aria-hidden="true" className="ml-1">→</span></Link>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && result.pages > 1 && <nav aria-label="Supplier pagination" className="flex items-center justify-end gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Previous</button><span className="text-sm text-gray-600">Page {result.page} of {result.pages}</span><button type="button" disabled={page >= result.pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Next</button></nav>}
    </div>
  );
}
