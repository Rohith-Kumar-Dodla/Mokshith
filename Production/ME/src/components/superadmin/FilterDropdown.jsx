import React, { useState, useRef, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';

const FilterDropdown = ({ options, selected, onSelect, label = 'Filter' }) => {
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

  const selectedOption = options.find(opt => opt.value === selected);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 h-12 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
      >
        <FiFilter className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="text-xs sm:text-sm text-gray-700 truncate">{selectedOption?.label || label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg min-h-[44px] ${
                selected === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
