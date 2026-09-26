import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiPackage, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import Modal from '../../components/superadmin/Modal';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import StatusBadge from '../../components/superadmin/StatusBadge';
import superAdminService from '../../services/superAdminService';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { mapSupplierCategoryProductsResponse } from '../../utils/supplierMapper';

const statusOptions = [{ label: 'All Status', value: 'all' }, { label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }];
const blankForm = { productId: '', quantity: '0', minimumOrderQuantity: '1', supplierPrice: '', availabilityStatus: 'ACTIVE', notes: '' };
const fieldClass = 'mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';
const dataOf = (response) => response?.data ?? response ?? {};
const money = (value) => value == null ? 'Not configured' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

export default function SupplierCategoryProducts() {
  const { supplierId, categoryId } = useParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerProducts, setPickerProducts] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await superAdminService.getSupplierCategoryProducts(supplierId, categoryId, { page, limit: 12, search: search || undefined, status });
      setResult(mapSupplierCategoryProductsResponse(response));
    } catch (err) { setError(getUserFacingErrorMessage(err, 'Unable to load supplier products.')); }
    finally { setLoading(false); }
  }, [supplierId, categoryId, page, search, status]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { setPage(1); }, [search, status]);
  useEffect(() => {
    if (mode !== 'add') return undefined;
    let active = true;
    const timer = setTimeout(async () => {
      setPickerLoading(true); setFormError('');
      try {
        const response = await superAdminService.searchSupplierProducts(supplierId, { search: pickerSearch, categoryId, limit: 20 });
        if (active) setPickerProducts(dataOf(response).products || []);
      } catch (err) { if (active) setFormError(getUserFacingErrorMessage(err, 'Unable to search products.')); }
      finally { if (active) setPickerLoading(false); }
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [mode, pickerSearch, supplierId, categoryId]);

  const openAdd = () => { setForm(blankForm); setPickerSearch(''); setFormError(''); setMode('add'); };
  const openEdit = (mapping) => {
    setSelected(mapping);
    setForm({ productId: mapping.product.id, quantity: String(mapping.quantity), minimumOrderQuantity: String(mapping.minimumOrderQuantity), supplierPrice: mapping.supplierPrice == null ? '' : String(mapping.supplierPrice), availabilityStatus: mapping.status, notes: mapping.notes || '' });
    setFormError(''); setMode('edit');
  };
  const close = () => { if (!saving) { setMode(null); setSelected(null); setFormError(''); } };
  const validate = () => {
    if (mode === 'add' && !form.productId) return 'Select an existing product.';
    if (!Number.isInteger(Number(form.minimumOrderQuantity)) || Number(form.minimumOrderQuantity) < 1) return 'MOQ must be a positive whole number.';
    if (form.supplierPrice !== '' && (!Number.isFinite(Number(form.supplierPrice)) || Number(form.supplierPrice) <= 0)) return 'Supplier price must be greater than 0.';
    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) return 'Supplier quantity must be a non-negative integer.';
    return '';
  };
  const submit = async (event) => {
    event.preventDefault(); const message = validate(); if (message) { setFormError(message); return; }
    setSaving(true); setFormError('');
    try {
      if (mode === 'add') {
        await superAdminService.createSupplierCategoryProduct(supplierId, categoryId, { ...form, quantity: Number(form.quantity), minimumOrderQuantity: Number(form.minimumOrderQuantity), supplierPrice: form.supplierPrice === '' ? undefined : Number(form.supplierPrice) });
        setNotice('Product added to supplier successfully.');
      } else {
        const oldPrice = selected.supplierPrice == null ? '' : String(selected.supplierPrice);
        await superAdminService.updateSupplierCategoryProduct(supplierId, categoryId, selected.id, { quantity: Number(form.quantity), minimumOrderQuantity: Number(form.minimumOrderQuantity), availabilityStatus: form.availabilityStatus, notes: form.notes, ...(form.supplierPrice === '' || form.supplierPrice === oldPrice ? {} : { supplierPrice: Number(form.supplierPrice) }) });
        setNotice('Supplier product updated successfully.');
      }
      setMode(null); setSelected(null); await loadProducts();
    } catch (err) { setFormError(getUserFacingErrorMessage(err, 'Unable to save supplier product.')); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    setSaving(true); setFormError('');
    try {
      await superAdminService.removeSupplierCategoryProduct(supplierId, categoryId, selected.id);
      setNotice('Product removed from this supplier. The global product remains in the catalog.');
      setMode(null); setSelected(null); await loadProducts();
    } catch (err) { setFormError(getUserFacingErrorMessage(err, 'Unable to remove supplier product.')); }
    finally { setSaving(false); }
  };

  return <div className="min-w-0 space-y-6">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-gray-500"><Link to="/supplier-dashboard">Supplier Dashboard</Link><span>/</span><Link to="/supplier-dashboard/suppliers">Suppliers</Link>{result && <><span>/</span><Link to={`/supplier-dashboard/suppliers/${supplierId}`}>{result.supplier.supplierName}</Link><span>/</span><span aria-current="page" className="text-gray-900">{result.category.name}</span></>}</nav>
    <Link to={`/supplier-dashboard/suppliers/${supplierId}`} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-blue-700"><FiArrowLeft aria-hidden="true" /> Back to Supplier</Link>
    {result && <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-blue-700">{result.supplier.supplierName}</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{result.category.name}</h1><p className="mt-2 text-sm text-gray-500">{result.total} Supplier Product{result.total === 1 ? '' : 's'}</p></div><button type="button" onClick={openAdd} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-white"><FiPlus /> Add Product</button></header>}
    {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
    <div className="flex flex-col gap-3 lg:flex-row"><div className="min-w-0 flex-1"><SearchBar placeholder="Search products..." value={search} onSearch={setSearch} /></div><div className="flex flex-wrap gap-3"><FilterDropdown label="Status" options={statusOptions} selected={status} onSelect={setStatus} onClear={() => setStatus('all')} /><button type="button" onClick={loadProducts} disabled={loading} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 disabled:opacity-50"><FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh</button></div></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{error}</p><button type="button" onClick={loadProducts} className="mt-3 rounded-lg border px-3 py-2">Retry</button></div>}
    {loading ? <div role="status" aria-label="Loading supplier products" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((key) => <div key={key} className="h-64 animate-pulse rounded-xl border bg-white" />)}</div> : !error && result?.products.length === 0 ? <div className="rounded-xl border bg-white p-8 text-center"><FiPackage className="mx-auto text-gray-400" size={30} /><h2 className="mt-3 font-semibold">No supplier products found</h2><p className="mt-2 text-sm text-gray-500">This supplier currently has no products under this category.</p><button type="button" onClick={openAdd} className="mt-4 min-h-[44px] rounded-lg bg-blue-600 px-4 text-white">Add Product</button></div> : !error && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{result?.products.map((mapping) => <article key={mapping.id} aria-label={mapping.product.name} className="min-w-0 rounded-xl border bg-white p-5 shadow-sm"><div className="flex gap-4">{mapping.product.imageUrl ? <img src={mapping.product.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100"><FiPackage /></div>}<div className="min-w-0"><h2 className="truncate text-lg font-semibold">{mapping.product.name}</h2>{mapping.product.sku && <p className="text-xs text-gray-500">SKU: {mapping.product.sku}</p>}<StatusBadge status={mapping.status.toLowerCase()} /></div></div><dl className="mt-5 grid gap-3 text-sm"><div><dt className="text-gray-500">Category</dt><dd className="font-medium">{result.category.name}</dd></div><div><dt className="text-gray-500">Supplier</dt><dd className="font-medium">{result.supplier.supplierName}</dd></div><div className="grid grid-cols-2 gap-3"><div><dt className="text-gray-500">Supplier Price</dt><dd className="font-semibold">{money(mapping.supplierPrice)}</dd></div><div><dt className="text-gray-500">MOQ</dt><dd className="font-semibold">{mapping.minimumOrderQuantity}</dd></div></div></dl><div className="mt-5 flex gap-2 border-t pt-4"><button type="button" onClick={() => openEdit(mapping)} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 text-blue-700"><FiEdit2 /> Edit</button><button type="button" onClick={() => { setSelected(mapping); setFormError(''); setMode('remove'); }} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 text-red-700"><FiTrash2 /> Remove</button></div></article>)}</div>}
    {!loading && !error && result?.pages > 1 && <nav aria-label="Supplier product pagination" className="flex justify-end gap-3"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-50">Previous</button><span>Page {result.page} of {result.pages}</span><button disabled={page >= result.pages} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-50">Next</button></nav>}
    <Modal isOpen={mode === 'add' || mode === 'edit'} onClose={close} title={mode === 'add' ? 'Add Existing Product' : 'Edit Supplier Product'} size="lg"><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Supplier<input readOnly value={result?.supplier.supplierName || ''} className={`${fieldClass} bg-gray-100`} /></label><label className="text-sm font-medium">Category<input readOnly value={result?.category.name || ''} className={`${fieldClass} bg-gray-100`} /></label></div>{mode === 'add' ? <><label className="block text-sm font-medium">Search existing products<input value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} className={fieldClass} placeholder="Product name or SKU" /></label><label className="block text-sm font-medium">Product<select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className={fieldClass}><option value="">{pickerLoading ? 'Searching...' : 'Select a product'}</option>{pickerProducts.map((product) => <option key={product._id} value={product._id} disabled={product.alreadyMapped}>{product.name}{product.sku ? ` (${product.sku})` : ''}{product.alreadyMapped ? ' — already mapped' : ''}</option>)}</select></label></> : <label className="block text-sm font-medium">Product<input readOnly value={selected?.product.name || ''} className={`${fieldClass} bg-gray-100`} /></label>}<div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Supplier Price (₹)<input type="number" min="0.01" step="0.01" value={form.supplierPrice} onChange={(e) => setForm({ ...form, supplierPrice: e.target.value })} className={fieldClass} /></label><label className="text-sm font-medium">Quantity<input required type="number" min="0" step="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={fieldClass} /></label><label className="text-sm font-medium">MOQ<input required type="number" min="1" step="1" value={form.minimumOrderQuantity} onChange={(e) => setForm({ ...form, minimumOrderQuantity: e.target.value })} className={fieldClass} /></label><label className="text-sm font-medium">Status<select value={form.availabilityStatus} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })} className={fieldClass}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div><label className="block text-sm font-medium">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={fieldClass} rows="3" /></label>{formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={close} disabled={saving} className="min-h-[44px] rounded-lg border px-4">Cancel</button><button disabled={saving} className="min-h-[44px] rounded-lg bg-blue-600 px-4 text-white disabled:opacity-50">{saving ? 'Saving...' : mode === 'add' ? 'Add Product' : 'Save Changes'}</button></div></form></Modal>
    <Modal isOpen={mode === 'remove'} onClose={close} title="Remove Supplier Product"><p>Remove this product from this supplier?</p><p className="mt-2 text-sm text-gray-500">The global product will remain available in the catalog.</p>{formError && <p role="alert" className="mt-3 text-sm text-red-700">{formError}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={close} disabled={saving} className="min-h-[44px] rounded-lg border px-4">Cancel</button><button type="button" onClick={remove} disabled={saving} className="min-h-[44px] rounded-lg bg-red-600 px-4 text-white disabled:opacity-50">{saving ? 'Removing...' : 'Remove Product'}</button></div></Modal>
  </div>;
}
