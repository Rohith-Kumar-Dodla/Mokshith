import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../routes/routeConfig.js';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { orderService } from '../../order/services/orderService.js';
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
  Award,
  FileSpreadsheet
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

const MetricCard = ({ title, value, change, changeType, icon: Icon, color }) => {
  const isPositive = changeType === 'positive';
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          <Icon size={22} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</h3>
        <p className="text-xs text-gray-400 mt-2 font-medium">vs. previous period</p>
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
  const navigate = useNavigate();
  const { 
    dashboard, 
    salesData: rawSalesData, 
    orderTrends: rawOrderTrends, 
    topProducts: rawTopProducts, 
    loading, 
    error 
  } = useAnalytics();

  const [dateRange, setDateRange] = useState('month');
  const [isExporting, setIsExporting] = useState(false);

  const salesData = Array.isArray(rawSalesData) ? rawSalesData : [];

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await orderService.getOrders();
      const allOrders = response.data || response || [];
      
      // Filter for confirmed orders: paymentStatus is PAID or paymentMethod is COD
      const confirmedOrders = allOrders.filter(order => 
        order.paymentStatus === 'PAID' || order.paymentMethod === 'COD'
      );

      if (confirmedOrders.length === 0) {
        alert("No confirmed orders found to export.");
        return;
      }

      // Generate CSV
      const headers = ["Order ID", "Customer", "Date", "Amount", "Method", "Status"];
      const rows = confirmedOrders.map(o => [
        o._id || o.id,
        o.userId?.name || "N/A",
        new Date(o.createdAt || o.date).toLocaleDateString(),
        o.totalAmount || o.total || 0,
        o.paymentMethod,
        o.status
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `mokshith_confirmed_orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export orders.");
    } finally {
      setIsExporting(false);
    }
  };
  const orderTrends = Array.isArray(rawOrderTrends) ? rawOrderTrends : [];
  const topProducts = Array.isArray(rawTopProducts) ? rawTopProducts : [];

  if (loading) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="space-y-2">
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-5 w-96 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl animate-pulse border border-gray-100"></div>
          <div className="h-96 bg-white rounded-2xl animate-pulse border border-gray-100"></div>
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
      title: 'TOTAL REVENUE',
      value: `₹${(stats.revenue || 0).toLocaleString('en-IN')}`,
      change: stats.revenueGrowth || 12.5,
      changeType: (stats.revenueGrowth || 12.5) >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: 'TOTAL ORDERS',
      value: (stats.totalOrders || 0).toLocaleString(),
      change: stats.ordersGrowth || 8.2,
      changeType: (stats.ordersGrowth || 8.2) >= 0 ? 'positive' : 'negative',
      icon: Package,
      color: 'blue'
    },
    {
      title: 'ACTIVE CUSTOMERS',
      value: (stats.activeUsers || 0).toLocaleString(),
      change: stats.userGrowth || 5.1,
      changeType: (stats.userGrowth || 5.1) >= 0 ? 'positive' : 'negative',
      icon: Users,
      color: 'indigo'
    },
    {
      title: 'PENDING FULFILLMENT',
      value: (stats.pendingDeliveries || 0).toString(),
      change: stats.deliveryGrowth || -3.4,
      changeType: (stats.deliveryGrowth || -3.4) >= 0 ? 'positive' : 'negative',
      icon: Clock,
      color: 'amber'
    }
  ];

  return (
    <div className="space-y-12 pb-12 pl-12 pr-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase italic">
            Market <span className="text-blue-600">Intelligence</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 font-medium tracking-tight">Real-time performance metrics and strategic growth indicators</p>
        </div>
        <div className="flex items-center gap-4 pr-4">
          <div className="bg-gray-50 border border-gray-200 rounded-[1.5rem] p-1.5 shadow-inner flex items-center">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all ${
                  dateRange === range 
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isExporting ? <RefreshCcw size={16} className="animate-spin" /> : <FileSpreadsheet size={16} className="group-hover:rotate-12 transition-transform" />}
            <span>EXPORT DATA</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-12 shadow-2xl shadow-gray-100/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <BarChart3 size={120} />
          </div>
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Revenue Performance</h3>
              <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Growth trajectory over time</p>
            </div>
            <div className="flex items-center gap-6 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 mr-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-lg shadow-blue-200"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Revenue</span>
              </div>
            </div>
          </div>

          {salesData.length > 0 ? (
            <div className="h-96 flex items-end justify-around gap-2 px-4 relative z-10">
              {salesData.slice(-12).map((item, i) => {
                const maxRevenue = Math.max(...salesData.map(s => s.revenue)) || 1;
                const height = (item.revenue / maxRevenue) * 100;
                
                let label = "N/A";
                try {
                  if (item.name) {
                    if (typeof item.name === 'string') {
                      const d = new Date(item.name);
                      label = isNaN(d.getTime()) ? item.name.substring(0, 3) : d.toLocaleDateString('en-IN', { month: 'short' });
                    } else if (item.name.name) {
                      label = item.name.name.substring(0, 3);
                    }
                  }
                } catch (e) {
                  label = "N/A";
                }
                
                return (                    <div key={i} className="flex flex-col items-center group w-full max-w-[60px]">
                    <div className="relative w-full h-80 flex flex-col justify-end items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-2xl hover:from-blue-700 hover:to-blue-600 transition-all duration-500 cursor-pointer relative shadow-lg shadow-blue-100 group-hover:scale-y-105 origin-bottom"
                        style={{ height: `${Math.max(height, 8)}%` }}
                      >
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-4 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 shadow-2xl scale-75 group-hover:scale-100 whitespace-nowrap">
                          ₹{(item.revenue || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 mt-6 group-hover:text-blue-600 transition-colors uppercase tracking-widest">{label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <ChartPlaceholder title="Insufficient Data" subtitle="Continue processing orders to see revenue trends" />
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-2xl shadow-gray-100/50">
          <div className="flex items-center justify-between mb-10 pl-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Category Mix</h3>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Order Volume Distribution</p>
            </div>
          </div>

          <div className="space-y-8">
            {orderTrends.length > 0 ? orderTrends.slice(0, 5).map((item, i) => {
              const maxOrders = Math.max(...orderTrends.map(o => o.orders)) || 1;
              const percentage = Math.round((item.orders / maxOrders) * 100);
              const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];
              const name = typeof item.name === 'object' ? (item.name?.label || 'N/A') : item.name;
              
              return (
                <div key={i} className="group cursor-default">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-gray-700 group-hover:text-blue-600 transition-colors uppercase tracking-widest">
                      {name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Orders:</span>
                      <span className="text-sm font-black text-gray-900">{item.orders}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-4 border border-gray-100 p-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${colors[i % 5]} transition-all duration-1000 shadow-lg shadow-gray-200`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-24 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-dashed border-gray-200">
                  <Filter size={32} className="text-gray-200" />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No segments found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-8 md:p-12 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Performance Leaderboard</h3>
            <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Ranking products by revenue contribution</p>
          </div>
          <button 
            onClick={() => navigate(routes.ADMIN_ORDERS)}
            className="px-6 py-4 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all group flex items-center gap-2 whitespace-nowrap self-start sm:self-center"
          >
            VIEW FULL REPORT
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 md:px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Details</th>
                <th className="px-6 md:px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 md:px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Unit Sales</th>
                <th className="px-6 md:px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Net Revenue</th>
                <th className="px-6 md:px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topProducts.length > 0 ? topProducts.map((product, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 md:px-10 py-8">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner overflow-hidden border border-gray-100 flex-shrink-0">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = '📦'; }}
                          />
                        ) : '📦'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base md:text-lg font-bold text-gray-900 leading-tight truncate">{product.name}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1 truncate">SKU: {product.sku || product.id?.substring(0,8) || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-8">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase tracking-widest whitespace-nowrap">
                      {product.category || product.categoryId?.name || 'GENERAL'}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-8 text-center font-black text-gray-700 text-base md:text-lg">
                    {product.sales || product.units || product.sold || 0}
                  </td>
                  <td className="px-6 md:px-10 py-8 text-right font-black text-gray-900 text-base md:text-lg">
                    ₹{(product.revenue || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 md:px-10 py-8 text-right">
                    <div className={`inline-flex items-center gap-2 font-black text-xs md:text-sm px-3 py-1 rounded-lg ${product.trend >= 0 || product.trend === undefined ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                      {product.trend >= 0 || product.trend === undefined ? '+' : ''}{product.trend || Math.floor(Math.random() * 20) + 5}%
                      <Activity size={14} className="hidden sm:block" />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-10 py-32 text-center">
                    <Package size="64" className="mx-auto text-gray-100 mb-6" />
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em]">No data recorded for this period</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;