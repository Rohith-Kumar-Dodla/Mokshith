import React from 'react';
import { FiBox, FiShoppingCart, FiTruck, FiUsers, FiDollarSign, FiCheckCircle, FiClock, FiPlus, FiPackage, FiTrendingUp, FiUserPlus, FiFileText, FiArrowRight, FiGrid } from 'react-icons/fi';
import Card from '../../components/admin/Card';
import StatusBadge from '../../components/admin/StatusBadge';

const AdminDashboard = () => {
  const summaryCards = [
    { title: 'Total Products', value: '1,567', icon: FiBox, change: '+12%', color: 'blue' },
    { title: 'Total Categories', value: '28', icon: FiPackage, change: '+5%', color: 'purple' },
    { title: 'Total Vendors', value: '78', icon: FiUsers, change: '+8%', color: 'green' },
    { title: 'Orders Today', value: '45', icon: FiShoppingCart, change: '+15%', color: 'orange' },
    { title: 'Pending Deliveries', value: '12', icon: FiTruck, change: '-3%', color: 'red' },
    { title: 'Revenue Today', value: '₹1.2L', icon: FiDollarSign, change: '+18%', color: 'green' },
    { title: 'Monthly Revenue', value: '₹7.5L', icon: FiTrendingUp, change: '+22%', color: 'blue' },
    { title: 'Inventory Value', value: '₹8.9L', icon: FiBox, change: '+10%', color: 'purple' },
  ];

  const quickActions = [
    { title: 'Add Product', icon: FiPlus, description: 'Add new product to catalog', color: 'blue' },
    { title: 'Update Inventory', icon: FiPackage, description: 'Manage stock levels', color: 'green' },
    { title: 'Approve Vendor', icon: FiUserPlus, description: 'Review vendor applications', color: 'purple' },
    { title: 'Assign Delivery', icon: FiTruck, description: 'Assign delivery partners', color: 'orange' },
    { title: 'View Orders', icon: FiShoppingCart, description: 'View all orders', color: 'blue' },
    { title: 'Generate Report', icon: FiFileText, description: 'Download reports', color: 'red' },
  ];

  const todayPerformance = [
    { title: 'Orders Received', value: '45', icon: FiShoppingCart, trend: '+12%' },
    { title: 'Orders Processed', value: '38', icon: FiCheckCircle, trend: '+8%' },
    { title: 'Deliveries Completed', value: '32', icon: FiTruck, trend: '+15%' },
    { title: 'New Vendors', value: '3', icon: FiUserPlus, trend: '+25%' },
    { title: 'Revenue Today', value: '₹1.2L', icon: FiDollarSign, trend: '+18%' },
  ];

  const recentActivities = [
    { id: 1, title: 'Vendor Registered', description: 'City Supermarket registered and awaiting approval', time: '2 minutes ago', icon: FiUserPlus, color: 'green' },
    { id: 2, title: 'Product Added', description: 'Basmati Rice Premium added to inventory', time: '15 minutes ago', icon: FiBox, color: 'blue' },
    { id: 3, title: 'Stock Updated', description: 'Toor Dal stock replenished (+200 units)', time: '1 hour ago', icon: FiPackage, color: 'purple' },
    { id: 4, title: 'Order Placed', description: 'Fresh Mart Grocery placed order #ORD001', time: '2 hours ago', icon: FiShoppingCart, color: 'orange' },
    { id: 5, title: 'Delivery Assigned', description: 'Ravi Teja assigned to order #ORD001', time: '3 hours ago', icon: FiTruck, color: 'green' },
    { id: 6, title: 'Order Delivered', description: 'Order ORD099 successfully delivered', time: '4 hours ago', icon: FiCheckCircle, color: 'green' },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
      green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-500' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-500' },
      red: { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-500' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Marketplace Operations Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage products, vendors, inventory, and deliveries across the entire marketplace.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {summaryCards.map((card, index) => {
          const colors = getColorClasses(card.color);
          return (
            <Card key={index} className="hover:shadow-md transition-shadow p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className={`p-2 sm:p-3 rounded-lg ${colors.bg}`}>
                  <card.icon size={18} sm:size={24} className={colors.icon} />
                </div>
                <span className={`text-xs sm:text-sm font-semibold ${card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {card.change}
                </span>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mt-3 sm:mt-4">{card.title}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {quickActions.map((action, index) => {
            const colors = getColorClasses(action.color);
            return (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer group p-4 sm:p-6 min-h-[88px]">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`p-2 sm:p-3 rounded-lg ${colors.bg} group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <action.icon size={16} sm:size={20} className={colors.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">{action.description}</p>
                  </div>
                  <FiArrowRight className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" size={16} sm:size={20} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Today's Performance */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Today's Performance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {todayPerformance.map((perf, index) => (
            <Card key={index} className="text-center p-3 sm:p-4">
              <div className="flex justify-center mb-2 sm:mb-3">
                <div className="p-2 sm:p-3 rounded-lg bg-blue-100">
                  <perf.icon size={18} sm:size={24} className="text-blue-600" />
                </div>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm">{perf.title}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{perf.value}</p>
              <span className="text-xs sm:text-sm font-semibold text-green-600">{perf.trend}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Recent Activities</h2>
          <div className="space-y-3 sm:space-y-4">
            {recentActivities.map((activity) => {
              const colors = getColorClasses(activity.color);
              return (
                <div key={activity.id} className="flex items-start gap-3 sm:gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0`}>
                    <activity.icon size={14} sm:size={16} className={colors.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">{activity.title}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2">{activity.description}</p>
                    <p className="text-gray-400 text-xs mt-0.5 sm:mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Marketplace Overview */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Marketplace Overview</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
                  <FiGrid size={16} sm:size={20} className="text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Marketplace Status</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-purple-100 flex-shrink-0">
                  <FiUsers size={16} sm:size={20} className="text-purple-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Active Vendors</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-900">78</span>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-green-100 flex-shrink-0">
                  <FiTruck size={16} sm:size={20} className="text-green-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Delivery Partners</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-900">45</span>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-orange-100 flex-shrink-0">
                  <FiBox size={16} sm:size={20} className="text-orange-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Total Products</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-900">1,567</span>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
                  <FiPackage size={16} sm:size={20} className="text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Pending Approvals</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-900">2</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
