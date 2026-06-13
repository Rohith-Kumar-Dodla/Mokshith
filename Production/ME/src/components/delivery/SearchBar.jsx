import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const SearchBar = ({ placeholder, onSearch, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder={placeholder || 'Search...'}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Clear search"
        >
          <FiX className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
