import React from 'react';
import { FiUser, FiPackage, FiShoppingCart, FiDollarSign, FiClock, FiCheckCircle, FiTrendingUp, FiBarChart, FiActivity } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import DashboardCard from '../../components/superadmin/DashboardCard';
import { adminPerformance, marketplacePerformance } from '../../data';

const AdminPerformance = () => {
  const performanceMetrics = [
    { title: 'Total Orders', value: adminPerformance.totalOrders.toLocaleString(), icon: FiShoppingCart, color: 'blue' },
    { title: 'Total Products', value: adminPerformance.totalProducts.toLocaleString(), icon: FiPackage, color: 'purple' },
    { title: 'Total Vendors', value: adminPerformance.totalVendors, icon: FiUser, color: 'green' },
    { title: 'Total Revenue', value: `₹${(adminPerformance.totalRevenue / 100000).toFixed(1)}L`, icon: FiDollarSign, color: 'orange' },
    { title: 'Monthly Revenue', value: `₹${(adminPerformance.monthlyRevenue / 100000).toFixed(1)}L`, icon: FiTrendingUp, color: 'teal' },
    { title: 'Approval Rate', value: `${adminPerformance.approvalRate}%`, icon: FiCheckCircle, color: 'green' },
  ];

  const adminDetails = [
    { label: 'Admin Name', value: adminPerformance.admin, icon: FiUser },
    { label: 'Response Time', value: adminPerformance.responseTime, icon: FiClock },
    { label: 'Satisfaction Score', value: `${adminPerformance.satisfactionScore}/5.0`, icon: FiActivity },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Admin Performance"
        subtitle="Monitor admin activities, performance metrics, and operational efficiency."
      />

      {/* Admin Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Admin Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {adminDetails.map((detail, index) => (
            <div key={index} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <detail.icon className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">{detail.label}</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">{detail.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        {performanceMetrics.map((metric, index) => (
          <DashboardCard
            key={index}
            title={metric.title}
            value={metric.value}
            growth={0}
            icon={metric.icon}
            color={metric.color}
          />
        ))}
      </div>

      {/* Marketplace Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Marketplace Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {marketplacePerformance.map((item, index) => (
            <div key={index} className="p-4 sm:p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm sm:text-base font-medium text-gray-700">{item.metric}</p>
                <span className={`text-xs sm:text-sm font-semibold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </span>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Performance Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg">
            <div className="p-3 bg-green-100 rounded-full inline-block mb-3">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900">Excellent</p>
            <p className="text-xs sm:text-sm text-gray-600">Overall Rating</p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-lg">
            <div className="p-3 bg-blue-100 rounded-full inline-block mb-3">
              <FiTrendingUp className="text-blue-600" size={24} />
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900">+28%</p>
            <p className="text-xs sm:text-sm text-gray-600">Revenue Growth</p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-purple-50 rounded-lg">
            <div className="p-3 bg-purple-100 rounded-full inline-block mb-3">
              <FiBarChart className="text-purple-600" size={24} />
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900">94%</p>
            <p className="text-xs sm:text-sm text-gray-600">Order Success</p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-orange-50 rounded-lg">
            <div className="p-3 bg-orange-100 rounded-full inline-block mb-3">
              <FiActivity className="text-orange-600" size={24} />
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900">2.5h</p>
            <p className="text-xs sm:text-sm text-gray-600">Avg Response</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPerformance;
