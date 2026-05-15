import { ORDER_STATUS } from "../../../utils/constants";

const statusConfig = {
  [ORDER_STATUS.PENDING]: { label: 'Order Received', className: 'bg-amber-50 text-amber-600 border-amber-100' },
  [ORDER_STATUS.CONFIRMED]: { label: 'Confirmed', className: 'bg-purple-50 text-purple-600 border-purple-100' },
  [ORDER_STATUS.PROCESSING]: { label: 'Preparing', className: 'bg-blue-50 text-blue-600 border-blue-100' },
  [ORDER_STATUS.PACKED]: { label: 'Packed', className: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: { label: 'Shipping', className: 'bg-orange-50 text-orange-600 border-orange-100' },
  [ORDER_STATUS.DELIVERED]: { label: 'Completed', className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  [ORDER_STATUS.CANCELLED]: { label: 'Cancelled', className: 'bg-rose-50 text-rose-600 border-rose-100' },
  [ORDER_STATUS.FAILED]: { label: 'Failed', className: 'bg-rose-50 text-rose-600 border-rose-100' },
};

const OrderStatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, className: 'bg-slate-50 text-slate-600 border-slate-100' };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.className}`}>
      {config.label}
    </span>
  );
};

export default OrderStatusBadge;
