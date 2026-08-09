import React from 'react';
import { Link } from 'react-router-dom';

const AnalyticsCard = ({
  title,
  value,
  change,
  icon,
  color = 'blue',
  trend,
  to,
  onClick,
  ariaLabel,
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500',
  };

  const trendColor = trend && trend > 0 ? 'text-green-600' : trend && trend < 0 ? 'text-red-600' : 'text-gray-600';
  const interactive = Boolean(to || onClick);
  const className = `bg-white rounded-lg border border-gray-200 p-4 sm:p-6 min-w-0 overflow-hidden text-left w-full ${
    interactive
      ? 'hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
      : 'hover:shadow-md transition-shadow'
  }`;

  const content = (
    <>
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
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className} aria-label={ariaLabel || `View ${title}`}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} aria-label={ariaLabel || `View ${title}`}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
};

export default React.memo(AnalyticsCard);
