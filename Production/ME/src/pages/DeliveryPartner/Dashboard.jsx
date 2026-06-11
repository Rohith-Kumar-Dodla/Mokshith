import React from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiCheckCircle, FiTruck, FiClock, FiDollarSign, FiStar, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import MetricCard from '../../components/delivery/MetricCard';
import StatusBadge from '../../components/delivery/StatusBadge';
import { deliveryAnalytics, activityTimeline } from '../../data/deliveryAnalytics';
import { assignedOrders } from '../../data/deliveryAssignedOrders';
import { deliveryProfile } from '../../data/deliveryProfile';

const DeliveryDashboard = () => {
  const summaryCards = [
    { title: 'Assigned Orders', value: deliveryAnalytics.today.assignedOrders, icon: <FiPackage size={24} />, change: '+2', color: 'blue' },
    { title: 'Pending Deliveries', value: deliveryAnalytics.today.pendingDeliveries, icon: <FiClock size={24} />, change: '+1', color: 'orange' },
    { title: 'Completed Deliveries', value: deliveryAnalytics.today.completedDeliveries, icon: <FiCheckCircle size={24} />, change: '+3', color: 'green' },
    { title: "Today's Earnings", value: `₹${deliveryAnalytics.today.todaysEarnings}`, icon: <FiDollarSign size={24} />, change: '+15%', color: 'purple' },
    { title: 'Monthly Earnings', value: `₹${deliveryAnalytics.today.monthlyEarnings}`, icon: <FiTrendingUp size={24} />, change: '+8%', color: 'green' },
    { title: 'Average Rating', value: deliveryAnalytics.today.averageRating, icon: <FiStar size={24} />, change: '+0.2', color: 'orange' },
    { title: 'Success Rate', value: `${deliveryAnalytics.today.successRate}%`, icon: <FiCheckCircle size={24} />, change: '+2%', color: 'blue' },
    { title: 'Today\'s Deliveries', value: deliveryAnalytics.today.completedDeliveries, icon: <FiTruck size={24} />, change: '+3', color: 'green' }
  ];

  const quickActions = [
    { title: 'View Assigned Orders', icon: FiPackage, link: '/delivery/assigned-orders', color: 'blue' },
    { title: 'Start Delivery', icon: FiTruck, link: '/delivery/assigned-orders', color: 'green' },
    { title: 'Update Status', icon: FiCheckCircle, link: '/delivery/assigned-orders', color: 'orange' },
    { title: 'View Earnings', icon: FiDollarSign, link: '/delivery/earnings', color: 'purple' },
    { title: 'Performance Report', icon: FiTrendingUp, link: '/delivery/performance', color: 'blue' },
    { title: 'Delivery History', icon: FiClock, link: '/delivery/history', color: 'green' }
  ];

  const todayPerformance = [
    { title: 'Orders Assigned', value: deliveryAnalytics.today.assignedOrders, icon: FiPackage, color: 'blue' },
    { title: 'Orders Delivered', value: deliveryAnalytics.today.completedDeliveries, icon: FiCheckCircle, color: 'green' },
    { title: 'Orders Pending', value: deliveryAnalytics.today.pendingDeliveries, icon: FiClock, color: 'orange' },
    { title: 'Earnings Today', value: `₹${deliveryAnalytics.today.todaysEarnings}`, icon: FiDollarSign, color: 'purple' },
    { title: 'Rating Today', value: deliveryAnalytics.today.averageRating, icon: FiStar, color: 'orange' },
    { title: 'Success Rate', value: `${deliveryAnalytics.today.successRate}%`, icon: FiTrendingUp, color: 'blue' }
  ];

  const recentOrders = assignedOrders.slice(0, 4);

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Delivery Operations Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage assigned deliveries efficiently.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {summaryCards.slice(0, 4).map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`p-2 sm:p-3 rounded-lg bg-${action.color}-50 text-${action.color}-600 group-hover:bg-${action.color}-600 group-hover:text-white transition-colors`}>
                <action.icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{action.title}</p>
                <p className="text-xs text-gray-500 hidden sm:block">Click to proceed</p>
              </div>
              <FiArrowRight className="text-gray-400 group-hover:text-gray-600" size={16} />
            </div>
          </Link>
        ))}
      </div>

      {/* Today's Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Today's Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {todayPerformance.map((perf, index) => (
            <div key={index} className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="p-2 sm:p-3 bg-blue-500 rounded-lg text-white">
                <perf.icon size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">{perf.title}</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">{perf.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Recent Orders</h2>
            <Link to="/delivery/assigned-orders" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{order.id}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">{order.vendor}</p>
                  <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{order.deliveryLocation}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">₹{order.orderAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{order.distance} km</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Recent Activities</h2>
          <div className="space-y-3 sm:space-y-4">
            {activityTimeline.slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 sm:gap-4">
                <div className={`p-1.5 sm:p-2 rounded-lg ${
                  activity.type === 'order_delivered' ? 'bg-green-100 text-green-600' :
                  activity.type === 'payment_completed' ? 'bg-purple-100 text-purple-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {activity.type === 'order_assigned' && <FiPackage size={14} />}
                  {activity.type === 'order_accepted' && <FiCheckCircle size={14} />}
                  {activity.type === 'order_picked_up' && <FiTruck size={14} />}
                  {activity.type === 'out_for_delivery' && <FiClock size={14} />}
                  {activity.type === 'order_delivered' && <FiCheckCircle size={14} />}
                  {activity.type === 'payment_completed' && <FiDollarSign size={14} />}
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">{activity.time} - {activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {summaryCards.slice(4).map((card, index) => (
          <MetricCard key={index + 4} {...card} />
        ))}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
