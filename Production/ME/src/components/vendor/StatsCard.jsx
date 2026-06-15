import React from 'react';

const StatsCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 min-w-0 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 p-2 bg-gray-50 rounded-md text-gray-700">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{title}</p>
          <p className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StatsCard);

