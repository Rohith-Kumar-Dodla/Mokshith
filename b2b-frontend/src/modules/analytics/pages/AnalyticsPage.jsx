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
  Activity, 
  ArrowUpRight,
  RefreshCcw, 
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  Search,
  LayoutGrid,
  Zap,
  Award
} from 'lucide-react';
import "../../admin/pages/AdminShared.css";

const SkeletonCard = () => (
  <div className="admin-card p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-gray-100 rounded"></div>
        <div className="h-8 w-32 bg-gray-100 rounded"></div>
      </div>
      <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
    </div>
    <div className="h-3 w-40 bg-gray-100 rounded"></div>
  </div>
);

const MetricCard = ({ title, value, change, changeType, icon: Icon, color }) => {
  const isPositive = changeType === 'positive';
  
  return (
    <div className="admin-card p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-primary/10 text-primary border border-primary/20`}>
          <Icon size={22} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-muted uppercase tracking-[0.1em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-main tracking-tighter">{value}</h3>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[10px] text-muted font-bold">vs. last period</span>
          <ArrowUpRight size={12} className={isPositive ? 'text-emerald-500' : 'text-rose-500 rotate-90'} />
        </div>
      </div>
    </div>
  );
};

const ChartPlaceholder = ({ title, subtitle, height = 'h-80' }) => (
  <div className={`${height} admin-card border-dashed flex flex-col items-center justify-center text-center p-6`}>
    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
      <Activity size={32} className="text-primary/30" />
    </div>
    <p className="font-black text-main tracking-tight uppercase text-sm">{title}</p>
    <p className="text-xs text-muted font-bold mt-1 uppercase tracking-wider">{subtitle}</p>
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
      
      const confirmedOrders = allOrders.filter(order => 
        order.paymentStatus === 'PAID' || order.paymentMethod === 'COD'
      );

      if (confirmedOrders.length === 0) {
        alert("No confirmed orders found to export.");
        return;
      }

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
      link.setAttribute("download", `mokshith_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };
  const orderTrends = Array.isArray(rawOrderTrends) ? rawOrderTrends : [];
  const topProducts = Array.isArray(rawTopProducts) ? rawTopProducts : [];

  if (loading) {
    return (
      <div className="admin-page-content animate-pulse">
        <div className="admin-page-header">
          <div className="page-title-section">
            <div className="h-10 w-64 bg-gray-100 rounded-xl mb-2"></div>
            <div className="h-4 w-96 bg-gray-50 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[450px] bg-gray-50 rounded-[2rem] border border-gray-100"></div>
          <div className="h-[450px] bg-gray-50 rounded-[2rem] border border-gray-100"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-content flex flex-col items-center justify-center py-32">
        <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 text-center max-w-md">
          <Activity size={64} className="mx-auto mb-6 text-red-400" />
          <h3 className="text-2xl font-black text-main mb-2">Analytics Unavailable</h3>
          <p className="text-red-600 font-medium mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} />
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboard || {};
  
  const kpis = [
    {
      title: 'Gross Revenue',
      value: `₹${(stats.revenue || 0).toLocaleString('en-IN')}`,
      change: stats.revenueGrowth || 12.5,
      changeType: (stats.revenueGrowth || 12.5) >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: 'Order Volume',
      value: (stats.totalOrders || 0).toLocaleString(),
      change: stats.ordersGrowth || 8.2,
      changeType: (stats.ordersGrowth || 8.2) >= 0 ? 'positive' : 'negative',
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Active Accounts',
      value: (stats.activeUsers || 0).toLocaleString(),
      change: stats.userGrowth || 5.1,
      changeType: (stats.userGrowth || 5.1) >= 0 ? 'positive' : 'negative',
      icon: Users,
      color: 'indigo'
    },
    {
      title: 'Pending Action',
      value: (stats.pendingDeliveries || 0).toString(),
      change: stats.deliveryGrowth || -3.4,
      changeType: (stats.deliveryGrowth || -3.4) >= 0 ? 'positive' : 'negative',
      icon: Clock,
      color: 'amber'
    }
  ];

  return (
    <div className="admin-page-content animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title flex items-center gap-3">
            Market Intelligence
            <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
          </h1>
          <p className="page-subtitle">Strategic growth indicators and real-time operational performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white border border-border p-1.5 rounded-2xl shadow-sm flex items-center gap-1">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                  dateRange === range 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-muted hover:text-main hover:bg-gray-50'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="bg-main text-white px-6 py-3.5 rounded-2xl font-black text-[10px] tracking-widest hover:bg-primary transition-all flex items-center gap-3 shadow-xl shadow-main/10 disabled:opacity-50 group"
          >
            {isExporting ? <RefreshCcw size={16} className="animate-spin" /> : <FileSpreadsheet size={16} className="group-hover:rotate-12 transition-transform" />}
            EXPORT REPORT
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <MetricCard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 admin-card p-8 md:p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
            <BarChart3 size={150} />
          </div>
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-main tracking-tight">Revenue Trajectory</h3>
              <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">Growth performance by period</p>
            </div>
            <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Revenue (INR)</span>
            </div>
          </div>

          {salesData.length > 0 ? (
            <div className="h-80 flex items-end justify-around gap-3 px-4 relative z-10">
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
                
                return (
                  <div key={i} className="flex flex-col items-center group flex-1 max-w-[50px]">
                    <div className="relative w-full h-full flex flex-col justify-end items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-primary to-primary/70 rounded-xl hover:from-primary hover:to-primary transition-all duration-500 cursor-pointer relative shadow-lg shadow-primary/10 group-hover:scale-y-105 origin-bottom"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-main text-white text-[10px] font-black px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 shadow-2xl scale-75 group-hover:scale-100 whitespace-nowrap">
                          ₹{(item.revenue || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-muted mt-4 group-hover:text-primary transition-colors uppercase tracking-widest">{label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <ChartPlaceholder title="Insufficient Data" subtitle="Continue processing orders to see revenue trends" />
          )}
        </div>

        {/* Category Performance */}
        <div className="admin-card p-10 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-main tracking-tight">Category Mix</h3>
              <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">Order Volume Distribution</p>
            </div>
            <LayoutGrid size={24} className="text-primary/20" />
          </div>

          <div className="space-y-8 flex-1">
            {orderTrends.length > 0 ? orderTrends.slice(0, 5).map((item, i) => {
              const maxOrders = Math.max(...orderTrends.map(o => o.orders)) || 1;
              const percentage = Math.round((item.orders / maxOrders) * 100);
              const colors = ['bg-primary', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
              const name = typeof item.name === 'object' ? (item.name?.label || 'N/A') : item.name;
              
              return (
                <div key={i} className="group cursor-default">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-main group-hover:text-primary transition-colors uppercase tracking-widest">
                      {name}
                    </span>
                    <span className="text-xs font-black text-main">{item.orders}</span>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-3 border border-border p-0.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${colors[i % 5]} transition-all duration-1000 shadow-sm`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-primary/20">
                  <LayoutGrid size={32} className="text-primary/20" />
                </div>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">No segments found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="admin-card overflow-hidden">
        <div className="p-8 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-main tracking-tight">Performance Leaderboard</h3>
            <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">Ranking products by net revenue contribution</p>
          </div>
          <button 
            onClick={() => navigate(routes.ADMIN_PRODUCTS)}
            className="bg-primary/5 text-primary px-6 py-3 rounded-xl font-black text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all group flex items-center gap-2"
          >
            VIEW PRODUCTS
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Category</th>
                <th className="text-center">Unit Sales</th>
                <th className="text-right">Net Revenue</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? topProducts.map((product, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-border text-lg font-black text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-black text-main line-clamp-1">{product.name}</p>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest">ID: {product.id?.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge pending">
                      {product.category || 'General'}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="font-black text-main">{product.sales || 0}</span>
                  </td>
                  <td className="text-right">
                    <span className="font-black text-main">₹{(product.revenue || 0).toLocaleString()}</span>
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => navigate(`${routes.ADMIN_PRODUCTS}/${product.id}`)}
                      className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Sparkles size={40} className="text-primary/20" />
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest">No products ranked yet</p>
                    </div>
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