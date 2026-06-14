import React from 'react';

const PerformanceCard = ({ title, value, icon, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      text: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-500',
      text: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-500',
      text: 'text-purple-600'
    },
    orange: {
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-500',
      text: 'text-orange-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-lg ${colors.iconBg} text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-600">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {subtitle && (
        <p className={`text-xs sm:text-sm ${colors.text}`}>{subtitle}</p>
      )}
    </div>
  );
};

export default React.memo(PerformanceCard);
