import React from 'react';

const Card = ({ children, className = '', onClick, ...rest }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
};

export default React.memo(Card);
