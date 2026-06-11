import React from 'react';
import { FiActivity, FiUsers, FiTruck, FiPackage, FiDollarSign, FiTrendingUp, FiCheckCircle, FiAlertTriangle, FiServer, FiDatabase, FiWifi, FiShield } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import DashboardCard from '../../components/superadmin/DashboardCard';

const Platform = () => {
  const healthMetrics = [
    { title: 'System Status', value: 'Healthy', icon: FiActivity, color: 'green' },
    { title: 'Server Uptime', value: '99.9%', icon: FiServer, color: 'blue' },
    { title: 'Database Status', value: 'Optimal', icon: FiDatabase, color: 'green' },
    { title: 'API Response', value: '45ms', icon: FiWifi, color: 'green' },
    { title: 'Security Status', value: 'Secure', icon: FiShield, color: 'green' },
    { title: 'Error Rate', value: '0.01%', icon: FiAlertTriangle, color: 'orange' },
  ];

  const platformStats = [
    { title: 'Total Vendors', value: '78', change: '+18%', icon: FiUsers, color: 'blue' },
    { title: 'Delivery Partners', value: '45', change: '+7%', icon: FiTruck, color: 'purple' },
    { title: 'Total Products', value: '1,567', change: '+15%', icon: FiPackage, color: 'orange' },
    { title: 'Total Orders', value: '4,400', change: '+22%', icon: FiTrendingUp, color: 'teal' },
    { title: 'Total Revenue', value: '₹34.9L', change: '+28%', icon: FiDollarSign, color: 'green' },
    { title: 'Success Rate', value: '94%', change: '+2%', icon: FiCheckCircle, color: 'blue' },
  ];

  const recentAlerts = [
    { type: 'info', message: 'System backup completed successfully', time: '2 hours ago' },
    { type: 'warning', message: 'High server load detected (75%)', time: '4 hours ago' },
    { type: 'success', message: 'Database optimization completed', time: '6 hours ago' },
    { type: 'info', message: 'New security patch applied', time: '1 day ago' },
    { type: 'success', message: 'API response time improved by 15%', time: '2 days ago' },
  ];

  const getAlertColor = (type) => {
    const colors = {
      info: 'bg-blue-100 text-blue-600',
      warning: 'bg-orange-100 text-orange-600',
      success: 'bg-green-100 text-green-600',
      error: 'bg-red-100 text-red-600',
    };
    return colors[type] || colors.info;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Platform Monitoring"
        subtitle="Monitor platform health, performance, and system metrics in real-time."
      />

      {/* Health Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">System Health</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {healthMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl inline-block mb-2 sm:mb-3">
                <metric.icon className="text-gray-600" size={20} sm:size={24} />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-xs sm:text-sm text-gray-500">{metric.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        {platformStats.map((stat, index) => (
          <DashboardCard
            key={index}
            title={stat.title}
            value={stat.value}
            growth={parseInt(stat.change)}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Recent System Alerts</h2>
        <div className="space-y-3 sm:space-y-4">
          {recentAlerts.map((alert, index) => (
            <div key={index} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-lg ${getAlertColor(alert.type)} flex-shrink-0`}>
                {alert.type === 'info' && <FiActivity size={16} />}
                {alert.type === 'warning' && <FiAlertTriangle size={16} />}
                {alert.type === 'success' && <FiCheckCircle size={16} />}
                {alert.type === 'error' && <FiAlertTriangle size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Platform;
