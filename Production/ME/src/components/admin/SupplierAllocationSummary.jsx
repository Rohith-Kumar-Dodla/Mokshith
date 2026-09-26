import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import allocationService from '../../services/supplierAllocationService';

export default function SupplierAllocationSummary({ orderId }) {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setData(null);
    setError('');
    allocationService.getForOrder(orderId)
      .then((next) => mounted && setData(next))
      .catch((err) => mounted && setError(err?.response?.data?.message || 'Unable to load supplier allocation.'));
    return () => { mounted = false; };
  }, [orderId]);

  const isSuperAdmin = location.pathname.startsWith('/super-admin');
  const allocationPath = `${isSuperAdmin ? '/super-admin' : '/admin'}/supplier-allocation`;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  if (!data) return <div className="rounded-lg border p-3 text-sm text-gray-500">Loading supplier allocation...</div>;

  const items = Array.isArray(data.items) ? data.items : [];
  const requests = Array.isArray(data.requests) ? data.requests : [];
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h4 className="font-semibold text-gray-900">Supplier Allocation</h4><p className="text-xs text-gray-500">{String(data.status || 'NOT_ALLOCATED').replaceAll('_', ' ')}</p></div>
        <Link to={`${allocationPath}?orderId=${encodeURIComponent(orderId)}`} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">Manage Allocation</Link>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded bg-gray-50 p-2"><strong className="block text-base">{items.length}</strong>Products</div><div className="rounded bg-gray-50 p-2"><strong className="block text-base">{items.filter((item) => item.allocatedQuantity > 0).length}</strong>Started</div><div className="rounded bg-gray-50 p-2"><strong className="block text-base">{items.filter((item) => item.remainingQuantity === 0).length}</strong>Complete</div></div>
      {requests.length > 0 && <p className="text-xs text-gray-600">Supplier requests: {requests.length} · {requests[0].status || 'ASSIGNED'}</p>}
      <p className="text-xs text-gray-500">Supplier prices and allocation details are available only to authorized staff.</p>
    </div>
  );
}
