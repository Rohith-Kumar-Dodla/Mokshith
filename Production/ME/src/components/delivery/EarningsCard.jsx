import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const EarningsCard = ({ title, amount, change, icon, period }) => {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 bg-blue-50 rounded-lg text-blue-600">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs sm:text-sm font-semibold ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <FiTrendingUp size={14} className="sm:size-16" /> : <FiTrendingDown size={14} className="sm:size-16" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-xs sm:text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">₹{amount?.toLocaleString()}</p>
      {period && (
        <p className="text-xs text-gray-500">{period}</p>
      )}
    </div>
  );
};

export default EarningsCard;
