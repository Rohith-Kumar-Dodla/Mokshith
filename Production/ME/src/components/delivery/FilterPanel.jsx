import React, { useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';

const FilterPanel = ({ filters, onFilterChange, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    if (onFilterChange) {
      onFilterChange(key, value);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <FiFilter size={16} className="sm:size-20 text-gray-600" />
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Filters</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 py-1"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 sm:space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Status</label>
            <select
              value={filters?.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="picked_up">Picked Up</option>
              <option value="out_for_delivery">Out For Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Priority</label>
            <select
              value={filters?.priority || 'all'}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Date</label>
            <input
              type="date"
              value={filters?.date || ''}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={onClear}
            className="w-full inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={14} className="sm:size-18" />
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
