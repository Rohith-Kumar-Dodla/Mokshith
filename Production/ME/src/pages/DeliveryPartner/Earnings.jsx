import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import EarningsCard from '../../components/delivery/EarningsCard';
import { FiDollarSign, FiTrendingUp, FiAward, FiCalendar } from 'react-icons/fi';
import { earnings, weeklyEarnings, monthlyEarnings, bonusStructure } from '../../data/deliveryEarnings';

const Earnings = () => {
  const todayEarnings = earnings.find(e => e.date === '2024-06-06')?.total || 0;
  const weeklyTotal = weeklyEarnings.reduce((sum, w) => sum + w.earnings, 0);
  const monthlyTotal = monthlyEarnings.reduce((sum, m) => sum + m.earnings, 0);
  const totalEarnings = earnings.reduce((sum, e) => sum + e.total, 0);

  const summaryCards = [
    { title: "Today's Earnings", amount: todayEarnings, icon: <FiDollarSign size={24} />, period: 'Today' },
    { title: 'Weekly Earnings', amount: weeklyTotal, icon: <FiCalendar size={24} />, period: 'This Week' },
    { title: 'Monthly Earnings', amount: monthlyTotal, icon: <FiTrendingUp size={24} />, period: 'This Month' },
    { title: 'Total Earnings', amount: totalEarnings, icon: <FiAward size={24} />, period: 'All Time' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Earnings Overview</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Track your earnings and bonuses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {summaryCards.map((card, index) => (
          <EarningsCard key={index} {...card} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Daily Earnings Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Daily Earnings (Last 15 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={earnings.slice(-15)}>
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

        {/* Weekly Earnings Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Weekly Earnings</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyEarnings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Bar dataKey="earnings" fill="#2563EB" name="Earnings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Earnings Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Monthly Earnings Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyEarnings}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value) => `₹${value}`} />
            <Legend />
            <Line type="monotone" dataKey="earnings" stroke="#2563EB" strokeWidth={2} name="Earnings" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Earnings Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Earnings History</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders Completed</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Distance</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Earnings</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bonus</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {earnings.slice().reverse().slice(0, 10).map((item) => (
                <tr key={item.date} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm text-gray-900">{new Date(item.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm text-gray-700">{item.ordersCompleted}</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm text-gray-700">{item.distance} km</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">₹{item.earnings.toFixed(2)}</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm font-semibold text-green-600">₹{item.bonus.toFixed(2)}</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm font-bold text-blue-600">₹{item.total.toFixed(2)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bonus Section */}
      <div>
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Bonus & Incentives</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Object.values(bonusStructure).map((bonus, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg text-yellow-600">
                  <FiAward size={16} />
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900">{bonus.title}</h4>
              </div>
              <p className="text-xs text-gray-600 mb-2 sm:mb-3">{bonus.description}</p>
              <p className="text-sm sm:text-lg font-bold text-green-600">₹{bonus.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Earnings;
