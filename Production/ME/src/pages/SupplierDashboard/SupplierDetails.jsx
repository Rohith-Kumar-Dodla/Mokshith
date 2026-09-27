import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiRefreshCw } from 'react-icons/fi';
import StatusBadge from '../../components/superadmin/StatusBadge';
import Modal from '../../components/superadmin/Modal';
import superAdminService from '../../services/superAdminService';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { mapSupplier } from '../../utils/supplierMapper';

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function SupplierDetails() {
  const { supplierId } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({});

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

  const openEdit = () => {
    setFeedback('');
    const clean = (value) => value === '—' ? '' : value;
    setForm({ supplierName: clean(supplier.supplierName), companyName: clean(supplier.companyName), contactPerson: clean(supplier.contactPerson), phone: clean(supplier.phone), email: clean(supplier.email), gstNumber: clean(supplier.gstNumber), businessAddress: clean(supplier.businessAddress) });
    setEditing(true);
  };

  const saveSupplier = async (event) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(form.phone || '')) { setFeedback('Phone number must be exactly 10 digits.'); return; }
    setSaving(true); setFeedback('');
    try {
      await superAdminService.updateSupplier(supplierId, form);
      setEditing(false); setFeedback('Supplier information updated.');
      await loadSupplier();
    } catch (err) { setFeedback(getUserFacingErrorMessage(err, 'Unable to update supplier information.')); }
    finally { setSaving(false); }
  };

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
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-gray-900">Supplier Information</h2><button type="button" onClick={openEdit} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 text-sm font-medium text-blue-700"><FiEdit2 /> Edit</button></div><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">Contact person</dt><dd className="mt-1 font-medium text-gray-900">{supplier.contactPerson}</dd></div><div><dt className="text-gray-500">Phone</dt><dd className="mt-1 font-medium text-gray-900">{supplier.phone}</dd></div><div><dt className="text-gray-500">Email</dt><dd className="mt-1 break-words font-medium text-gray-900">{supplier.email}</dd></div><div><dt className="text-gray-500">GST number</dt><dd className="mt-1 font-medium text-gray-900">{supplier.gstNumber}</dd></div><div className="sm:col-span-2"><dt className="text-gray-500">Business address</dt><dd className="mt-1 font-medium text-gray-900">{supplier.businessAddress}</dd></div><div><dt className="text-gray-500">Created</dt><dd className="mt-1 font-medium text-gray-900">{formatDate(supplier.createdAt)}</dd></div></dl></section>
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-gray-900">Associated Categories</h2>{supplier.categories.length === 0 ? <p className="mt-4 text-sm text-gray-500">No categories are associated with this supplier.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{supplier.categories.map((category) => <Link key={category.id} to={`/supplier-dashboard/suppliers/${supplier.id}/categories/${category.categoryId}`} className="group rounded-lg border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><h3 className="font-semibold text-gray-900">{category.name}</h3><p className="mt-2 text-sm text-gray-500">{category.productCount} Supplier Product{category.productCount === 1 ? '' : 's'}</p><p className="mt-2 text-xs font-medium text-gray-500">{category.status}</p><span className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-blue-700">View Products <span className="ml-1" aria-hidden="true">→</span></span></Link>)}</div>}</section>
      </div>
      {feedback && <p role="status" className="text-sm text-blue-700">{feedback}</p>}
      <Modal isOpen={editing} onClose={() => !saving && setEditing(false)} title="Edit Supplier Information" size="lg"><form onSubmit={saveSupplier} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">{[['supplierName','Supplier name'],['companyName','Company name'],['contactPerson','Contact person'],['phone','Phone'],['email','Email'],['gstNumber','GST number']].map(([key,label]) => <label key={key} className="text-sm font-medium">{label}<input required={['supplierName','companyName','phone'].includes(key)} type={key === 'email' ? 'email' : 'text'} value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 min-h-[44px] w-full rounded-lg border px-3" /></label>)}</div><label className="block text-sm font-medium">Business address<textarea value={form.businessAddress || ''} onChange={(event) => setForm({ ...form, businessAddress: event.target.value })} rows="3" className="mt-1 w-full rounded-lg border px-3 py-2" /></label>{feedback && <p role="alert" className="text-sm text-red-700">{feedback}</p>}<div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={() => setEditing(false)} className="min-h-[44px] rounded-lg border px-4">Cancel</button><button disabled={saving} className="min-h-[44px] rounded-lg bg-blue-600 px-4 text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button></div></form></Modal>
    </div>
  );
}
