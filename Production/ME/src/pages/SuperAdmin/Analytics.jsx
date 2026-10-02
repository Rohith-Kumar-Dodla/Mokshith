import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FiRefreshCw } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import DataTable from '../../components/superadmin/DataTable';
import superAdminService from '../../services/superAdminService';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';

const localDate = (date = new Date()) => date.toLocaleDateString('en-CA');
const money = (value) => value == null ? 'Cost data unavailable' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value));
const inputClass = 'min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-sm';

export default function Analytics() {
  const [startDate, setStartDate] = useState(localDate());
  const [endDate, setEndDate] = useState(localDate());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await superAdminService.getReportAnalysis({ startDate, endDate }); setData(response?.data ?? response); }
    catch (loadError) { setError(getUserFacingErrorMessage(loadError, 'Failed to load report analysis')); }
    finally { setLoading(false); }
  }, [startDate, endDate]);
  useEffect(() => { load(); }, [load]);

  const setPreset = (preset) => {
    const now = new Date(), start = new Date(now);
    if (preset === 'yesterday') { start.setDate(now.getDate() - 1); setStartDate(localDate(start)); setEndDate(localDate(start)); }
    else if (preset === 'week') { start.setDate(now.getDate() - 6); setStartDate(localDate(start)); setEndDate(localDate(now)); }
    else if (preset === 'month') { start.setDate(1); setStartDate(localDate(start)); setEndDate(localDate(now)); }
    else { setStartDate(localDate(now)); setEndDate(localDate(now)); }
  };

  const sales = data?.sales || {}, payments = data?.payments || {}, procurement = data?.procurement || {}, financial = data?.financial || {};
  const cards = [
    ['Orders', sales.orders], ['Products Sold', sales.productsSold], ['Customers', sales.customersWithOrders], ['Customer Revenue', money(financial.revenue)],
    ['Gross Sales', money(sales.grossSales)], ['Refunds', money(financial.refunds)], ['Discounts', money(sales.discounts)], ['Tax', money(sales.tax)],
    ['Net Sales', money(sales.netSales)], ['Payments Received', money(payments.received)], ['Pending Payments', money(payments.pending)],
    ['Supplier Procurement Spending', money(procurement.procurementCost)], ['Gross Margin', money(financial.grossMargin)], ['Cost Coverage', `${financial.costCoveragePercent ?? 0}%`],
  ];
  const productColumns = [
    { key: 'name', label: 'Product' }, { key: 'unitsSold', label: 'Units Sold' }, { key: 'orders', label: 'Orders' },
    { key: 'revenue', label: 'Revenue', render: money }, { key: 'discount', label: 'Discount', render: money },
    { key: 'supplier', label: 'Supplier', render: (value) => value || 'Unallocated' },
    { key: 'supplierCost', label: 'Supplier Cost', render: money }, { key: 'margin', label: 'Margin', render: money },
  ];
  const productTable = (title, rows) => <section className="overflow-x-auto rounded-xl border bg-white p-4"><h2 className="mb-4 font-semibold">{title}</h2>{rows?.length ? <DataTable columns={productColumns} data={rows} /> : <p className="text-sm text-gray-500">No product sales in this period.</p>}</section>;

  return <div className="space-y-6">
    <PageHeader title="Report Analysis" subtitle="Operational and financial analysis from authoritative records." actions={<button type="button" onClick={load} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4"><FiRefreshCw /> Refresh</button>} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
      <div className="flex flex-wrap gap-2">{[['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'This Week'], ['month', 'This Month']].map(([key, label]) => <button key={key} type="button" onClick={() => setPreset(key)} className="min-h-[44px] rounded-lg border px-3 text-sm">{label}</button>)}</div>
      <label className="text-xs text-gray-500">From<input className={inputClass} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
      <label className="text-xs text-gray-500">To<input className={inputClass} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
      <p className="text-sm text-gray-600">Selected period: {startDate} to {endDate} (Asia/Kolkata)</p>
    </div>
    {loading ? <p className="text-sm text-gray-500">Loading report analysis…</p> : <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-xl font-semibold">{value ?? 0}</p></div>)}</div>
      {financial.isPartial && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Profit analysis is partial: authoritative supplier-cost coverage exists for {financial.ordersWithCost || 0} of {financial.totalOrders || 0} orders. Missing costs are not estimated.</div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-4"><h2 className="mb-4 font-semibold">Daily revenue, supplier cost and profit/loss</h2>{data?.salesTrend?.length ? <ResponsiveContainer width="100%" height={280}><LineChart data={data.salesTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Line dataKey="revenue" name="Revenue" stroke="#2563eb" /><Line dataKey="supplierCost" name="Supplier Cost" stroke="#f59e0b" /><Line dataKey="profitLoss" name="Profit/Loss" stroke="#10b981" /></LineChart></ResponsiveContainer> : <p className="text-sm text-gray-500">No sales in this period.</p>}</section>
        <section className="rounded-xl border bg-white p-4"><h2 className="mb-4 font-semibold">Payment methods</h2>{data?.paymentMethods?.length ? <ResponsiveContainer width="100%" height={280}><BarChart data={data.paymentMethods}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="method" /><YAxis /><Tooltip /><Bar dataKey="amount" fill="#2563eb" /><Bar dataKey="count" fill="#10b981" /></BarChart></ResponsiveContainer> : <p className="text-sm text-gray-500">No payments in this period.</p>}</section>
      </div>
      {productTable('Top selling products', data?.topSellingProducts)}
      {productTable('Low selling products', data?.lowSellingProducts)}
      <section className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Supplier procurement</h2><p className="mt-3 text-sm">{procurement.allocations || 0} allocations · {procurement.quantitySourced || 0} units · {money(procurement.procurementCost)}</p><p className="mt-2 text-sm text-gray-500">Supplier payments: No authoritative supplier payment records exist. Payment execution remains deferred to V3.</p></section>
    </>}
  </div>;
}
