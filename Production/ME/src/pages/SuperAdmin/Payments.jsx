import { useCallback, useEffect, useState } from 'react';
import { FiEye, FiRefreshCw, FiX } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import superAdminService from '../../services/superAdminService';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
const today = () => new Date().toLocaleDateString('en-CA');
const input = 'min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-sm';

export default function Payments() {
  const [type, setType] = useState('customer'); const [date, setDate] = useState(today()); const [method, setMethod] = useState(''); const [status, setStatus] = useState(''); const [search, setSearch] = useState('');
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [selected, setSelected] = useState(null);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await superAdminService.getTransactions({ type, startDate: date, endDate: date, method: method || undefined, status: status || undefined, customer: search || undefined }); setData(response?.data ?? response); } catch (e) { setError(getUserFacingErrorMessage(e, 'Failed to load transactions')); } finally { setLoading(false); } }, [type, date, method, status, search]);
  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [load]);
  const summary = data?.summary || {}; const rows = data?.transactions || [];
  const columns = [
    { key: 'createdAt', label: 'Date / Time', render: (v) => new Date(v).toLocaleString('en-IN') },
    { key: 'userId', label: 'Customer', render: (v) => v?.name || '—' },
    { key: 'order', label: 'Order', render: (v) => v?._id ? `…${String(v._id).slice(-8)}` : '—' },
    { key: 'paymentMethod', label: 'Method' }, { key: 'amount', label: 'Amount', render: money },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v).toLowerCase()} /> },
    { key: 'actions', label: 'Actions', render: (_, row) => <button type="button" onClick={() => setSelected(row)} className="inline-flex min-h-[44px] items-center gap-1 text-blue-600"><FiEye /> View Details</button> },
  ];
  return <div className="space-y-6">
    <PageHeader title="Payments / Transactions" subtitle="Read-only customer and supplier-side financial monitoring from authoritative records." actions={<button type="button" onClick={load} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4"><FiRefreshCw /> Refresh</button>} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
      <select className={input} value={type} onChange={(e) => setType(e.target.value)} aria-label="Payment type"><option value="customer">Customer Payments</option><option value="supplier">Supplier Payments</option></select>
      <input className={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Transaction date" />
      {type === 'customer' && <><select className={input} value={method} onChange={(e) => setMethod(e.target.value)}><option value="">All methods</option>{['ONLINE','COD','CREDIT','HYBRID'].map((x) => <option key={x}>{x}</option>)}</select><select className={input} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{['SUCCESS','PENDING','INITIATED','FAILED'].map((x) => <option key={x}>{x}</option>)}</select><input className={`${input} flex-1`} placeholder="Search customer" value={search} onChange={(e) => setSearch(e.target.value)} /></>}
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">{[['Transactions',summary.totalTransactions],['Total',money(summary.totalAmount)],['Paid',money(summary.paidAmount)],['Pending',money(summary.pendingAmount)],['Failed',money(summary.failedAmount)],['Refunded',money(summary.refundedAmount)]].map(([label,value]) => <div key={label} className="rounded-xl border bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-lg font-semibold">{value ?? 0}</p></div>)}</div>
    <div className="overflow-x-auto rounded-xl border bg-white p-4">{loading ? <p className="text-sm text-gray-500">Loading transactions…</p> : type === 'supplier' ? <div className="py-10 text-center"><p className="font-medium">No supplier payments recorded yet.</p><p className="mt-1 text-sm text-gray-500">Supplier payment execution will be available in V3.</p></div> : rows.length ? <DataTable columns={columns} data={rows} /> : <p className="py-10 text-center text-sm text-gray-500">No customer payments found for this date.</p>}</div>
    {selected && <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true"><div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Payment details</h2><button type="button" onClick={() => setSelected(null)} className="min-h-[44px] min-w-[44px]"><FiX /></button></div><dl className="mt-6 grid grid-cols-2 gap-4 text-sm">{[['Customer',selected.userId?.name],['Order',selected.order?._id],['Invoice',selected.invoice?.invoiceNumber],['Amount',money(selected.amount)],['Method',selected.paymentMethod],['Status',selected.status],['Created',new Date(selected.createdAt).toLocaleString('en-IN')],['Transaction ID',selected.transactionId],['Razorpay ID',selected.razorpayPaymentId],['Bank UTR',selected.paymentProof?.utrNumber],['Proof status',selected.paymentProof?.status],['COD collected',selected.cod?.collectedAt ? new Date(selected.cod.collectedAt).toLocaleString('en-IN') : null],['Delivery partner',selected.logistics?.deliveryPartnerId?.name],['Refunds',selected.refunds?.length ? `${selected.refunds.length} (${money(selected.refunds.reduce((s,r) => s + r.amount, 0))})` : null]].map(([k,v]) => <div key={k}><dt className="text-gray-500">{k}</dt><dd className="mt-1 break-words font-medium">{v || '—'}</dd></div>)}</dl>{(selected.cod?.proof || selected.paymentProof?.screenshot) && <a className="mt-6 inline-flex min-h-[44px] items-center text-blue-600" href={selected.cod?.proof || selected.paymentProof?.screenshot} target="_blank" rel="noreferrer">View proof</a>}</div></div>}
  </div>;
}
