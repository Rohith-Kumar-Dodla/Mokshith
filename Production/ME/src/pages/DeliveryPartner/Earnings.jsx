import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import EarningsCard from '../../components/delivery/EarningsCard';
import { FiDollarSign, FiTrendingUp, FiAward, FiCalendar } from 'react-icons/fi';
import useDelivery from '../../hooks/useDelivery';

const Earnings = () => {
  const { earningsSeries, analytics, loading, error } = useDelivery();

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayEntry = earningsSeries.find((entry) => entry.date === todayKey);

  const todayEarnings = todayEntry?.total ?? analytics?.today?.todaysEarnings ?? 0;
  const weeklyTotal = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return earningsSeries
      .filter((entry) => new Date(entry.date) >= weekAgo)
      .reduce((sum, entry) => sum + Number(entry.total || 0), 0);
  }, [earningsSeries]);
  const monthlyTotal = analytics?.today?.monthlyEarnings ?? 0;
  const totalEarnings = earningsSeries.reduce((sum, entry) => sum + Number(entry.total || 0), 0);

  const summaryCards = [
    { title: "Today's Earnings", amount: todayEarnings, icon: <FiDollarSign size={24} />, period: 'Today' },
    { title: 'Weekly Earnings', amount: weeklyTotal, icon: <FiCalendar size={24} />, period: 'This Week' },
    { title: 'Monthly Earnings', amount: monthlyTotal, icon: <FiTrendingUp size={24} />, period: 'This Month' },
    { title: 'Total Earnings', amount: totalEarnings, icon: <FiAward size={24} />, period: 'All Time' },
  ];

  const chartData = earningsSeries.slice(-15);
  const weeklyChartData = earningsSeries.slice(-7);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Earnings Overview</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Earnings Overview</h1>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Earnings Overview</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Track your earnings and bonuses</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {summaryCards.map((card, index) => (
          <EarningsCard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Daily Earnings (Last 15 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => `₹${value}`} labelFormatter={(value) => new Date(value).toLocaleDateString()} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2} name="Total Earnings" />
              <Line type="monotone" dataKey="earnings" stroke="#10B981" strokeWidth={2} name="Base Earnings" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Weekly Deliveries & Earnings</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="deliveries" fill="#2563EB" name="Deliveries" />
              <Bar dataKey="total" fill="#10B981" name="Earnings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Earnings;
