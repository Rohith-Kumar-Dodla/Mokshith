import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import PageHeader from '../../components/superadmin/PageHeader';
import { revenueData, ordersByStatus, vendorGrowth, deliveryPerformance, marketplacePerformance, dailyRevenue, categoryDistribution } from '../../data/analytics';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const Analytics = () => {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Analytics"
        subtitle="Comprehensive platform analytics and performance metrics."
      />

      {/* Revenue Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={250} smHeight={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#6B7280" fontSize={10} smFontSize={12} />
            <YAxis stroke="#6B7280" fontSize={10} smFontSize={12} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} name="Revenue (₹)" />
            <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={250} smHeight={300}>
            <PieChart>
              <Pie
                data={ordersByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={60} smOuterRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {ordersByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Vendor Growth */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Vendor Growth</h2>
          <ResponsiveContainer width="100%" height={250} smHeight={300}>
            <BarChart data={vendorGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={10} smFontSize={12} />
              <YAxis stroke="#6B7280" fontSize={10} smFontSize={12} />
              <Tooltip />
              <Bar dataKey="vendors" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Revenue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Daily Revenue</h2>
        <ResponsiveContainer width="100%" height={250} smHeight={300}>
          <BarChart data={dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="day" stroke="#6B7280" fontSize={10} smFontSize={12} />
            <YAxis stroke="#6B7280" fontSize={10} smFontSize={12} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Marketplace Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Marketplace Performance</h2>
          <ResponsiveContainer width="100%" height={250} smHeight={300}>
            <BarChart data={marketplacePerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" fontSize={10} smFontSize={12} />
              <YAxis dataKey="metric" type="category" stroke="#6B7280" width={80} smWidth={100} fontSize={10} smFontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Category Distribution</h2>
          <ResponsiveContainer width="100%" height={250} smHeight={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value}%)`}
                outerRadius={80} smOuterRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delivery Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Delivery Partner Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Partner</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Deliveries</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Rating</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deliveryPerformance.map((partner, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm">{partner.partner}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 text-sm">{partner.deliveries}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="inline-flex items-center gap-1 text-yellow-600 text-sm">
                      ★ {partner.rating}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(partner.rating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
