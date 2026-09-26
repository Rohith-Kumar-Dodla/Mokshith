import React from 'react';
import SupplierAllocationSummary from './SupplierAllocationSummary';

export default function ProcurementPanel({ orderId }) {
  return <SupplierAllocationSummary orderId={orderId} />;
}
