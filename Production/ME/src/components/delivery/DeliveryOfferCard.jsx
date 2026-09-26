import React, { useState } from 'react';
import { FiCheck, FiMapPin, FiX } from 'react-icons/fi';

const REASONS = [['AMOUNT_TOO_LOW', 'Amount too low'], ['DISTANCE_TOO_FAR', 'Distance too far'], ['UNAVAILABLE', 'Unavailable'], ['VEHICLE_ISSUE', 'Vehicle issue'], ['OTHER', 'Other']];

const DeliveryOfferCard = ({ offer, actionLoading, onAccept, onReject }) => {
  const [showReject, setShowReject] = useState(false);
  const [rejectionCode, setRejectionCode] = useState('AMOUNT_TOO_LOW');
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');
  const order = offer.orderId && typeof offer.orderId === 'object' ? offer.orderId : {};
  const isActive = offer.status === 'OFFERED' && (!offer.expiresAt || new Date(offer.expiresAt).getTime() > Date.now());
  const expires = offer.expiresAt ? new Date(offer.expiresAt).toLocaleString('en-IN') : 'Unavailable';
  const distance = offer.distanceKm ?? offer.distance;
  const submitReject = async () => { setActionError(''); try { await onReject({ rejectionCode, reason }); setShowReject(false); } catch (error) { setActionError(error.message || 'The offer could not be rejected.'); } };
  const submitAccept = async () => { setActionError(''); try { await onAccept(); } catch (error) { setActionError(error.message || 'The offer could not be accepted.'); } };

  return <article className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Delivery offer</p><h3 className="mt-1 text-lg font-bold text-gray-900">Order #{String(order._id || offer.orderId).slice(-8).toUpperCase()}</h3></div><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">{offer.status || 'Unavailable'}</span></div>
    <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-gray-500">Delivery earnings</p><p className="text-xl font-bold text-green-700">{offer.deliveryAmount == null ? 'Unavailable' : `₹${Number(offer.deliveryAmount).toLocaleString('en-IN')}`}</p></div><div><p className="text-gray-500">Route distance</p><p className="font-semibold text-gray-900">{distance == null ? 'Unavailable' : `${distance} ${offer.distanceUnit || 'KM'}`}</p></div><div><p className="text-gray-500">Order amount</p><p className="font-semibold text-gray-900">{order.totalAmount == null ? 'Unavailable' : `₹${Number(order.totalAmount).toLocaleString('en-IN')}`}</p></div><div><p className="text-gray-500">Payment</p><p className="font-semibold text-gray-900">{order.paymentStatus || order.paymentMethod || 'Unavailable'}</p></div></div>
    <div className="flex items-start gap-2 text-sm text-gray-700"><FiMapPin className="mt-0.5 shrink-0" /><span>{order.address?.addressLine || order.shippingAddress?.addressLine || 'Drop location unavailable'}, {order.address?.city || order.shippingAddress?.city || ''}</span></div>
    <p className="text-xs text-gray-600">Offer {isActive ? 'expires' : String(offer.status || 'unavailable').toLowerCase()}: {expires}</p>
    {isActive && !showReject ? <div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={submitAccept} disabled={actionLoading} className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50"><FiCheck /> {actionLoading ? 'Accepting...' : 'Accept'}</button><button type="button" onClick={() => setShowReject(true)} disabled={actionLoading} className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-3 font-semibold text-red-700 disabled:opacity-50"><FiX /> Reject</button></div> : null}
    {showReject ? <div className="space-y-3 rounded-lg border border-red-200 bg-white p-3"><label className="block text-sm font-medium text-gray-700" htmlFor={`reject-code-${offer.offerId || offer._id}`}>Why are you rejecting?</label><select id={`reject-code-${offer.offerId || offer._id}`} value={rejectionCode} onChange={(event) => setRejectionCode(event.target.value)} className="min-h-[44px] w-full rounded-lg border border-gray-200 px-3 text-sm">{REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{rejectionCode === 'OTHER' ? <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} placeholder="Add a short explanation" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /> : null}<div className="flex gap-2"><button type="button" onClick={() => setShowReject(false)} disabled={actionLoading} className="min-h-[44px] flex-1 rounded-lg border px-3 text-sm">Cancel</button><button type="button" onClick={submitReject} disabled={actionLoading || (rejectionCode === 'OTHER' && !reason.trim())} className="min-h-[44px] flex-1 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white disabled:opacity-50">{actionLoading ? 'Rejecting...' : 'Confirm reject'}</button></div></div> : null}
    {actionError ? <p role="alert" className="text-sm text-red-700">{actionError}</p> : null}
  </article>;
};

export default DeliveryOfferCard;
