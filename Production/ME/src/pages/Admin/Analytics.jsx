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
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';

const Analytics = () => {
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 280000, orders: 450 },
    { month: 'Feb', revenue: 320000, orders: 520 },
    { month: 'Mar', revenue: 350000, orders: 580 },
    { month: 'Apr', revenue: 380000, orders: 620 },
    { month: 'May', revenue: 420000, orders: 680 },
    { month: 'Jun', revenue: 456000, orders: 750 },
  ];

  const productPerformanceData = [
    { name: 'Basmati Rice', sales: 1250, revenue: 106250 },
    { name: 'Toor Dal', sales: 980, revenue: 117600 },
    { name: 'Sunflower Oil', sales: 756, revenue: 340200 },
    { name: 'Wheat Flour', sales: 634, revenue: 412100 },
    { name: 'Red Chilli', sales: 892, revenue: 249760 },
  ];

  const categoryPerformanceData = [
    { name: 'Grains & Rice', value: 125000 },
    { name: 'Pulses & Dal', value: 98000 },
    { name: 'Cooking Oil', value: 156000 },
    { name: 'Spices', value: 145000 },
    { name: 'Flour & Atta', value: 89000 },
  ];

  const vendorGrowthData = [
    { month: 'Jan', newVendors: 5, totalVendors: 65 },
    { month: 'Feb', newVendors: 8, totalVendors: 73 },
    { month: 'Mar', newVendors: 6, totalVendors: 79 },
    { month: 'Apr', newVendors: 4, totalVendors: 83 },
    { month: 'May', newVendors: 3, totalVendors: 86 },
    { month: 'Jun', newVendors: 3, totalVendors: 89 },
  ];

  const orderTrendData = [
    { week: 'Week 1', orders: 120, delivered: 105 },
    { week: 'Week 2', orders: 135, delivered: 118 },
    { week: 'Week 3', orders: 142, delivered: 128 },
    { week: 'Week 4', orders: 155, delivered: 140 },
  ];

  const inventoryConsumptionData = [
    { product: 'Rice', consumption: 450 },
    { product: 'Dal', consumption: 380 },
    { product: 'Oil', consumption: 280 },
    { product: 'Flour', consumption: 320 },
    { product: 'Spices', consumption: 250 },
  ];

  const deliveryEfficiencyData = [
    { name: 'On Time', value: 85 },
    { name: 'Delayed', value: 12 },
    { name: 'Cancelled', value: 3 },
  ];

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const topProducts = [
    { name: 'Basmati Rice Premium', sales: 1250, revenue: 106250, growth: '+12%' },
    { name: 'Toor Dal (Pigeon Pea)', sales: 980, revenue: 117600, growth: '+8%' },
    { name: 'Sunflower Oil 5L', sales: 756, revenue: 340200, growth: '+15%' },
    { name: 'Wheat Flour 25kg', sales: 634, revenue: 412100, growth: '+10%' },
    { name: 'Red Chilli Powder', sales: 892, revenue: 249760, growth: '+18%' },
  ];

  const topVendors = [
    { name: 'Big Basket Plus', orders: 789, revenue: 394500, growth: '+22%' },
    { name: 'Premium Foods', sales: 678, revenue: 339000, growth: '+15%' },
    { name: 'Fresh Mart Grocery', orders: 456, revenue: 228000, growth: '+12%' },
    { name: 'Metro Wholesale', orders: 567, revenue: 283500, growth: '+18%' },
    { name: 'Daily Needs Store', orders: 312, revenue: 156000, growth: '+10%' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Comprehensive business analytics and performance metrics"
      />

      {/* Revenue Trend */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Monthly Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={250} smHeight={300}>
          <LineChart data={monthlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} name="Revenue (₹)" />
            <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

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
              <Bar dataKey="revenue" fill="#10B981" name="Revenue (₹)" />
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

      {/* Vendor Growth & Order Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Vendor Growth</h2>
          <ResponsiveContainer width="100%" height={250} smHeight={300}>
            <LineChart data={vendorGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newVendors" stroke="#2563EB" strokeWidth={2} name="New Vendors" />
              <Line type="monotone" dataKey="totalVendors" stroke="#10B981" strokeWidth={2} name="Total Vendors" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Order Trends</h2>
          <ResponsiveContainer width="100%" height={250} smHeight={300}>
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
      </div>

      {/* Inventory Consumption & Delivery Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Inventory Consumption</h2>
          <ResponsiveContainer width="100%" height={250} smHeight={300}>
            <BarChart data={inventoryConsumptionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="product" type="category" width={60} smWidth={80} />
              <Tooltip />
              <Bar dataKey="consumption" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Delivery Efficiency</h2>
          <ResponsiveContainer width="100%" height={250} smHeight={300}>
            <PieChart>
              <Pie
                data={deliveryEfficiencyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60} smOuterRadius={80}
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
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Top Selling Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Product Name</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Sales</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Revenue</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Growth</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{product.sales}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">₹{product.revenue.toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-xs sm:text-sm text-green-600 font-semibold">{product.growth}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Vendors */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Top Vendors by Revenue</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Vendor Name</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Orders</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Revenue</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Growth</th>
              </tr>
            </thead>
            <tbody>
              {topVendors.map((vendor, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{vendor.name}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{vendor.orders}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">₹{vendor.revenue.toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-xs sm:text-sm text-green-600 font-semibold">{vendor.growth}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
