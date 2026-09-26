import { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import superAdminService from '../../services/superAdminService';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';

const labels = {
  totalSuppliers: 'Total Suppliers', activeSuppliers: 'Active Suppliers',
  totalSupplierCategories: 'Supplier Categories', totalSupplierProducts: 'Supplier Products',
  totalSupplierProductQuantity: 'Supplier Quantity', averageSupplierPrice: 'Average Supplier Price',
  suppliersWithProducts: 'Suppliers With Products', suppliersWithoutProducts: 'Suppliers Without Products',
};

export default function SupplierDashboard() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await superAdminService.getSupplierNetworkDashboard(); setData(response?.data || response); } catch (e) { setError(getUserFacingErrorMessage(e, 'Unable to load supplier dashboard.')); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  return <div className="space-y-6"><header className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Supplier Dashboard</h1><p className="text-sm text-gray-500">Current supplier-network operations.</p></div><button onClick={load} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4"><FiRefreshCw /> Refresh</button></header>{error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error} <button onClick={load} className="underline">Retry</button></div>}{loading ? <div role="status" aria-label="Loading dashboard" className="h-48 animate-pulse rounded-xl bg-white" /> : !error && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(labels).map(([key,label]) => <article key={key} className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold">{key === 'averageSupplierPrice' && data?.[key] != null ? `₹${Number(data[key]).toFixed(2)}` : Number(data?.[key] || 0).toLocaleString('en-IN')}</p></article>)}</div>}</div>;
}
