import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight, FiCheckCircle, FiClock, FiDollarSign, FiPackage, FiRefreshCw, FiTruck } from 'react-icons/fi';
import Card from '../../components/admin/Card';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import adminService from '../../services/adminService';
import deliveryService from '../../services/deliveryService';
import inventoryService from '../../services/inventoryService';
import orderService from '../../services/orderService';
import { getUserFacingErrorMessage, unwrapApiList } from '../../utils/apiResponse';
import { extractAdminOrdersResponse, formatPaymentMethodLabel } from '../../utils/orderMapper';

const unwrapData = (payload) => payload?.data ?? payload ?? {};
const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const getOrderId = (order) => order?._id || order?.id;

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [attention, setAttention] = useState({ unassigned: [], rejected: [], lowStock: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      adminService.getStats(),
      orderService.getAllOrders({ page: 1, limit: 5 }),
      deliveryService.getDeliveryQueue(),
      inventoryService.getLowStockItems(),
    ]);
    const [statsResult, ordersResult, queueResult, lowStockResult] = results;
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length) setError(getUserFacingErrorMessage(failures[0].reason, 'Unable to load the Admin dashboard'));
    if (statsResult.status === 'fulfilled') setStats(unwrapData(statsResult.value));
    if (ordersResult.status === 'fulfilled') setRecentOrders(extractAdminOrdersResponse(ordersResult.value).orders.slice(0, 5));
    if (queueResult.status === 'fulfilled') {
      const queue = unwrapApiList(queueResult.value);
      setAttention((current) => ({
        ...current,
        unassigned: queue.filter((item) => !item.deliveryPartnerId && ['PENDING', 'REJECTED'].includes(String(item.status).toUpperCase())),
        rejected: queue.filter((item) => String(item.status).toUpperCase() === 'REJECTED'),
      }));
    }
    if (lowStockResult.status === 'fulfilled') setAttention((current) => ({ ...current, lowStock: unwrapApiList(lowStockResult.value) }));
    setLoading(false);
  };

  useEffect(() => { loadDashboard(); }, []);

  const cards = useMemo(() => [
    { label: 'Total Orders', value: stats?.totalOrders, icon: FiPackage, to: '/admin/orders' },
    { label: 'Pending Orders', value: stats?.pendingOrders, icon: FiClock, to: '/admin/orders?status=PENDING' },
    { label: 'COD Orders', value: stats?.codOrders, icon: FiDollarSign, to: '/admin/orders?paymentMethod=COD' },
    { label: 'Paid Orders', value: stats?.paidOrders, icon: FiCheckCircle, to: '/admin/orders?paymentStatus=PAID' },
    { label: 'Unassigned Deliveries', value: stats?.unassignedDeliveries, icon: FiTruck, to: '/admin/orders?deliveryFilter=unassigned' },
    { label: 'Active Deliveries', value: stats?.activeDeliveries, icon: FiTruck, to: '/admin/orders?deliveryFilter=active' },
    { label: 'Low Stock', value: stats?.lowStock, icon: FiAlertTriangle, to: '/admin/inventory' },
    { label: 'Delivery Attention', value: stats?.deliveryRejections, icon: FiAlertTriangle, to: '/admin/orders?deliveryFilter=attention' },
  ], [stats]);

  const unassigned = attention.unassigned.slice(0, 3);
  const rejected = attention.rejected.slice(0, 2);
  const lowStock = attention.lowStock.slice(0, 2);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Home" subtitle="Monitor orders, payments, inventory and delivery operations." actions={(
        <button type="button" onClick={loadDashboard} disabled={loading} className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
          <FiRefreshCw size={16} /> Refresh
        </button>
      )} />
      {error && <Card className="p-4 text-sm text-red-700 bg-red-50 border border-red-200">{error}</Card>}
      {loading && !stats ? (
        <Card className="p-8 text-center text-sm text-gray-600" aria-live="polite">Loading operational dashboard...</Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card) => (
              <Link key={card.label} to={card.to} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <Card className="h-full p-4 sm:p-5 hover:border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2"><div className="rounded-lg bg-blue-50 p-2 text-blue-600"><card.icon size={20} aria-hidden="true" /></div><FiArrowRight className="text-gray-400" size={16} aria-hidden="true" /></div>
                  <p className="mt-4 text-xs sm:text-sm text-gray-600">{card.label}</p><p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">{card.value ?? '—'}</p>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="text-lg font-bold text-gray-900">Operational attention</h2><p className="text-sm text-gray-600">Items that may need Admin action.</p></div><FiAlertTriangle className="text-amber-500" aria-hidden="true" /></div>
            <div className="space-y-3">
              {unassigned.length === 0 && rejected.length === 0 && lowStock.length === 0 ? <p className="text-sm text-gray-500">No operational attention items.</p> : <>
                {unassigned.map((item) => <div key={`unassigned-${item._id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 p-3"><div><p className="font-semibold text-gray-900">Order #{String(item.orderId?._id || item.orderId).slice(-8).toUpperCase()}</p><p className="text-xs text-gray-600">{item.address || 'Drop location unavailable'} · Unassigned</p></div><Link to="/admin/delivery-assignment" className="inline-flex items-center justify-center min-h-[40px] px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Assign Delivery</Link></div>)}
                {rejected.map((item) => <div key={`rejected-${item._id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 p-3"><div><p className="font-semibold text-gray-900">Order #{String(item.orderId?._id || item.orderId).slice(-8).toUpperCase()}</p><p className="text-xs text-red-700">Delivery assignment rejected{item.rejectionReason ? ` — ${item.rejectionReason}` : ''}</p></div><Link to="/admin/delivery-assignment?tab=unassigned" className="inline-flex items-center justify-center min-h-[40px] px-3 py-2 border border-red-200 text-red-700 rounded-lg text-sm">Review</Link></div>)}
                {lowStock.map((item) => <div key={`stock-${item._id || item.productId}`} className="flex items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3"><p className="text-sm text-gray-800">Low stock: {item.productId?.name || item.product?.name || 'Product'}</p><Link to="/admin/inventory" className="text-sm font-semibold text-blue-700">Review inventory</Link></div>)}
              </>}
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 p-4 sm:p-6"><div><h2 className="text-lg font-bold text-gray-900">Recent orders</h2><p className="text-sm text-gray-600">Latest orders requiring operational visibility.</p></div><Link to="/admin/orders" className="text-sm font-semibold text-blue-700">View all</Link></div>
            {recentOrders.length === 0 ? <p className="px-4 pb-6 text-sm text-gray-500">No recent orders.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-gray-50 border-y"><tr>{['Order', 'Customer', 'Amount', 'Payment', 'Status', 'Delivery', 'Created', 'Action'].map((heading) => <th key={heading} className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700">{heading}</th>)}</tr></thead><tbody>{recentOrders.map((order) => <tr key={getOrderId(order)} className="border-b last:border-b-0"><td className="px-4 sm:px-6 py-3 font-semibold">#{String(getOrderId(order)).slice(-8).toUpperCase()}</td><td className="px-4 sm:px-6 py-3">{order.userId?.name || order.userId?.businessName || 'Customer'}</td><td className="px-4 sm:px-6 py-3">{formatCurrency(order.totalAmount)}</td><td className="px-4 sm:px-6 py-3">{formatPaymentMethodLabel(order.paymentMethod)}<br /><span className="text-xs text-gray-500">{order.paymentStatus || '—'}</span></td><td className="px-4 sm:px-6 py-3"><StatusBadge status={String(order.status || '').toLowerCase()} /></td><td className="px-4 sm:px-6 py-3"><StatusBadge status={String(order.logisticsStatus || order.shipmentId?.status || 'unassigned').toLowerCase()} /></td><td className="px-4 sm:px-6 py-3 whitespace-nowrap">{formatDate(order.createdAt)}</td><td className="px-4 sm:px-6 py-3"><Link to="/admin/orders" className="text-blue-700 font-semibold">Open</Link></td></tr>)}</tbody></table></div>}
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
