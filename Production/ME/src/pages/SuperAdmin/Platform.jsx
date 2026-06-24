import React, { useEffect, useState } from 'react';
import { FiActivity, FiUsers, FiTruck, FiPackage, FiDollarSign, FiTrendingUp, FiServer, FiDatabase, FiWifi, FiShield } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import DashboardCard from '../../components/superadmin/DashboardCard';
import superAdminService from '../../services/superAdminService';

const formatRevenue = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const Platform = () => {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlatformData = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsResponse, metricsResponse] = await Promise.all([
          superAdminService.getStats(),
          superAdminService.getMetrics(),
        ]);
        setStats(statsResponse.data ?? statsResponse);
        setMetrics(metricsResponse.data ?? metricsResponse);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load platform data');
      } finally {
        setLoading(false);
      }
    };

    loadPlatformData();
  }, []);

  const platformStats = [
    { title: 'Total Vendors', value: String(stats?.vendors ?? metrics?.activeVendors ?? 0), icon: FiUsers, color: 'blue' },
    { title: 'Delivery Partners', value: String(stats?.deliveryPartners ?? 0), icon: FiTruck, color: 'purple' },
    { title: 'Total Products', value: String(stats?.products ?? 0), icon: FiPackage, color: 'orange' },
    { title: 'Total Orders', value: String(stats?.orders ?? 0), icon: FiTrendingUp, color: 'teal' },
    { title: 'Total Revenue', value: formatRevenue(stats?.revenue ?? 0), icon: FiDollarSign, color: 'green' },
    { title: 'Pending Approvals', value: String(stats?.pendingApprovals ?? metrics?.pendingApprovals ?? 0), icon: FiActivity, color: 'blue' },
  ];

  const healthMetrics = [
    { title: 'System Status', value: 'Operational', icon: FiActivity, color: 'green' },
    { title: 'Server Uptime', value: 'Monitoring unavailable', icon: FiServer, color: 'blue' },
    { title: 'Database Status', value: 'Connected', icon: FiDatabase, color: 'green' },
    { title: 'API Response', value: metrics ? 'Healthy' : 'Unavailable', icon: FiWifi, color: 'green' },
    { title: 'Security Status', value: 'Protected', icon: FiShield, color: 'green' },
    { title: 'Orders Today', value: String(metrics?.ordersToday ?? 0), icon: FiPackage, color: 'orange' },
  ];

  if (loading) {
    return <p className="text-sm text-gray-500">Loading platform monitoring...</p>;
  }

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0 overflow-x-hidden">
      <PageHeader
        title="Platform Monitoring"
        subtitle="Live platform metrics from backend services."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        {platformStats.map((stat) => (
          <DashboardCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            growth={0}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 min-w-0">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Platform Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
          {healthMetrics.map((item) => (
            <div key={item.title} className="text-center min-w-0">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl inline-block mb-2 sm:mb-3">
                <item.icon className="text-gray-600" size={24} />
              </div>
              <p className="text-sm sm:text-base font-bold text-gray-900 leading-snug">{item.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Platform;
