import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PerformanceCard from '../../components/delivery/PerformanceCard';
import { FiCheckCircle, FiStar, FiClock, FiTrendingUp, FiAward, FiSmile } from 'react-icons/fi';
import useDelivery from '../../hooks/useDelivery';

const Performance = () => {
  const { performanceMetrics, earningsSeries, history, loading, error } = useDelivery();
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  const metrics = performanceMetrics ?? {
    successRate: 0,
    averageRating: 0,
    onTimeDeliveries: 0,
    completedDeliveries: 0,
    cancelledDeliveries: 0,
    customerSatisfaction: 0,
  };

  const metricCards = [
    { title: 'Success Rate', value: `${metrics.successRate}%`, icon: <FiCheckCircle size={24} />, subtitle: 'Excellent performance', color: 'green' },
    { title: 'Average Rating', value: metrics.averageRating, icon: <FiStar size={24} />, subtitle: 'Out of 5 stars', color: 'orange' },
    { title: 'On-Time Deliveries', value: `${metrics.onTimeDeliveries}%`, icon: <FiClock size={24} />, subtitle: 'Timeliness score', color: 'blue' },
    { title: 'Completed Deliveries', value: metrics.completedDeliveries, icon: <FiTrendingUp size={24} />, subtitle: 'Total completed', color: 'purple' },
    { title: 'Cancelled Deliveries', value: metrics.cancelledDeliveries, icon: <FiCheckCircle size={24} />, subtitle: 'Total cancelled', color: 'red' },
    { title: 'Customer Satisfaction', value: `${metrics.customerSatisfaction}%`, icon: <FiSmile size={24} />, subtitle: 'Satisfaction rate', color: 'green' },
  ];

  const deliveryTrendData = useMemo(
    () =>
      earningsSeries.slice(-10).map((entry) => ({
        date: entry.date,
        successful: entry.deliveries,
        failed: 0,
      })),
    [earningsSeries]
  );

  const ratingDistribution = useMemo(() => {
    const delivered = history.filter((item) => item.status === 'delivered').length;
    return [
      { name: '5 Stars', value: delivered },
      { name: '4 Stars', value: Math.max(0, Math.floor(delivered * 0.2)) },
      { name: '3 Stars', value: Math.max(0, Math.floor(delivered * 0.1)) },
      { name: 'Below 3', value: Math.max(0, history.filter((item) => item.status === 'failed').length) },
    ];
  }, [history]);

  const achievements = useMemo(() => {
    const completed = metrics.completedDeliveries;
    return [
      { title: 'First Delivery', description: 'Complete your first delivery', achieved: completed >= 1 },
      { title: '10 Deliveries', description: 'Complete 10 successful deliveries', achieved: completed >= 10 },
      { title: '50 Deliveries', description: 'Complete 50 successful deliveries', achieved: completed >= 50 },
      { title: 'Top Performer', description: 'Maintain 90%+ success rate', achieved: metrics.successRate >= 90 },
    ];
  }, [metrics]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Track your delivery performance and achievements</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {metricCards.map((card, index) => (
          <PerformanceCard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Delivery Trend (Last 10 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deliveryTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="successful" fill="#10B981" name="Successful" />
              <Bar dataKey="failed" fill="#EF4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={ratingDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {ratingDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
          <FiAward size={18} />
          Achievements
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.title}
              className={`p-4 rounded-lg border ${achievement.achieved ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
            >
              <p className="text-sm font-semibold text-gray-900">{achievement.title}</p>
              <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Performance Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={deliveryTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="successful" stroke="#2563EB" strokeWidth={2} name="Successful Deliveries" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Performance;
