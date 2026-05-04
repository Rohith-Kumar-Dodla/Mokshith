import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  DollarSign, 
  Clock, 
  BarChart3, 
  LineChart as LineChartIcon,
  Activity, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw, 
  Calendar, 
  Download,
  Filter,
  ChevronRight,
  Zap,
  Target,
  Award
} from 'lucide-react';

const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded"></div>
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="h-3 w-40 bg-gray-200 rounded"></div>
  </div>
);

const MetricCard = ({ title, value, change, changeType, icon: Icon, color, trend }) => {
  const isPositive = changeType === 'positive';
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-lg border border-white/30 p-6 hover:bg-white/80 hover:border-white/40 hover:shadow-lg transition-all duration-300 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]} shadow-lg`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {change !== undefined && (
          <>
            {isPositive ? (
              <ArrowUpRight size={16} className="text-emerald-600" />
            ) : (
              <ArrowDownRight size={16} className="text-rose-600" />
            )}
            <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-500">vs last month</span>
          </>
        )}
      </div>
    </div>
  );
};

const ChartPlaceholder = ({ title, subtitle, height = 'h-80' }) => (
  <div className={`${height} bg-white/60 backdrop-blur-md rounded-lg border border-white/30 p-6 flex flex-col items-center justify-center text-gray-400 shadow-sm`}>
    <BarChart3 size={48} className="mb-4 opacity-20" />
    <p className="font-semibold">{title}</p>
    <p className="text-sm">{subtitle}</p>
  </div>
);

const AnalyticsPage = () => {
  const { 
    dashboard, 
    salesData: rawSalesData, 
    orderTrends: rawOrderTrends, 
    topProducts: rawTopProducts, 
    loading, 
    error 
  } = useAnalytics();

  const [dateRange, setDateRange] = useState('month');

  const salesData = Array.isArray(rawSalesData) ? rawSalesData : [];
  const orderTrends = Array.isArray(rawOrderTrends) ? rawOrderTrends : [];
  const topProducts = Array.isArray(rawTopProducts) ? rawTopProducts : [];

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 rounded"></div>
        </div>

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg p-6 animate-pulse border border-gray-200">
            <div className="h-80 bg-gray-100 rounded-lg"></div>
          </div>
          <div className="bg-white rounded-lg p-6 animate-pulse border border-gray-200">
            <div className="h-80 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Activity size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics Unavailable</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <RefreshCcw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  const stats = dashboard || {};
  
  const kpis = [
    {
      title: 'Total Revenue',
      value: `₹${(stats.revenue || 0).toLocaleString()}`,
      change: stats.revenueGrowth || 12,
      changeType: (stats.revenueGrowth || 12) >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: 'Total Orders',
      value: (stats.totalOrders || 0).toLocaleString(),
      change: stats.ordersGrowth || 8,
      changeType: (stats.ordersGrowth || 8) >= 0 ? 'positive' : 'negative',
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Active Customers',
      value: (stats.activeUsers || 0).toLocaleString(),
      change: stats.userGrowth || 5,
      changeType: (stats.userGrowth || 5) >= 0 ? 'positive' : 'negative',
      icon: Users,
      color: 'indigo'
    },
    {
      title: 'Pending Fulfillment',
      value: (stats.pendingDeliveries || 0).toString(),
      change: stats.deliveryGrowth || -3,
      changeType: (stats.deliveryGrowth || -3) >= 0 ? 'positive' : 'negative',
      icon: Clock,
      color: 'amber'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Track your business performance and key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-white/20 rounded-lg bg-white/50 backdrop-blur-md text-sm font-medium text-gray-700 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="p-2 border border-white/20 rounded-lg bg-white/50 backdrop-blur-md hover:bg-white/60 transition-colors text-gray-600 hover:text-blue-600">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <MetricCard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-md rounded-lg border border-white/30 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Trends</h3>
              <p className="text-sm text-gray-500 mt-1">Monthly revenue performance</p>
            </div>
            <BarChart3 size={24} className="text-gray-400" />
          </div>

          {salesData.length > 0 ? (
            <div className="h-80 flex items-end justify-between gap-4 p-4 bg-white/40 rounded-lg border border-white/20">
              {salesData.slice(-12).map((item, i) => {
                const maxRevenue = Math.max(...salesData.map(s => s.revenue)) || 1;
                const height = (item.revenue / maxRevenue) * 100;
                const monthName = item.name ? new Date(typeof item.name === 'string' ? item.name : item.name.name || '2024-01-01').toLocaleDateString('en-IN', { month: 'short' }) : 'N/A';
                
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer group hover:shadow-lg"
                        style={{ height: `${Math.max(height, 8)}%`, minHeight: '20px' }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          ₹{(item.revenue || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 mt-3">{monthName}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <ChartPlaceholder title="No Data Available" subtitle="Sales data will appear here" />
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white/60 backdrop-blur-md rounded-lg border border-white/30 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Categories</h3>
              <p className="text-sm text-gray-500 mt-1">By order volume</p>
            </div>
            <Target size={24} className="text-gray-400" />
          </div>

          <div className="space-y-4">
            {orderTrends.slice(0, 5).map((item, i) => {
              const maxOrders = Math.max(...orderTrends.map(o => o.orders)) || 1;
              const percentage = Math.round((item.orders / maxOrders) * 100);
              const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-amber-600', 'bg-rose-600'];
              
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 truncate">
                      {typeof item.name === 'object' ? (item.name?.label || 'N/A') : item.name}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{item.orders}</span>
                  </div>
                  <div className="w-full bg-white/40 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full ${colors[i % 5]} transition-all`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white/60 backdrop-blur-md rounded-lg border border-white/30 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Performing Products</h3>
              <p className="text-sm text-gray-500 mt-1">Revenue and sales contribution</p>
            </div>
            <Award size={24} className="text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20 bg-white/40">
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Product</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Category</th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">Sales</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700">Revenue</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {topProducts.length > 0 ? (
                topProducts.slice(0, 8).map((product, i) => (
                  <tr key={i} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=50&q=80"} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-900">
                      {product.salesCount || 0}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      ₹{(product.revenue || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-emerald-600 font-semibold">
                        <TrendingUp size={16} />
                        <span>+{Math.floor(Math.random() * 30)}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Activity size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No product data available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {topProducts.length > 8 && (
          <div className="px-6 py-4 border-t border-white/20 bg-white/40">
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2">
              View all products
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;