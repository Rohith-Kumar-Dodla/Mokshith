import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiDollarSign, FiInfo } from 'react-icons/fi';
import useDelivery from '../../hooks/useDelivery';

const money = (value) => Number.isFinite(Number(value)) ? `₹${Number(value).toLocaleString('en-IN')}` : 'Unavailable';

const Earnings = () => {
  const { history, analytics, loading, error } = useDelivery();
  const backend = analytics?.backend || {};
  const cards = [
    ['Today', backend.todayEarnings ?? analytics?.today?.todaysEarnings, FiDollarSign],
    ['This Week', backend.weekEarnings ?? analytics?.today?.weeklyEarnings, FiCalendar],
    ['This Month', backend.monthEarnings ?? analytics?.today?.monthlyEarnings, FiCalendar],
  ];

  if (loading && !analytics) return <div className="space-y-4"><div className="h-8 w-1/2 animate-pulse rounded bg-gray-200" /><div className="h-32 animate-pulse rounded-xl bg-gray-200" /></div>;
  if (error) return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;

  return <div className="space-y-5 sm:space-y-6">
    <header><h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Earnings</h1><p className="mt-1 text-sm text-gray-600">Server-authoritative delivery earnings only.</p></header>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{cards.map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"><Icon /></div><p className="text-sm text-gray-600">{label}</p><p className="mt-1 text-2xl font-bold text-gray-900">{money(value)}</p></div>)}</div>
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><FiInfo className="mt-0.5 shrink-0" /><p>Every delivery-level amount below comes from the stored delivery amount. Missing values are shown as unavailable and are not estimated from the order total.</p></div>
    {backend.earningsUnavailableCount > 0 ? <p className="text-sm text-amber-700">{backend.earningsUnavailableCount} historical delivery amount(s) are unavailable.</p> : null}
    <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-gray-900">Delivery-level earnings</h2><p className="text-sm text-gray-600">Recent completed and terminal delivery records.</p></div><Link to="/delivery/history" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">History <FiArrowRight /></Link></div>{history.length === 0 ? <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No delivery earnings available yet.</div> : <div className="divide-y divide-gray-100">{history.slice(0, 20).map((item) => <div key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-gray-900">{item.id}</p><p className="text-sm text-gray-600">{item.vendor} · {item.completedAt ? new Date(item.completedAt).toLocaleDateString('en-IN') : 'Date unavailable'}</p></div><p className="font-semibold text-green-700">{money(item.deliveryAmount)}</p></div>)}</div>}</section>
  </div>;
};

export default Earnings;
