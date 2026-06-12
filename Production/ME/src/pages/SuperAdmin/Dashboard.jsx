import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiShoppingBag, FiTruck, FiPackage, FiDollarSign, FiTrendingUp, FiActivity, FiClock, FiMonitor, FiBarChart, FiFileText } from 'react-icons/fi';
import DashboardCard from '../../components/superadmin/DashboardCard';
import ActivityFeed from '../../components/superadmin/ActivityFeed';
import PageHeader from '../../components/superadmin/PageHeader';
import superAdminService from '../../services/superAdminService';

const formatRevenue = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [statsResponse, metricsResponse, auditResponse] = await Promise.all([
          superAdminService.getStats(),
          superAdminService.getMetrics(),
          superAdminService.getAuditLogs({ limit: 5 }),
        ]);

        setStats(statsResponse.data ?? statsResponse);
        setMetrics(metricsResponse.data ?? metricsResponse);

        const logs = auditResponse.data ?? auditResponse;
        const auditActivities = (Array.isArray(logs) ? logs : []).map((log) => ({
          type: String(log.action || 'activity').toLowerCase(),
          title: log.action || 'Activity',
          description: log.details || 'System activity recorded',
          time: log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : 'Recently',
        }));
        setActivities(auditActivities);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const quickActions = [
    { title: 'Monitor Platform', icon: FiMonitor, color: 'blue', link: '/super-admin/platform' },
    { title: 'Admin Approvals', icon: FiBarChart, color: 'green', link: '/super-admin/admin-approvals' },
    { title: 'View Vendors', icon: FiShoppingBag, color: 'purple', link: '/super-admin/vendors' },
    { title: 'View Deliveries', icon: FiTruck, color: 'orange', link: '/super-admin/delivery-partners' },
    { title: 'View Orders', icon: FiPackage, color: 'teal', link: '/super-admin/orders' },
    { title: 'Generate Report', icon: FiFileText, color: 'red', link: '/super-admin/analytics' },
  ];

  const platformHealth = [
    { title: 'Pending Approvals', value: String(stats?.pendingApprovals ?? metrics?.pendingApprovals ?? 0), icon: FiClock, color: 'orange' },
    { title: 'Orders Today', value: String(metrics?.ordersToday ?? 0), icon: FiPackage, color: 'green' },
    { title: 'Revenue Today', value: formatRevenue(metrics?.revenueToday ?? 0), icon: FiDollarSign, color: 'purple' },
    { title: 'Total Users', value: String(stats?.users ?? metrics?.totalUsers ?? 0), icon: FiUsers, color: 'blue' },
    { title: 'Active Vendors', value: String(metrics?.activeVendors ?? stats?.vendors ?? 0), icon: FiShoppingBag, color: 'teal' },
    { title: 'System Status', value: 'Live', icon: FiActivity, color: 'green' },
  ];

  if (loading) {
    return <p className="text-sm text-gray-500">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Monitor and manage the entire B2B ecosystem."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        <DashboardCard
          title="Total Admins"
          value={String(stats?.admins ?? 0)}
          growth={0}
          icon={FiUsers}
          color="green"
        />
        <DashboardCard
          title="Total Vendors"
          value={String(stats?.vendors ?? 0)}
          growth={0}
          icon={FiShoppingBag}
          color="green"
        />
        <DashboardCard
          title="Delivery Partners"
          value={String(stats?.deliveryPartners ?? 0)}
          growth={0}
          icon={FiTruck}
          color="purple"
        />
        <DashboardCard
          title="Total Products"
          value={String(stats?.products ?? 0)}
          growth={0}
          icon={FiPackage}
          color="orange"
        />
        <DashboardCard
          title="Total Orders"
          value={String(stats?.orders ?? 0)}
          growth={0}
          icon={FiTrendingUp}
          color="teal"
        />
        <DashboardCard
          title="Total Revenue"
          value={formatRevenue(stats?.revenue ?? 0)}
          growth={0}
          icon={FiDollarSign}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Recent Activity</h2>
          {activities.length > 0 ? (
            <ActivityFeed activities={activities} />
          ) : (
            <p className="text-sm text-gray-500">No recent activity recorded.</p>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.link}
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all group min-h-[88px]"
              >
                <div className={`p-3 sm:p-4 rounded-xl bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                  <action.icon className={`text-${action.color}-600`} size={24} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">{action.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Platform Health</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {platformHealth.map((item) => (
            <div key={item.title} className="text-center">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl inline-block mb-2 sm:mb-3">
                <item.icon className="text-gray-600" size={24} />
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
