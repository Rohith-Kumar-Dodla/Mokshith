import React from 'react';

const AnalyticsCard = ({ title, value, change, icon, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  const trendColor = trend && trend > 0 ? 'text-green-600' : trend && trend < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-lg ${colorClasses[color]} text-white`}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs sm:text-sm font-semibold ${trendColor}`}>
            {change}
          </span>
        )}
      </div>
      
      <p className="text-gray-600 text-xs sm:text-sm mb-1">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
      
      {trend !== undefined && (
        <p className={`text-xs mt-1.5 sm:mt-2 ${trendColor}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% from last month
        </p>
      )}
    </div>
  );
};

export default AnalyticsCard;
