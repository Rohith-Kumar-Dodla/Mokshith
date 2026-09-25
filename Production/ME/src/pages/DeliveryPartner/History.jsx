import React, { useCallback, useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import StatusBadge from '../../components/delivery/StatusBadge';
import deliveryService from '../../services/deliveryService';
import { mapDeliveryHistory } from '../../utils/deliveryMapper';

const money = (value) => value == null ? 'Unavailable' : `₹${Number(value).toLocaleString('en-IN')}`;

const History = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async (page = 1) => {
    setLoading(true); setError(null);
    try {
      const payload = await deliveryService.getDeliveryHistory({ page, limit: 10, ...(search ? { search } : {}), ...(status ? { status } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) });
      const data = payload?.data ?? payload;
      setItems(mapDeliveryHistory(data));
      setPagination(data?.pagination || { page, limit: 10, total: data?.length || 0, totalPages: data?.length ? 1 : 0 });
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError.message || 'Unable to load delivery history.');
    } finally { setLoading(false); }
  }, [search, status, from, to]);

  useEffect(() => { const timer = window.setTimeout(() => loadHistory(1), 250); return () => window.clearTimeout(timer); }, [loadHistory]);

  return <div className="space-y-5 sm:space-y-6">
    <header><h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">History</h1><p className="mt-1 text-sm text-gray-600">Search and filter server-backed delivery history.</p></header>
    <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"><div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4"><label className="relative block lg:col-span-2"><span className="sr-only">Search history</span><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, tracking..." className="min-h-[44px] w-full rounded-lg border border-gray-300 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></label><label><span className="sr-only">Status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">All statuses</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option><option value="FAILED">Failed</option></select></label><button type="button" onClick={() => { setSearch(''); setStatus(''); setFrom(''); setTo(''); }} className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">Clear filters</button><label className="text-xs text-gray-600">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm" /></label><label className="text-xs text-gray-600">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm" /></label></div></section>
    {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}<button type="button" onClick={() => loadHistory(pagination.page)} className="ml-3 font-semibold underline">Retry</button></div> : null}
    {loading ? <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">Loading history...</div> : items.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center"><p className="font-semibold text-gray-800">No delivery history found</p><p className="mt-1 text-sm text-gray-500">Try a different search, date range, or status.</p></div> : <section className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-bold text-gray-900">{item.id}</h2><p className="text-sm text-gray-600">{item.vendor || 'Customer'} · {item.deliveryLocation || 'Destination unavailable'}</p></div><StatusBadge status={item.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><p className="text-gray-500">Date</p><p className="font-medium text-gray-900">{item.date ? new Date(item.date).toLocaleDateString('en-IN') : 'Unavailable'}</p></div><div><p className="text-gray-500">Distance</p><p className="font-medium text-gray-900">{item.distanceKm == null ? 'Unavailable' : `${item.distanceKm} ${item.distanceUnit || 'km'}`}</p></div><div><p className="text-gray-500">Delivery earnings</p><p className="font-semibold text-green-700">{money(item.deliveryAmount)}</p></div><div><p className="text-gray-500">Order total</p><p className="font-medium text-gray-900">{money(item.orderAmount)}</p></div></div></article>)}</section>}
    {!loading && pagination.totalPages > 1 ? <nav aria-label="History pagination" className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3"><button type="button" disabled={pagination.page <= 1} onClick={() => loadHistory(pagination.page - 1)} className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40"><FiChevronLeft /> Previous</button><span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</span><button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => loadHistory(pagination.page + 1)} className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40">Next <FiChevronRight /></button></nav> : null}
  </div>;
};

export default History;
