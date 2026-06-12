import React, { useEffect, useRef, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const DEBOUNCE_MS = 300;

const SearchBar = ({ onSearch, placeholder = 'Search products...', className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  const scheduleSearch = (value, immediate = false) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!onSearch) {
      return;
    }

    if (immediate) {
      onSearch(value);
      return;
    }

    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, DEBOUNCE_MS);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    scheduleSearch(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    scheduleSearch('', true);
  };

  return (
    <div className={`relative ${className}`}>
      <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 h-10 sm:h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
      {searchTerm && (
        <button
          onClick={handleClear}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
        >
          <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
