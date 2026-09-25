import React, { useEffect, useMemo, useState } from 'react';
import supplierOrderService from '../../services/supplierOrderService';

const unwrap = (payload) => payload?.data ?? payload;

export default function ProcurementPanel({ orderId }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true); setError('');
    supplierOrderService.getEligibleForOrder(orderId).then((payload) => {
      if (!mounted) return;
      const next = unwrap(payload);
      setData(next);
      const defaults = {};
      (next?.items || []).forEach((item) => {
        const recommended = item.suppliers?.find((row) => String(row.supplierId) === String(item.recommendedSupplierId)) || item.suppliers?.[0];
        if (recommended) defaults[item.productId] = recommended;
      });
      setSelected(defaults);
    }).catch((loadError) => mounted && setError(loadError?.response?.data?.message || 'Unable to load supplier options.')).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [orderId]);

  const ready = useMemo(() => data?.items?.length > 0 && data.items.every((item) => selected[item.productId]), [data, selected]);

  const sendOrders = async () => {
    setSaving(true); setError('');
    try {
      const result = unwrap(await supplierOrderService.create({
        customerOrderId: orderId,
        selections: data.items.map((item) => ({ productId: item.productId, supplierId: selected[item.productId].supplierId, supplierProductId: selected[item.productId].mappingId, quantity: item.quantity, recommendedSupplierId: item.recommendedSupplierId, recommendationPrice: item.recommendationPrice })),
      }));
      for (const supplierOrder of result || []) {
        const generated = unwrap(await supplierOrderService.generateWhatsApp(supplierOrder._id));
        if (generated?.whatsappUrl && typeof window !== 'undefined') {
          window.open(generated.whatsappUrl, '_blank', 'noopener,noreferrer');
          await supplierOrderService.markWhatsAppOpened(supplierOrder._id);
        }
      }
      setData((current) => ({ ...current, existing: [...(result || []), ...(current?.existing || [])] }));
    } catch (saveError) {
      setError(saveError?.response?.data?.message || saveError?.message || 'Unable to create supplier orders.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="rounded-lg border p-3 text-sm text-gray-500">Loading supplier options...</div>;
  return <div className="rounded-lg border p-3 space-y-3">
    <div className="flex items-center justify-between gap-2"><h4 className="font-semibold text-gray-900">Procurement</h4><span className="text-xs text-gray-500">Supplier prices are internal</span></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {(data?.items || []).map((item) => <div key={String(item.productId)} className="border-t pt-3 space-y-2">
      <div className="flex justify-between gap-2 text-sm"><span>{item.productName} × {item.quantity}</span><span>Recommended: {item.recommendationPrice ? `₹${item.recommendationPrice}` : 'Unavailable'}</span></div>
      <select aria-label={`Supplier for ${item.productName}`} value={selected[item.productId]?.mappingId || ''} onChange={(event) => setSelected((current) => ({ ...current, [item.productId]: item.suppliers.find((row) => String(row.mappingId) === event.target.value) }))} className="w-full min-h-[40px] rounded border px-2 text-sm">
        <option value="">Select supplier</option>{(item.suppliers || []).map((supplier) => <option key={supplier.mappingId} value={supplier.mappingId}>{supplier.supplierName} · ₹{supplier.currentSupplierPrice} · MOQ {supplier.minimumOrderQuantity}</option>)}
      </select>
    </div>)}
    {data?.items?.length === 0 && <p className="text-sm text-gray-500">No eligible supplier mappings found.</p>}
    <button type="button" disabled={!ready || saving} onClick={sendOrders} className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-gray-300">{saving ? 'Sending...' : 'Send Order to Supplier'}</button>
    {(data?.existing || []).length > 0 && <div className="border-t pt-3 space-y-2"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Supplier order history</p>{data.existing.map((row) => <div key={row._id} className="flex flex-wrap justify-between gap-2 text-sm"><span>{row.supplierOrderNumber}</span><span>{row.status} · ₹{row.totalSupplierCost}</span></div>)}</div>}
  </div>;
}
