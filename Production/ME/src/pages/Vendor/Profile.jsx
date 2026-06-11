import React from 'react';
import PageHeader from '../../components/vendor/PageHeader';
import AnalyticsCard from '../../components/vendor/AnalyticsCard';
import { vendorAnalytics } from '../../data';

const Profile = () => {
  const summary = vendorAnalytics.summary;
  const topCategories = vendorAnalytics.topCategories;
  const frequentlyOrdered = vendorAnalytics.frequentlyOrderedProducts;
  const monthlySpending = vendorAnalytics.monthlySpending;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your business information and view purchase analytics."
      />

      {/* Business Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Business Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">Fresh Mart Grocery</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">Rajesh Kumar</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">+91 98765 43210</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">freshmart@example.com</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">29ABCDE1234F1Z5</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">Shop No. 12, Main Market, Hyderabad East</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">Hyderabad East</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">January 15, 2024</p>
          </div>
        </div>
      </div>

      {/* Purchase Analytics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Purchase Analytics</h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <AnalyticsCard
            title="Total Orders"
            value={summary.totalOrders}
            icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
          <AnalyticsCard
            title="Total Spending"
            value={`₹${summary.totalSpending.toLocaleString()}`}
            icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="green"
          />
          <AnalyticsCard
            title="This Month Spending"
            value={`₹${summary.thisMonthSpending.toLocaleString()}`}
            icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="blue"
          />
          <AnalyticsCard
            title="Reward Points"
            value={summary.rewardPoints}
            icon={<div className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="orange"
          />
        </div>

        {/* Monthly Spending */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Monthly Spending</h3>
          <div className="flex items-end gap-1 sm:gap-2 h-24 sm:h-32">
            {monthlySpending.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${(month.amount / Math.max(...monthlySpending.map(m => m.amount))) * 100}%` }}
                />
                <span className="text-xs text-gray-600 mt-1 sm:mt-2">{month.month}</span>
                <span className="text-xs text-gray-500">₹{(month.amount / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Top Categories</h3>
          <div className="space-y-2 sm:space-y-3">
            {topCategories.map((category, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm text-gray-700">{category.category}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">₹{category.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-blue-500 h-1.5 sm:h-2 rounded-full"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Frequently Ordered Products */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Frequently Ordered Products</h3>
          <div className="space-y-2">
            {frequentlyOrdered.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{product.productName}</p>
                  <p className="text-xs text-gray-500">
                    {product.orderCount} orders • {product.totalQuantity} units total
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">
                  #{index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Status</h2>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full" />
          <span className="text-xs sm:text-sm font-medium text-gray-900">Active</span>
          <span className="text-xs sm:text-sm text-gray-500">• Account in good standing</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
