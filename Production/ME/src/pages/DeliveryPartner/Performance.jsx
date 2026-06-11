import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PerformanceCard from '../../components/delivery/PerformanceCard';
import { FiCheckCircle, FiStar, FiClock, FiTrendingUp, FiAward, FiSmile } from 'react-icons/fi';
import { performanceMetrics, performanceTrends, achievements, deliveryTrendData, ratingDistribution } from '../../data/deliveryPerformance';

const Performance = () => {
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  const metricCards = [
    { title: 'Success Rate', value: `${performanceMetrics.successRate}%`, icon: <FiCheckCircle size={24} />, subtitle: 'Excellent performance', color: 'green' },
    { title: 'Average Rating', value: performanceMetrics.averageRating, icon: <FiStar size={24} />, subtitle: 'Out of 5 stars', color: 'orange' },
    { title: 'On-Time Deliveries', value: `${performanceMetrics.onTimeDeliveries}%`, icon: <FiClock size={24} />, subtitle: 'Timeliness score', color: 'blue' },
    { title: 'Completed Deliveries', value: performanceMetrics.completedDeliveries, icon: <FiTrendingUp size={24} />, subtitle: 'Total completed', color: 'purple' },
    { title: 'Cancelled Deliveries', value: performanceMetrics.cancelledDeliveries, icon: <FiCheckCircle size={24} />, subtitle: 'Total cancelled', color: 'red' },
    { title: 'Customer Satisfaction', value: `${performanceMetrics.customerSatisfaction}%`, icon: <FiSmile size={24} />, subtitle: 'Satisfaction rate', color: 'green' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Track your delivery performance and achievements</p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {metricCards.map((card, index) => (
          <PerformanceCard key={index} {...card} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Delivery Trend Chart */}
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

        {/* Success Rate Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Success Rate Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis domain={[85, 100]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="successRate" stroke="#10B981" strokeWidth={2} name="Success Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rating Trend and Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Rating Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Rating Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis domain={[4, 5]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rating" stroke="#F59E0B" strokeWidth={2} name="Average Rating" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ratingDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ rating, count }) => `${rating}★: ${count}`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="count"
              >
                {ratingDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Monthly Performance Overview</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={performanceTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="successRate" stroke="#10B981" strokeWidth={2} name="Success Rate %" />
            <Line yAxisId="right" type="monotone" dataKey="deliveries" stroke="#2563EB" strokeWidth={2} name="Deliveries" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Achievements Section */}
      <div>
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-white rounded-xl border p-3 sm:p-5 hover:shadow-lg transition-shadow ${
                achievement.achieved ? 'border-green-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={`text-2xl sm:text-3xl ${achievement.achieved ? '' : 'grayscale'}`}>
                  {achievement.icon}
                </div>
                <div className={`flex-1 ${achievement.achieved ? '' : 'grayscale'}`}>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900">{achievement.title}</h4>
                  {achievement.achieved && (
                    <p className="text-xs text-green-600">Achieved on {achievement.achievedDate}</p>
                  )}
                </div>
                {achievement.achieved && (
                  <div className="p-1 bg-green-100 rounded-full">
                    <FiCheckCircle size={14} className="sm:size-16 text-green-600" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600">{achievement.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Performance;
