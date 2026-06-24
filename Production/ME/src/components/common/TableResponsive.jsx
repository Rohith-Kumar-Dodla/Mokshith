import React from 'react';

export default function TableResponsive({ children, className = '' }) {
  return (
    <div className={`table-responsive ${className}`} role="region" aria-label="Responsive table">
      {children}
    </div>
  );
}

