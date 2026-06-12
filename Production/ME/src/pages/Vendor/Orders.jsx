import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/vendor/PageHeader';
import OrderCard from '../../components/vendor/OrderCard';
import AnalyticsCard from '../../components/vendor/AnalyticsCard';
import useOrders from '../../hooks/useOrders';

const Orders = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');
  const { loading, error, orders, stats } = useOrders();

  const filteredOrders = useMemo(() => (
    filterStatus === 'all'
      ? orders
      : orders.filter((order) => order.status === filterStatus)
  ), [orders, filterStatus]);

  const statusCounts = {
    all: stats.totalOrders,
    pending: stats.pendingOrders,
    confirmed: stats.confirmedOrders,
    processing: stats.processingOrders,
    dispatched: stats.dispatchedOrders,
    delivered: stats.deliveredOrders,
    cancelled: stats.cancelledOrders,
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <p className="text-sm text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="My Orders"
        subtitle="Track and manage all your orders."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <AnalyticsCard title="Total Orders" value={stats.totalOrders} icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />} color="blue" />
        <AnalyticsCard title="Pending" value={stats.pendingOrders} icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />} color="yellow" />
        <AnalyticsCard title="Confirmed" value={stats.confirmedOrders} icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />} color="indigo" />
        <AnalyticsCard title="Processing" value={stats.processingOrders} icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />} color="yellow" />
        <AnalyticsCard title="Dispatched" value={stats.dispatchedOrders} icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />} color="blue" />
        <AnalyticsCard title="Delivered" value={stats.deliveredOrders} icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />} color="green" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(statusCounts).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 sm:px-4 py-2 h-10 sm:h-12 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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
