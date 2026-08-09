import React, { useEffect, useMemo, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
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
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import analyticsService from '../../services/analyticsService';
import TableResponsive from '../../components/common/TableResponsive';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [deliveryAnalytics, setDeliveryAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        // Admin should not fetch full financial dashboard; fetch delivery analytics only (non-financial)
        const deliveryPayload = await analyticsService.getDeliveryAnalytics().catch(() => null);
        setAnalytics(null);
        setDeliveryAnalytics(deliveryPayload?.data ?? deliveryPayload);
      } catch (err) {
        setError(getUserFacingErrorMessage(err, 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const dashboard = analytics?.dashboard || {};
  const monthlyRevenueData = analytics?.salesData || analytics?.orderTrends || [];
  const categoryPerformanceData = analytics?.categoryData || [];
  const productPerformanceData = useMemo(
    () => (analytics?.topProducts || []).slice(0, 5).map((product) => ({
      name: product.name,
      sales: product.sales,
      // revenue removed for Admin view
    })),
    [analytics]
  );
  const orderTrendData = monthlyRevenueData.map((entry) => ({
    week: entry.name,
    orders: entry.orders,
    delivered: Math.round((entry.orders || 0) * ((deliveryAnalytics?.completionRate ?? 85) / 100)),
  }));
  const deliveryEfficiencyData = [
    { name: 'Completed', value: deliveryAnalytics?.completedDeliveries ?? 0 },
    { name: 'Active', value: deliveryAnalytics?.activeDeliveries ?? 0 },
    { name: 'Failed', value: deliveryAnalytics?.failedDeliveries ?? 0 },
  ].filter((item) => item.value > 0);
  const topProducts = (analytics?.topProducts || []).map((product) => ({
    name: product.name,
    sales: product.sales,
    revenue: product.revenue,
    growth: '—',
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Comprehensive business analytics and performance metrics"
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading analytics...</p>
      ) : (
        <>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{dashboard.totalOrders ?? 0}</p>
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-500">Completion Rate</p>
          <p className="text-2xl font-bold text-gray-900">{deliveryAnalytics?.completionRate ?? 0}%</p>
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-500">Pending Deliveries</p>
          <p className="text-2xl font-bold text-gray-900">{dashboard.pendingDeliveries ?? deliveryAnalytics?.activeDeliveries ?? 0}</p>
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-500">Active Customers</p>
          <p className="text-2xl font-bold text-gray-900">{dashboard.activeCustomers ?? 0}</p>
        </Card>
      </div>

      {/* Revenue Trend removed from Admin view */}

      {/* Product Performance & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Product Performance</h2>
          <ResponsiveContainer width="100%" height={250} smHeight={300}>
            <BarChart data={productPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#2563EB" name="Sales" />
              {/* revenue removed from Admin chart */}
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Category Performance</h2>
          <ResponsiveContainer width="100%" height={250} smHeight={300}>
            <PieChart>
              <Pie
                data={categoryPerformanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60} smOuterRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryPerformanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Order Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Order Trends</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={orderTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#2563EB" name="Total Orders" />
              <Bar dataKey="delivered" fill="#10B981" name="Delivered" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Delivery Efficiency</h2>
          {deliveryEfficiencyData.length === 0 ? (
            <p className="text-sm text-gray-500">No delivery data available yet.</p>
          ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deliveryEfficiencyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deliveryEfficiencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Top Selling Products</h2>
        <TableResponsive>
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Product Name</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Sales</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Growth</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-gray-500 text-center">No product analytics available.</td>
                </tr>
              ) : topProducts.map((product, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{product.sales}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-xs sm:text-sm text-green-600 font-semibold">{product.growth}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableResponsive>
      </Card>
        </>
      )}
    </div>
  );
};

export default Analytics;
