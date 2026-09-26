import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import StatusBadge from '../../components/superadmin/StatusBadge';
import superAdminService from '../../services/superAdminService';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { mapSupplier } from '../../utils/supplierMapper';

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function SupplierDetails() {
  const { supplierId } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSupplier = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.getSupplier(supplierId);
      setSupplier(mapSupplier(response?.data ?? response));
    } catch (err) {
      setSupplier(null);
      setError(getUserFacingErrorMessage(err, 'Unable to load supplier.'));
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => { loadSupplier(); }, [loadSupplier]);

  if (loading) return <div role="status" className="min-h-[50vh] animate-pulse rounded-xl border border-gray-100 bg-white" aria-label="Loading supplier" />;
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"><p>{error}</p><button type="button" onClick={loadSupplier} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 font-medium"><FiRefreshCw /> Retry</button></div>;
  if (!supplier) return null;

  return (
    <div className="min-w-0 space-y-6">
      <Link to="/supplier-dashboard/suppliers" className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-blue-700"><FiArrowLeft aria-hidden="true" /> Back to Suppliers</Link>
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{supplier.supplierName}</h1><p className="mt-1 text-gray-500">{supplier.companyName}</p></div><StatusBadge status={supplier.status.toLowerCase()} /></div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md"><Link to={`/supplier-dashboard/suppliers/${supplier.id}/categories`} className="rounded-lg bg-gray-50 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className="text-sm text-gray-500">Categories</span><strong className="mt-1 block text-2xl text-gray-900">{supplier.categoryCount}</strong></Link><Link to={`/supplier-dashboard/suppliers/${supplier.id}/products`} className="rounded-lg bg-gray-50 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className="text-sm text-gray-500">Products</span><strong className="mt-1 block text-2xl text-gray-900">{supplier.productCount}</strong></Link></div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-gray-900">Supplier Information</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">Contact person</dt><dd className="mt-1 font-medium text-gray-900">{supplier.contactPerson}</dd></div><div><dt className="text-gray-500">Phone</dt><dd className="mt-1 font-medium text-gray-900">{supplier.phone}</dd></div><div><dt className="text-gray-500">Email</dt><dd className="mt-1 break-words font-medium text-gray-900">{supplier.email}</dd></div><div><dt className="text-gray-500">GST number</dt><dd className="mt-1 font-medium text-gray-900">{supplier.gstNumber}</dd></div><div className="sm:col-span-2"><dt className="text-gray-500">Business address</dt><dd className="mt-1 font-medium text-gray-900">{supplier.businessAddress}</dd></div><div><dt className="text-gray-500">Created</dt><dd className="mt-1 font-medium text-gray-900">{formatDate(supplier.createdAt)}</dd></div></dl></section>
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-gray-900">Associated Categories</h2>{supplier.categories.length === 0 ? <p className="mt-4 text-sm text-gray-500">No categories are associated with this supplier.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{supplier.categories.map((category) => <Link key={category.id} to={`/supplier-dashboard/suppliers/${supplier.id}/categories/${category.categoryId}`} className="group rounded-lg border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><h3 className="font-semibold text-gray-900">{category.name}</h3><p className="mt-2 text-sm text-gray-500">{category.productCount} Supplier Product{category.productCount === 1 ? '' : 's'}</p><p className="mt-2 text-xs font-medium text-gray-500">{category.status}</p><span className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-blue-700">View Products <span className="ml-1" aria-hidden="true">→</span></span></Link>)}</div>}</section>
      </div>
    </div>
  );
}
