import React from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchBar = ({ placeholder, value, onChange, onClear }) => {
  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} sm:size={18} />
      <input
        type="text"
        placeholder={placeholder || 'Search...'}
        value={value}
        onChange={onChange}
        className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-[32px] min-w-[32px] flex items-center justify-center"
        >
          <span className="text-base sm:text-lg">&times;</span>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
