import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiClock, FiMapPin, FiPackage } from 'react-icons/fi';
import StatusBadge from './StatusBadge';

const money = (value) => value == null ? 'Unavailable' : `₹${Number(value).toLocaleString('en-IN')}`;

const DeliveryCard = ({ order }) => (
  <article className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-lg sm:p-5">
    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
      <div><h3 className="text-base font-bold text-gray-900 sm:text-lg">{order.orderRef || order.id}</h3><p className="text-sm text-gray-600">{order.customerName || order.vendor}</p></div>
      <StatusBadge status={order.status} />
    </div>
    <div className="mb-4 space-y-3">
      <div className="flex items-start gap-3"><FiMapPin className="mt-1 shrink-0 text-blue-500" size={15} /><div><p className="text-xs text-gray-500">Pickup</p><p className="text-sm text-gray-700">{order.pickupLocation || 'Unavailable'}</p></div></div>
      <div className="flex items-start gap-3"><FiMapPin className="mt-1 shrink-0 text-green-500" size={15} /><div><p className="text-xs text-gray-500">Destination</p><p className="text-sm text-gray-700">{order.deliveryLocation || 'Unavailable'}</p></div></div>
    </div>
    <div className="mb-4 flex flex-wrap gap-3 text-sm text-gray-600"><span className="inline-flex items-center gap-2"><FiPackage /> {order.itemsCount || 0} items</span><span className="inline-flex items-center gap-2"><FiClock /> {order.distanceKm == null ? 'Distance unavailable' : `${order.distanceKm} ${order.distanceUnit || 'km'}`}</span></div>
    <div className="flex flex-col justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center"><div><p className="text-xs text-gray-500">Delivery earnings</p><p className="font-bold text-green-700">{money(order.deliveryAmount)}</p><p className="mt-1 text-xs text-gray-500">Order total: {money(order.orderAmount)}</p></div><Link to={`/delivery/order-details/${order.id}`} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">View details <FiArrowRight /></Link></div>
  </article>
);

export default React.memo(DeliveryCard);
