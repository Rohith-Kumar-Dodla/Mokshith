import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive':
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDotColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'delivered':
        return 'bg-green-500';
      case 'inactive':
      case 'rejected':
      case 'cancelled':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles(status)}`}>
      <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${getDotColor(status)}`}></span>
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default StatusBadge;
