import React, { useState, useRef, useEffect } from 'react';
import { FiFilter, FiChevronDown } from 'react-icons/fi';

const FilterDropdown = ({ label, options, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options?.find(opt => opt.value === selected);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
      >
        <FiFilter className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        {label && <span className="text-gray-600 hidden sm:inline">{label}:</span>}
        <span className="font-medium text-gray-900">
          {selectedOption?.label || 'All'}
        </span>
        <FiChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          <div className="py-1">
            {options?.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 sm:px-4 py-2.5 text-xs sm:text-sm hover:bg-gray-50 transition-colors ${
                  selected === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
