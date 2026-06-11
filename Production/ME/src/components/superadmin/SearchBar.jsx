import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchBar = ({ placeholder = 'Search...', onSearch, value }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} sm:size={20} />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
      />
    </div>
  );
};

export default SearchBar;
