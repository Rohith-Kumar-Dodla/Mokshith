import React from 'react';

const StatusBadge = ({ status, size = 'md' }) => {
  const getStatusConfig = (status) => {
    const configs = {
      delivered: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: '✓'
      },
      dispatched: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: '🚚'
      },
      processing: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: '⚙'
      },
      confirmed: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
        icon: '✓'
      },
      pending: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: '⏳'
      },
      cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: '✕'
      },
      paid: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: '✓'
      },
      pending_payment: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: '⏳'
      },
      refunded: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        icon: '↩'
      },
      active: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: '✓'
      },
      inactive: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: '○'
      },
      low_stock: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: '⚠'
      },
      out_of_stock: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: '✕'
      }
    };

    return (
      configs[status] || {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: '○'
      }
    );
  };

  const config = getStatusConfig(status);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const formattedStatus = status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${config.bg} ${config.text} ${sizeClasses[size]}`}>
      <span>{config.icon}</span>
      <span>{formattedStatus}</span>
    </span>
  );
};

export default StatusBadge;
