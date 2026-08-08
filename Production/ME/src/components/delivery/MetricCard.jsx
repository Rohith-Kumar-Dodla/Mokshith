import React from 'react';
import { Link } from 'react-router-dom';

const MetricCard = ({ title, value, icon, change, color = 'blue', to, ariaLabel }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      iconText: 'text-blue-500',
      text: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-500',
      iconText: 'text-green-500',
      text: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-500',
      iconText: 'text-purple-500',
      text: 'text-purple-600'
    },
    orange: {
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-500',
      iconText: 'text-orange-500',
      text: 'text-orange-600'
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-500',
      iconText: 'text-red-500',
      text: 'text-red-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;
  const className = `bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow block w-full text-left ${
    to ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500' : ''
  }`;

  const content = (
    <>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-lg ${colors.bg}`}>
          <div className={colors.iconText}>{icon}</div>
        </div>
        {change && (
          <span className={`text-xs sm:text-sm font-semibold ${colors.text}`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-xs sm:text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className} aria-label={ariaLabel || `View ${title}`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
};

export default React.memo(MetricCard);
