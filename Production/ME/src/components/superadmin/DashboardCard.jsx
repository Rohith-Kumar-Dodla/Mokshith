import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const DashboardCard = ({ title, value, growth, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    teal: 'bg-teal-500'
  };

  const bgColorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
    red: 'bg-red-50',
    teal: 'bg-teal-50'
  };

  const textColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    teal: 'text-teal-600'
  };

  const isPositive = growth >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{value}</h3>
          <div className="flex items-center gap-1 sm:gap-2">
            {isPositive ? (
              <FiTrendingUp className="text-green-500" size={14} sm:size={16} />
            ) : (
              <FiTrendingDown className="text-red-500" size={14} sm:size={16} />
            )}
            <span className={`text-xs sm:text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{growth}%
            </span>
            <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">vs last month</span>
          </div>
        </div>
        <div className={`p-3 sm:p-4 rounded-xl ${bgColorClasses[color]} flex-shrink-0`}>
          <Icon className={textColorClasses[color]} size={20} sm:size={28} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(DashboardCard);
