import React, { useEffect, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { Link } from 'react-router-dom';
import { FiUsers, FiShoppingBag, FiTruck, FiPackage, FiDollarSign, FiTrendingUp, FiActivity, FiClock, FiMonitor, FiBarChart, FiFileText } from 'react-icons/fi';
import DashboardCard from '../../components/superadmin/DashboardCard';
import ActivityFeed from '../../components/superadmin/ActivityFeed';
import PageHeader from '../../components/superadmin/PageHeader';
import superAdminService from '../../services/superAdminService';
import useViewport from '../../hooks/useViewport';

const formatRevenue = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const QUICK_ACTION_COLORS = {
  blue: 'bg-blue-100 group-hover:bg-blue-200 text-blue-600',
  green: 'bg-green-100 group-hover:bg-green-200 text-green-600',
  purple: 'bg-purple-100 group-hover:bg-purple-200 text-purple-600',
  orange: 'bg-orange-100 group-hover:bg-orange-200 text-orange-600',
  teal: 'bg-teal-100 group-hover:bg-teal-200 text-teal-600',
  red: 'bg-red-100 group-hover:bg-red-200 text-red-600',
};

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isMobile } = useViewport();

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
        setError(getUserFacingErrorMessage(err, 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const quickActions = [
    { title: 'Monitor Platform', icon: FiMonitor, color: 'blue', link: '/super-admin/platform' },
    { title: 'Admin Approvals', icon: FiBarChart, color: 'green', link: '/super-admin/user-management?tab=approvals' },
    { title: 'View Vendors', icon: FiShoppingBag, color: 'purple', link: '/super-admin/user-management?tab=vendors' },
    { title: 'View Deliveries', icon: FiTruck, color: 'orange', link: '/super-admin/user-management?tab=delivery' },
    { title: 'View Orders', icon: FiPackage, color: 'teal', link: '/super-admin/orders' },
    { title: 'Generate Report', icon: FiFileText, color: 'red', link: '/super-admin/analytics' },
  ];

  const platformHealth = [
    { title: 'Pending Approvals', value: String(stats?.pendingApprovals ?? metrics?.pendingApprovals ?? 0), icon: FiClock, color: 'orange', to: '/super-admin/user-management?tab=approvals' },
    { title: 'Orders Today', value: String(metrics?.ordersToday ?? 0), icon: FiPackage, color: 'green', to: '/super-admin/orders' },
    { title: 'Revenue Today', value: formatRevenue(metrics?.revenueToday ?? 0), icon: FiDollarSign, color: 'purple' },
    { title: 'Total Users', value: String(stats?.users ?? metrics?.totalUsers ?? 0), icon: FiUsers, color: 'blue', to: '/super-admin/user-management' },
    { title: 'Active Vendors', value: String(metrics?.activeVendors ?? stats?.vendors ?? 0), icon: FiShoppingBag, color: 'teal', to: '/super-admin/user-management?tab=vendors' },
    { title: 'System Status', value: 'Live', icon: FiActivity, color: 'green' },
  ];

  const kpiCards = [
    { title: 'Total Admins', value: String(stats?.admins ?? 0), icon: FiUsers, color: 'green', to: '/super-admin/user-management?tab=admins' },
    { title: 'Total Vendors', value: String(stats?.vendors ?? 0), icon: FiShoppingBag, color: 'green', to: '/super-admin/user-management?tab=vendors' },
    { title: 'Delivery Partners', value: String(stats?.deliveryPartners ?? 0), icon: FiTruck, color: 'purple', to: '/super-admin/user-management?tab=delivery' },
    { title: 'Total Products', value: String(stats?.products ?? 0), icon: FiPackage, color: 'orange' },
    { title: 'Total Orders', value: String(stats?.orders ?? 0), icon: FiTrendingUp, color: 'teal', to: '/super-admin/orders' },
    { title: 'Total Revenue', value: formatRevenue(stats?.revenue ?? 0), icon: FiDollarSign, color: 'red' },
  ];

  if (loading) {
    return <p className="text-sm text-gray-500">Loading dashboard...</p>;
  }

  if (isMobile) {
    return (
      <div className="space-y-4 min-w-0">
        <PageHeader
          title="Super Admin Dashboard"
          subtitle="Monitor and manage the entire B2B ecosystem."
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {kpiCards.map((item) => (
            item.to ? (
              <Link
                key={item.title}
                to={item.to}
                aria-label={`View ${item.title}`}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 block hover:border-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{item.title}</p>
                      <p className="text-lg font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div key={item.title} className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{item.title}</p>
                      <p className="text-lg font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.link} className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-md min-h-[72px]">
                <div className={`p-2 rounded-md ${QUICK_ACTION_COLORS[action.color]}`}><action.icon size={18} /></div>
                <span className="text-xs text-gray-700 text-center">{action.title}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Recent Activity</h2>
          {activities.length > 0 ? <ActivityFeed activities={activities} /> : <p className="text-sm text-gray-500">No recent activity recorded.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0 overflow-x-hidden">
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
        {kpiCards.map((card) => (
          <DashboardCard
            key={card.title}
            title={card.title}
            value={card.value}
            growth={0}
            icon={card.icon}
            color={card.color}
            to={card.to}
          />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 min-w-0">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all group min-h-[88px]"
            >
              <div className={`p-3 sm:p-4 rounded-xl transition-colors ${QUICK_ACTION_COLORS[action.color]}`}>
                <action.icon size={24} />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">{action.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 min-w-0">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Platform Health</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {platformHealth.map((item) => {
            const inner = (
              <>
                <div className="p-3 sm:p-4 bg-gray-50 rounded-xl inline-block mb-2 sm:mb-3">
                  <item.icon className="text-gray-600" size={24} />
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{item.value}</p>
                <p className="text-xs sm:text-sm text-gray-500">{item.title}</p>
              </>
            );
            if (item.to) {
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  aria-label={`View ${item.title}`}
                  className="text-center min-w-0 rounded-xl p-2 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {inner}
                </Link>
              );
            }
            return (
              <div key={item.title} className="text-center min-w-0">
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 min-w-0">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Recent Activity</h2>
        {activities.length > 0 ? (
          <ActivityFeed activities={activities} />
        ) : (
          <p className="text-sm text-gray-500">No recent activity recorded.</p>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
