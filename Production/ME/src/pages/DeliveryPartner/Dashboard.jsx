import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiBell, FiCheckCircle, FiClock, FiDollarSign, FiPackage, FiTruck } from 'react-icons/fi';
import DeliveryOfferCard from '../../components/delivery/DeliveryOfferCard';
import StatusBadge from '../../components/delivery/StatusBadge';
import useDelivery from '../../hooks/useDelivery';

const money = (value) => Number.isFinite(Number(value)) ? `₹${Number(value).toLocaleString('en-IN')}` : 'Unavailable';
const display = (value) => value || 'Unavailable';

const DeliveryDashboard = () => {
  const { assignments = [], offers = [], profile, analytics, loading, error, actionLoading, acceptOffer, rejectOffer } = useDelivery();
  const pendingOffers = offers.filter((offer) => offer.status === 'OFFERED');
  const activeDelivery = assignments.find((delivery) => !['delivered', 'completed', 'failed'].includes(delivery.status));
  const today = analytics?.today;

  if (loading && !analytics) return <div className="space-y-4"><div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" /><div className="h-40 animate-pulse rounded-xl bg-gray-200" /><div className="h-32 animate-pulse rounded-xl bg-gray-200" /></div>;

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><p className="text-sm text-blue-100">Welcome back</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{profile?.name || 'Delivery Partner'}</h1><p className="mt-1 text-sm text-blue-100">Here is what needs your attention today.</p></div>
        <Link aria-label="View Assigned Orders" to="/delivery/assigned-orders" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"><FiTruck /> View Assigned Orders ({assignments.length}) <FiArrowRight /></Link>
      </header>

      {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section aria-labelledby="today-summary"><h2 id="today-summary" className="mb-3 text-lg font-bold text-gray-900">Today&apos;s summary</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"><FiCheckCircle /></div><p className="text-sm text-gray-600">Completed deliveries</p><p className="mt-1 text-2xl font-bold text-gray-900">{today?.completedDeliveries ?? 0}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><FiDollarSign /></div><p className="text-sm text-gray-600">Today&apos;s earnings</p><p className="mt-1 text-2xl font-bold text-gray-900">{money(today?.todaysEarnings)}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><FiClock /></div><p className="text-sm text-gray-600">Action required</p><p className="mt-1 text-2xl font-bold text-gray-900">{pendingOffers.length + (activeDelivery ? 1 : 0)}</p></div>
      </div></section>

      {pendingOffers.length > 0 ? <section aria-labelledby="pending-offers" className="space-y-3"><div className="flex items-end justify-between gap-3"><div><h2 id="pending-offers" className="text-lg font-bold text-gray-900">Pending offers</h2><p className="text-sm text-gray-600">Review the server-provided route and earnings before responding.</p></div><Link to="/delivery/assigned-orders" className="text-sm font-semibold text-blue-600">View all</Link></div><div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{pendingOffers.slice(0, 2).map((offer) => <DeliveryOfferCard key={offer.offerId || offer._id} offer={offer} actionLoading={actionLoading} onAccept={() => acceptOffer(offer.logisticsId, offer.offerId || offer._id)} onReject={(payload) => rejectOffer(offer.logisticsId, offer.offerId || offer._id, payload)} />)}</div></section> : <section className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center"><FiBell className="mx-auto mb-2 text-gray-400" /><p className="font-semibold text-gray-800">No pending offers</p><p className="mt-1 text-sm text-gray-500">New assignments will appear here when available.</p></section>}

      <section aria-labelledby="active-delivery"><div className="mb-3 flex items-end justify-between gap-3"><div><h2 id="active-delivery" className="text-lg font-bold text-gray-900">Active delivery</h2><p className="text-sm text-gray-600">Your next valid action is available from the details page.</p></div><Link to="/delivery/assigned-orders" className="text-sm font-semibold text-blue-600">All deliveries</Link></div>{activeDelivery ? <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Order reference</p><h3 className="mt-1 text-lg font-bold text-gray-900">{activeDelivery.orderRef || activeDelivery.id}</h3><p className="text-sm text-gray-600">{display(activeDelivery.customerName || activeDelivery.vendor)}</p></div><StatusBadge status={activeDelivery.status} /></div><div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3"><div><p className="text-gray-500">Destination</p><p className="font-medium text-gray-900">{display(activeDelivery.deliveryLocation)}</p></div><div><p className="text-gray-500">Distance</p><p className="font-medium text-gray-900">{activeDelivery.distanceKm == null ? 'Unavailable' : `${activeDelivery.distanceKm} ${activeDelivery.distanceUnit || 'km'}`}</p></div><div><p className="text-gray-500">Delivery earnings</p><p className="font-semibold text-green-700">{money(activeDelivery.deliveryAmount)}</p></div></div><Link to={`/delivery/order-details/${activeDelivery.id}`} className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">Open active delivery <FiArrowRight /></Link></div> : <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center"><FiPackage className="mx-auto mb-2 text-gray-400" /><p className="font-semibold text-gray-800">No active delivery</p><p className="mt-1 text-sm text-gray-500">Accept an offer to start a delivery.</p></div>}</section>
    </div>
  );
};

export default DeliveryDashboard;
