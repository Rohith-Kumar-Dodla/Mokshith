import React, { useState, useRef, useEffect, useId } from 'react';
import { FiFilter } from 'react-icons/fi';

/**
 * Consistent Super Admin table filter control: [ Filter ▼ ]
 * Supports single-select options with active indication and clear.
 */
const FilterDropdown = ({
  options = [],
  selected,
  onSelect,
  label = 'Filter',
  onClear,
  clearValue = 'all',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const listboxId = useId();
  const selectedOption = options.find((opt) => opt.value === selected);
  const isActive = selected != null && selected !== clearValue && selected !== '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelect = (value) => {
    onSelect?.(value);
    setIsOpen(false);
  };

  const handleClear = () => {
    if (onClear) onClear();
    else onSelect?.(clearValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 h-12 border rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] ${
          isActive ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700'
        }`}
      >
        <FiFilter className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="text-xs sm:text-sm truncate">
          {isActive ? (selectedOption?.label || label) : label}
        </span>
        {isActive && (
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold">
            1
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected === option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors min-h-[44px] ${
                selected === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
          {isActive && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 min-h-[44px]"
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
