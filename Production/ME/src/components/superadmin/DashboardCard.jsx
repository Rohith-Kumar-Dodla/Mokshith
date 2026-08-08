import React from 'react';
import { Link } from 'react-router-dom';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const DashboardCard = ({
  title,
  value,
  growth,
  icon: Icon,
  color = 'blue',
  to,
  onClick,
  ariaLabel,
}) => {
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
  const isInteractive = Boolean(to || onClick);
  const label = ariaLabel || (isInteractive ? `View ${title}` : undefined);

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{value}</h3>
          {typeof growth === 'number' && (
            <div className="flex items-center gap-1 sm:gap-2">
              {isPositive ? (
                <FiTrendingUp className="text-green-500" size={14} />
              ) : (
                <FiTrendingDown className="text-red-500" size={14} />
              )}
              <span className={`text-xs sm:text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{growth}%
              </span>
              <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 sm:p-4 rounded-xl ${bgColorClasses[color]} flex-shrink-0`}>
          <Icon className={textColorClasses[color]} size={20} />
        </div>
      </div>
    </>
  );

  const interactiveClasses = isInteractive
    ? 'cursor-pointer hover:shadow-md hover:border-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
    : '';

  const className = `bg-white rounded-xl shadow-sm transition-shadow duration-300 p-4 sm:p-6 border border-gray-100 block min-w-0 ${interactiveClasses}`;

  if (to) {
    return (
      <Link to={to} className={className} aria-label={label}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} text-left w-full`} aria-label={label}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
};

export default React.memo(DashboardCard);
