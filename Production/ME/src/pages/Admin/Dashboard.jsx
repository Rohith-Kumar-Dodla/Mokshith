import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiShoppingCart, FiTruck, FiUsers, FiDollarSign, FiCheckCircle, FiPlus, FiPackage, FiTrendingUp, FiUserPlus, FiFileText, FiArrowRight, FiGrid } from 'react-icons/fi';
import Card from '../../components/admin/Card';
import adminService from '../../services/adminService';
import analyticsService from '../../services/analyticsService';
import useNotifications from '../../hooks/useNotifications';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { notifications } = useNotifications();

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsPayload, analyticsPayload] = await Promise.all([
          adminService.getStats(),
          analyticsService.getDashboard(),
        ]);
        setStats(statsPayload?.data ?? statsPayload);
        setAnalytics(analyticsPayload?.data ?? analyticsPayload);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const dashboard = analytics?.dashboard || {};
  const summaryCards = useMemo(() => [
    { title: 'Total Orders', value: String(stats?.totalOrders ?? dashboard.totalOrders ?? '—'), icon: FiShoppingCart, change: `${dashboard.ordersGrowth >= 0 ? '+' : ''}${dashboard.ordersGrowth ?? 0}%`, color: 'orange' },
    { title: 'Total Vendors', value: String(stats?.totalVendors ?? '—'), icon: FiUsers, change: '+0%', color: 'green' },
    { title: 'Delivery Partners', value: String(stats?.totalDeliveryPartners ?? '—'), icon: FiTruck, change: '+0%', color: 'red' },
    { title: 'Pending Deliveries', value: String(dashboard.pendingDeliveries ?? '—'), icon: FiTruck, change: '—', color: 'red' },
    { title: 'Revenue', value: formatCurrency(stats?.revenue ?? dashboard.revenue), icon: FiDollarSign, change: `${dashboard.revenueGrowth >= 0 ? '+' : ''}${dashboard.revenueGrowth ?? 0}%`, color: 'green' },
    { title: 'Pending Approvals', value: String(stats?.pendingApprovals ?? '—'), icon: FiUserPlus, change: '—', color: 'purple' },
    { title: 'Total Admins', value: String(stats?.totalAdmins ?? '—'), icon: FiGrid, change: '—', color: 'blue' },
    { title: 'Active Customers', value: String(dashboard.activeCustomers ?? '—'), icon: FiUsers, change: '—', color: 'blue' },
  ], [stats, dashboard]);

  const quickActions = [
    { title: 'Add Product', icon: FiPlus, description: 'Add new product to catalog', color: 'blue', path: '/admin/products' },
    { title: 'Update Inventory', icon: FiPackage, description: 'Manage stock levels', color: 'green', path: '/admin/inventory' },
    { title: 'Approve Vendor', icon: FiUserPlus, description: 'Review vendor applications', color: 'purple', path: '/admin/vendors' },
    { title: 'Assign Delivery', icon: FiTruck, description: 'Assign delivery partners', color: 'orange', path: '/admin/delivery-assignment' },
    { title: 'View Orders', icon: FiShoppingCart, description: 'View all orders', color: 'blue', path: '/admin/orders' },
    { title: 'Generate Report', icon: FiFileText, description: 'Download reports', color: 'red', path: '/admin/reports' },
  ];

  const todayPerformance = [
    { title: 'Total Orders', value: String(stats?.totalOrders ?? '—'), icon: FiShoppingCart, trend: `${dashboard.ordersGrowth >= 0 ? '+' : ''}${dashboard.ordersGrowth ?? 0}%` },
    { title: 'Total Users', value: String(stats?.totalUsers ?? '—'), icon: FiCheckCircle, trend: '—' },
    { title: 'Pending Deliveries', value: String(dashboard.pendingDeliveries ?? '—'), icon: FiTruck, trend: '—' },
    { title: 'Total Vendors', value: String(stats?.totalVendors ?? '—'), icon: FiUserPlus, trend: '—' },
    { title: 'Revenue', value: formatCurrency(stats?.revenue ?? dashboard.revenue), icon: FiDollarSign, trend: `${dashboard.revenueGrowth >= 0 ? '+' : ''}${dashboard.revenueGrowth ?? 0}%` },
  ];

  const recentActivities = notifications.slice(0, 6).map((notification) => ({
    id: notification.id,
    title: notification.title,
    description: notification.message,
    time: notification.time,
    icon: FiPackage,
    color: notification.isRead ? 'blue' : 'green',
  }));

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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      )}

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
                <Link to={action.path} className="flex items-start gap-3 sm:gap-4">
                  <div className={`p-2 sm:p-3 rounded-lg ${colors.bg} group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <action.icon size={16} sm:size={20} className={colors.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">{action.description}</p>
                  </div>
                  <FiArrowRight className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" size={16} sm:size={20} />
                </Link>
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
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500">No recent notifications.</p>
            ) : recentActivities.map((activity) => {
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
              <span className="text-xs sm:text-sm font-bold text-gray-900">{stats?.totalVendors ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-green-100 flex-shrink-0">
                  <FiTruck size={16} sm:size={20} className="text-green-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Delivery Partners</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-900">{stats?.totalDeliveryPartners ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-orange-100 flex-shrink-0">
                  <FiBox size={16} sm:size={20} className="text-orange-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Total Orders</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-900">{stats?.totalOrders ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
                  <FiPackage size={16} sm:size={20} className="text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Pending Approvals</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-900">{stats?.pendingApprovals ?? '—'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
