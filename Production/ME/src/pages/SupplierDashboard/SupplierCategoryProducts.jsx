import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiPackage, FiRefreshCw } from 'react-icons/fi';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import StatusBadge from '../../components/superadmin/StatusBadge';
import superAdminService from '../../services/superAdminService';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { mapSupplierCategoryProductsResponse } from '../../utils/supplierMapper';

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const formatSupplierPrice = (value) => value == null
  ? 'Not configured'
  : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

export default function SupplierCategoryProducts() {
  const { supplierId, categoryId } = useParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.getSupplierCategoryProducts(supplierId, categoryId, {
        page,
        limit: 12,
        search: search || undefined,
        status,
      });
      setResult(mapSupplierCategoryProductsResponse(response));
    } catch (err) {
      setResult(null);
      setError(getUserFacingErrorMessage(err, 'Unable to load supplier products.'));
    } finally {
      setLoading(false);
    }
  }, [supplierId, categoryId, page, search, status]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { setPage(1); }, [search, status]);

  return (
    <div className="min-w-0 space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link to="/supplier-dashboard" className="hover:text-blue-700">Supplier Dashboard</Link><span aria-hidden="true">/</span>
        <Link to="/supplier-dashboard/suppliers" className="hover:text-blue-700">Suppliers</Link>
        {result && <><span aria-hidden="true">/</span><Link to={`/supplier-dashboard/suppliers/${supplierId}`} className="hover:text-blue-700">{result.supplier.supplierName}</Link><span aria-hidden="true">/</span><span aria-current="page" className="text-gray-900">{result.category.name}</span></>}
      </nav>
      <Link to={`/supplier-dashboard/suppliers/${supplierId}`} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-blue-700"><FiArrowLeft aria-hidden="true" /> Back to Supplier</Link>

      {result && <header><p className="text-sm font-medium text-blue-700">{result.supplier.supplierName}</p><h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{result.category.name}</h1><p className="mt-2 text-sm text-gray-500">{result.total} Supplier Product{result.total === 1 ? '' : 's'}</p></header>}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1"><SearchBar placeholder="Search products..." value={search} onSearch={setSearch} /></div>
        <div className="flex flex-wrap gap-3"><FilterDropdown label="Status" options={statusOptions} selected={status} onSelect={setStatus} onClear={() => setStatus('all')} /><button type="button" onClick={loadProducts} disabled={loading} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-50"><FiRefreshCw className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh</button></div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{error}</p><button type="button" onClick={loadProducts} className="mt-3 rounded-lg border border-red-300 px-3 py-2 font-medium">Retry</button></div>}
      {loading ? <div role="status" aria-label="Loading supplier products" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((key) => <div key={key} className="h-64 animate-pulse rounded-xl border bg-white" />)}</div>
        : !error && result?.products.length === 0 ? <div className="rounded-xl border border-gray-200 bg-white p-8 text-center"><FiPackage className="mx-auto text-gray-400" size={30} /><h2 className="mt-3 font-semibold text-gray-900">No supplier products found</h2><p className="mt-2 text-sm text-gray-500">This supplier currently has no products associated with this category.</p></div>
          : !error && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{result?.products.map((mapping) => <article key={mapping.id} aria-label={mapping.product.name} className="min-w-0 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex gap-4">{mapping.product.imageUrl ? <img src={mapping.product.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400"><FiPackage size={24} /></div>}<div className="min-w-0"><h2 className="truncate text-lg font-semibold text-gray-900">{mapping.product.name}</h2>{mapping.product.sku && <p className="mt-1 text-xs text-gray-500">SKU: {mapping.product.sku}</p>}<div className="mt-2"><StatusBadge status={mapping.status.toLowerCase()} /></div></div></div><dl className="mt-5 grid gap-3 text-sm"><div><dt className="text-gray-500">Category</dt><dd className="font-medium text-gray-900">{result.category.name}</dd></div><div><dt className="text-gray-500">Supplier</dt><dd className="font-medium text-gray-900">{result.supplier.supplierName}</dd></div><div className="grid grid-cols-2 gap-3"><div><dt className="text-gray-500">Supplier Price</dt><dd className="font-semibold text-gray-900">{formatSupplierPrice(mapping.supplierPrice)}</dd></div><div><dt className="text-gray-500">MOQ</dt><dd className="font-semibold text-gray-900">{mapping.minimumOrderQuantity}</dd></div></div></dl></article>)}</div>}

      {!loading && !error && result?.pages > 1 && <nav aria-label="Supplier product pagination" className="flex items-center justify-end gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Previous</button><span className="text-sm text-gray-600">Page {result.page} of {result.pages}</span><button type="button" disabled={page >= result.pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Next</button></nav>}
    </div>
  );
}
