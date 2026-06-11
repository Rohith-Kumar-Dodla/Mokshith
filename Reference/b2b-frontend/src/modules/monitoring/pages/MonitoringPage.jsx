import { useMonitoring } from '../hooks/useMonitoring.js';
import ServiceStatusCard from '../components/ServiceStatusCard.jsx';
import Button from '../../../components/ui/Button.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import { Activity, RefreshCcw, AlertTriangle, Server } from 'lucide-react';

const MonitoringPage = () => {
  const { health, metrics, businessMetrics, loading, error, refetch } = useMonitoring();

  if (loading && !health) {
    return <div className="py-16 text-center text-gray-500">Loading platform health...</div>;
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load monitoring data"
        description={error}
        actionText="Retry"
        onAction={refetch}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Health</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time system monitoring and service status</p>
        </div>
        <Button variant="secondary" size="small" onClick={refetch}>
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Activity size={24} className="text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">System Status</h2>
            <p className="text-sm text-gray-500">
              Uptime: {health?.uptime ? `${Math.floor(health.uptime / 86400)}d` : 'N/A'} ·
              Environment: {health?.environment} ·
              Version: {health?.version}
            </p>
          </div>
          <span className={`ml-auto px-4 py-1.5 rounded-full text-sm font-bold ${
            health?.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {health?.status?.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health?.checks && Object.entries(health.checks).map(([name, check]) => (
            <ServiceStatusCard
              key={name}
              name={name}
              status={check.status}
              details={check}
            />
          ))}
        </div>
      </div>

      {metrics?.alerts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
          <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-4">
            <AlertTriangle size={20} />
            Active Alerts ({metrics.alertCount})
          </h3>
          <div className="space-y-2">
            {metrics.alerts.map((alert, i) => (
              <div key={i} className="text-sm text-amber-700">
                <span className="font-bold uppercase">{alert.level}</span>: {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Server size={20} className="text-blue-600" />
          Application Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Requests" value={metrics?.metrics?.application?.totalRequests?.toLocaleString()} />
          <MetricCard label="Error Rate" value={`${metrics?.metrics?.application?.errorRate}%`} />
          <MetricCard label="Heap Usage" value={`${metrics?.metrics?.memory?.heapUsagePercent}%`} />
          <MetricCard label="Cache Hit Rate" value={`${metrics?.metrics?.cache?.cacheHitRate}%`} />
        </div>
      </div>

      {businessMetrics && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Business Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard label="Total Users" value={businessMetrics.totalUsers?.toLocaleString()} />
            <MetricCard label="Active Vendors" value={businessMetrics.activeVendors} />
            <MetricCard label="Orders Today" value={businessMetrics.ordersToday} />
            <MetricCard label="Revenue Today" value={`₹${(businessMetrics.revenueToday / 100000).toFixed(1)}L`} />
            <MetricCard label="Pending Approvals" value={businessMetrics.pendingApprovals} />
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value }) => (
  <div className="p-4 bg-gray-50 rounded-xl">
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-2xl font-black text-gray-900">{value ?? '—'}</p>
  </div>
);

export default MonitoringPage;
