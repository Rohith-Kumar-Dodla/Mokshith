import React from 'react';

const AnalyticsCard = ({ title, value, icon, trend, color = 'blue' }) => {
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-lg ${colors.iconBg} text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {trend && (
        <p className={`text-sm ${colors.text}`}>{trend}</p>
      )}
    </div>
  );
};

export default AnalyticsCard;
 
// Memoize to avoid unnecessary re-renders when props unchanged
export const MemoizedAnalyticsCard = React.memo(AnalyticsCard);
