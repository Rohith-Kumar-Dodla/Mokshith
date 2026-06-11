import React from 'react';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction,
  illustration
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : Icon && (
        <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
          <Icon size={40} className="text-gray-300" />
        </div>
      )}
      
      <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
        {title}
      </h3>
      
      <p className="text-gray-500 text-center mb-8 max-w-md">
        {description}
      </p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
