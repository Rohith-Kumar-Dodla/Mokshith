import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/superadmin/PageHeader';
import AdminOrderManagement from '../../components/admin/AdminOrderManagement';
import orderService from '../../services/orderService';
import Card from '../../components/admin/Card';
import useViewport from '../../hooks/useViewport';

const MobileOrders = ({ title, subtitle }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const resp = await orderService.getAllOrders({ limit: 20 });
        const payload = resp?.orders ?? resp;
        if (!mounted) return;
        setOrders(Array.isArray(payload) ? payload : payload?.orders || []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load orders');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={subtitle} />
      {loading ? <p className="text-sm text-gray-500">Loading orders...</p> : null}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="space-y-3">
        {orders.map((o) => (
          <Card key={o.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{o.vendor || 'Vendor'}</p>
                <p className="text-xs text-gray-500">Order: {String(o.orderNumber || o.id).slice(-8)}</p>
                <p className="text-xs text-gray-500 mt-1">Amount: ₹{o.amount?.toLocaleString() ?? '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{o.status}</p>
                <p className="text-sm font-medium text-gray-900">{o.date || '—'}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Orders = () => {
  const { isMobile } = useViewport();
  return isMobile ? (
    <MobileOrders title="Global Orders" subtitle="Manage all platform orders across regions" />
  ) : (
    <AdminOrderManagement
      PageHeader={PageHeader}
      title="Global Orders"
      subtitle="Manage all platform orders across regions"
    />
  );
};

export default Orders;
