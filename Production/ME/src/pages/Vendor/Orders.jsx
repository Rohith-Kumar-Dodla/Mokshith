import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/vendor/PageHeader';
import OrderCard from '../../components/vendor/OrderCard';
import StatusBadge from '../../components/vendor/StatusBadge';
import AnalyticsCard from '../../components/vendor/AnalyticsCard';
import { vendorOrders, vendorAnalytics } from '../../data';

const Orders = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const summary = vendorAnalytics.summary;

  const filteredOrders = filterStatus === 'all' 
    ? vendorOrders 
    : vendorOrders.filter(order => order.status === filterStatus);

  const statusCounts = {
    all: vendorOrders.length,
    pending: vendorOrders.filter(o => o.status === 'pending').length,
    confirmed: vendorOrders.filter(o => o.status === 'confirmed').length,
    processing: vendorOrders.filter(o => o.status === 'processing').length,
    dispatched: vendorOrders.filter(o => o.status === 'dispatched').length,
    delivered: vendorOrders.filter(o => o.status === 'delivered').length,
    cancelled: vendorOrders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="My Orders"
        subtitle="Track and manage all your orders."
      />

      {/* Order Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <AnalyticsCard
          title="Total Orders"
          value={summary.totalOrders}
          icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="blue"
        />
        <AnalyticsCard
          title="Pending"
          value={summary.pendingOrders}
          icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="yellow"
        />
        <AnalyticsCard
          title="Confirmed"
          value={summary.confirmedOrders}
          icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="indigo"
        />
        <AnalyticsCard
          title="Processing"
          value={summary.processingOrders}
          icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="yellow"
        />
        <AnalyticsCard
          title="Dispatched"
          value={summary.dispatchedOrders}
          icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="blue"
        />
        <AnalyticsCard
          title="Delivered"
          value={summary.deliveredOrders}
          icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="green"
        />
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(statusCounts).map((status) => (
            <button
              key={status}
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

      {/* Orders List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onViewDetails={(order) => console.log('View details:', order.id)}
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
