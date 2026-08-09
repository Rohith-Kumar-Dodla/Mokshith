import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'delivered':
      case 'completed':
      case 'confirmed':
      case 'healthy':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'pending':
      case 'processing':
      case 'low_stock':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'inactive':
      case 'rejected':
      case 'delivery_partner_rejected':
      case 'cancelled':
      case 'suspended':
      case 'out_of_stock':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'packed':
      case 'dispatched':
      case 'assigned':
      case 'accepted':
      case 'out_for_pickup':
      case 'picked_up':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'delivery_failed':
      case 'customer_unavailable':
      case 'rejected':
        return {
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const label =
    String(status || '').toLowerCase() === 'delivery_partner_rejected'
      ? 'Delivery Partner Rejected'
      : status?.charAt(0).toUpperCase() + status?.slice(1)?.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
