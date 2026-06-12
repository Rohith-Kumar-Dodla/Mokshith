import React from 'react';
import { FiPlus } from 'react-icons/fi';

const PageHeader = ({ title, subtitle, buttonText, onButtonClick, buttonIcon, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
      {!actions && buttonText && (
        <button
          onClick={onButtonClick}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
        >
          {buttonIcon || <FiPlus size={14} sm:size={18} />}
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default PageHeader;
