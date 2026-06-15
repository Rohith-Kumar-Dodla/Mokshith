import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/vendor/PageHeader';
import OrderCard from '../../components/vendor/OrderCard';
import SearchBar from '../../components/vendor/SearchBar';
import useOrders from '../../hooks/useOrders';
import orderService from '../../services/orderService';
import StatsCard from '../../components/vendor/StatsCard';
import { Package, Clock, Check, Loader2, Truck, CheckCircle, X, DollarSign } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Orders = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { loading, error, orders, stats } = useOrders();

  const statusCounts = useMemo(() => ({
    all: stats.totalOrders,
    pending: stats.pendingOrders,
    confirmed: stats.confirmedOrders,
    processing: stats.processingOrders,
    dispatched: stats.dispatchedOrders,
    delivered: stats.deliveredOrders,
    cancelled: stats.cancelledOrders,
  }), [stats]);

  const filteredOrders = useMemo(() => {
    let result = filterStatus === 'all'
      ? orders
      : orders.filter((order) => order.status === filterStatus);

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      result = result.filter((order) =>
        order.id.toLowerCase().includes(query) ||
        order.orderNumber?.toLowerCase().includes(query) ||
        order.items.some((item) => item.productName?.toLowerCase().includes(query))
      );
    }

    return result;
  }, [orders, filterStatus, searchTerm]);

  const handleDownloadInvoice = useCallback(async (order) => {
    try {
      const response = await orderService.downloadInvoice(order.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      navigate(`/vendor/orders/${order.id}`);
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <p className="text-sm text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden">
      <PageHeader
        title="My Orders"
        subtitle="Track and manage all your orders."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        <StatsCard title="Total Orders" value={stats.totalOrders} icon={<Package size={18} />} />
        <StatsCard title="Pending" value={stats.pendingOrders} icon={<Clock size={18} />} />
        <StatsCard title="Confirmed" value={stats.confirmedOrders} icon={<Check size={18} />} />
        <StatsCard title="Processing" value={stats.processingOrders} icon={<Loader2 size={18} />} />
        <StatsCard title="Dispatched" value={stats.dispatchedOrders} icon={<Truck size={18} />} />
        <StatsCard title="Delivered" value={stats.deliveredOrders} icon={<CheckCircle size={18} />} />
        <StatsCard title="Revenue" value={`₹${stats.revenue ?? 0}`} icon={<DollarSign size={18} />} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 space-y-3 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Search orders..."
            className="flex-1 min-w-0"
          />
          <div className="flex-shrink-0 w-full sm:w-auto sm:min-w-[160px]">
            <label htmlFor="order-status-filter" className="sr-only">Filter by status</label>
            <select
              id="order-status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-10 sm:h-12 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({statusCounts[option.value] ?? 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden md:flex flex-wrap gap-2">
          {Object.keys(statusCounts).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 sm:px-4 py-2 h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onViewDetails={(selectedOrder) => navigate(`/vendor/orders/${selectedOrder.id}`)}
            onDownloadInvoice={handleDownloadInvoice}
            onTrack={(selectedOrder) => navigate(`/vendor/orders/${selectedOrder.id}`)}
            onViewInvoice={(selectedOrder) => navigate(`/vendor/invoices?orderId=${selectedOrder.id}`)}
          />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-xs sm:text-sm text-gray-600">No orders found for the selected filter.</p>
        </div>
      )}
    </div>
  );
};

export default Orders;
