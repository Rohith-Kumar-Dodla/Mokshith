import React from 'react';
import { FiUsers, FiShoppingBag, FiTruck, FiPackage, FiDollarSign, FiTrendingUp, FiActivity, FiClock, FiEye, FiFileText, FiMonitor, FiBarChart } from 'react-icons/fi';
import DashboardCard from '../../components/superadmin/DashboardCard';
import ActivityFeed from '../../components/superadmin/ActivityFeed';
import PageHeader from '../../components/superadmin/PageHeader';

const SuperAdminDashboard = () => {
  const activities = [
    { type: 'vendor_registered', title: 'Vendor Registered', description: 'City Supermarket has registered and awaiting approval', time: '15 minutes ago' },
    { type: 'order_placed', title: 'Order Placed', description: 'Order ORD003 placed by Quick Supply Hub worth ₹3,200', time: '1 hour ago' },
    { type: 'delivery_completed', title: 'Delivery Completed', description: 'Order ORD001 successfully delivered by Ravi Teja', time: '2 hours ago' },
    { type: 'product_added', title: 'Products Added', description: '45 new products added by Metro Wholesale', time: '3 hours ago' },
    { type: 'admin_activity', title: 'Admin Activity', description: 'Admin Rajesh Kumar approved 3 vendor applications', time: '4 hours ago' },
  ];

  const quickActions = [
    { title: 'Monitor Platform', icon: FiMonitor, color: 'blue', link: '/super-admin/platform' },
    { title: 'Admin Performance', icon: FiBarChart, color: 'green', link: '/super-admin/admin-performance' },
    { title: 'View Vendors', icon: FiShoppingBag, color: 'purple', link: '/super-admin/vendors' },
    { title: 'View Deliveries', icon: FiTruck, color: 'orange', link: '/super-admin/delivery-partners' },
    { title: 'View Orders', icon: FiPackage, color: 'teal', link: '/super-admin/orders' },
    { title: 'Generate Report', icon: FiFileText, color: 'red', link: '/super-admin/analytics' },
  ];

  const platformHealth = [
    { title: 'Admin Status', value: 'Active', icon: FiActivity, color: 'green' },
    { title: 'Pending Approvals', value: '2', icon: FiClock, color: 'orange' },
    { title: 'Orders Today', value: '45', icon: FiPackage, color: 'green' },
    { title: 'Deliveries Today', value: '38', icon: FiTruck, color: 'teal' },
    { title: 'Revenue Today', value: '₹1.2L', icon: FiDollarSign, color: 'purple' },
    { title: 'System Status', value: 'Healthy', icon: FiActivity, color: 'green' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Monitor and manage the entire B2B ecosystem."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        <DashboardCard
          title="Admin Status"
          value="Active"
          growth={0}
          icon={FiActivity}
          color="green"
        />
        <DashboardCard
          title="Total Vendors"
          value="78"
          growth={18}
          icon={FiShoppingBag}
          color="green"
        />
        <DashboardCard
          title="Delivery Partners"
          value="45"
          growth={7}
          icon={FiTruck}
          color="purple"
        />
        <DashboardCard
          title="Total Products"
          value="1,567"
          growth={15}
          icon={FiPackage}
          color="orange"
        />
        <DashboardCard
          title="Total Orders"
          value="4,400"
          growth={22}
          icon={FiTrendingUp}
          color="teal"
        />
        <DashboardCard
          title="Total Revenue"
          value="₹34.9L"
          growth={28}
          icon={FiDollarSign}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Recent Activity</h2>
          <ActivityFeed activities={activities} />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all group min-h-[88px]"
              >
                <div className={`p-3 sm:p-4 rounded-xl bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                  <action.icon className={`text-${action.color}-600`} size={20} sm:size={24} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Platform Health</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {platformHealth.map((item, index) => (
            <div key={index} className="text-center">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl inline-block mb-2 sm:mb-3">
                <item.icon className="text-gray-600" size={20} sm:size={24} />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs sm:text-sm text-gray-500">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
