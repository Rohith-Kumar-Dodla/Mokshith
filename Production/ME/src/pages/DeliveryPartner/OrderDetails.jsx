import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiCheck, FiX, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import OrderDetailsCard from '../../components/delivery/OrderDetailsCard';
import TimelineTracker from '../../components/delivery/TimelineTracker';
import StatusBadge from '../../components/delivery/StatusBadge';
import useDelivery from '../../hooks/useDelivery';
import uploadService from '../../services/uploadService';

const NEXT_ACTIONS = {
  assigned: {
    label: 'Accept Delivery',
    action: 'accept',
    className: 'bg-blue-600 hover:bg-blue-700',
  },
  accepted: {
    label: 'Mark Picked Up',
    action: 'pick',
    className: 'bg-indigo-600 hover:bg-indigo-700',
  },
  picked_up: {
    label: 'Start Delivery',
    action: 'start',
    className: 'bg-orange-600 hover:bg-orange-700',
  },
  out_for_delivery: {
    label: 'Mark Delivered',
    action: 'deliver',
    className: 'bg-green-600 hover:bg-green-700',
  },
};

function buildUpiQrUrl(upiId, amount, note) {
  if (!upiId) return null;
  const params = new URLSearchParams({
    pa: upiId,
    pn: 'Vendor',
    am: String(amount || ''),
    cu: 'INR',
    tn: note || 'COD Payment',
  });
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?${params.toString()}`)}`;
}

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    loadShipment,
    acceptDelivery,
    rejectAssignment,
    pickUpDelivery,
    startDelivery,
    markAsDelivered,
    collectCodPayment,
    completeDelivery,
    actionLoading,
    error,
  } = useDelivery({ autoLoad: false });

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('assigned');
  const [deliveryImage, setDeliveryImage] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [collectionMode, setCollectionMode] = useState('QR');
  const [cashProofUrl, setCashProofUrl] = useState('');
  const [cashProofPreview, setCashProofPreview] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectInFlight, setRejectInFlight] = useState(false);

  const refreshOrder = async () => {
    const shipment = await loadShipment(id);
    setOrder(shipment);
    setStatus(shipment?.status || 'assigned');
    setConfirmed(shipment?.status === 'completed');
    return shipment;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      setLoading(true);
      setActionError(null);
      try {
        const shipment = await loadShipment(id);
        if (isMounted) {
          setOrder(shipment);
          setStatus(shipment?.status || 'assigned');
          setConfirmed(shipment?.status === 'completed');
        }
      } catch (loadError) {
        if (isMounted) setActionError(loadError.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [id, loadShipment]);

  const isCod = String(order?.paymentMethod || '').toUpperCase() === 'COD';
  const paymentPaid = String(order?.paymentStatus || '').toLowerCase() === 'paid';
  const needsCodCollection =
    isCod && !paymentPaid && status === 'out_for_delivery';

  const nextAction = useMemo(() => {
    if (status === 'out_for_delivery' && isCod && !paymentPaid) {
      return null;
    }
    return NEXT_ACTIONS[status] || null;
  }, [status, isCod, paymentPaid]);

  const generatedQr = useMemo(
    () => buildUpiQrUrl(order?.vendorUpiId, order?.orderAmount, `Order ${order?.orderRef || order?.id}`),
    [order]
  );

  const handleLifecycleAction = async () => {
    if (!nextAction || rejectInFlight) return;
    setActionError(null);
    setSuccessMessage(null);
    try {
      if (nextAction.action === 'accept') await acceptDelivery(id);
      else if (nextAction.action === 'pick') await pickUpDelivery(id);
      else if (nextAction.action === 'start') await startDelivery(id);
      else if (nextAction.action === 'deliver') await markAsDelivered(id);
      await refreshOrder();
      setSuccessMessage(`${nextAction.label} successful.`);
    } catch (updateError) {
      setActionError(updateError.message);
    }
  };

  const handleRejectAssignment = async () => {
    if (rejectInFlight || actionLoading || status !== 'assigned') return;

    setRejectInFlight(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await rejectAssignment(id, { reason: rejectReason.trim() || undefined });
      setShowRejectConfirm(false);
      setSuccessMessage('Delivery assignment rejected. The order is now available for reassignment.');
      window.setTimeout(() => {
        navigate('/delivery/assigned-orders', { replace: true });
      }, 900);
    } catch (updateError) {
      setActionError(updateError.message);
    } finally {
      setRejectInFlight(false);
    }
  };

  const handleCashProofUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    setActionError(null);
    try {
      setCashProofPreview(URL.createObjectURL(file));
      const uploaded = await uploadService.uploadImage(file, 'cod-cash-proof');
      setCashProofUrl(uploaded?.url || uploaded?.secure_url || '');
    } catch (uploadError) {
      setActionError(uploadError?.response?.data?.message || uploadError.message || 'Failed to upload proof');
      setCashProofPreview('');
      setCashProofUrl('');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCollectPayment = async () => {
    setActionError(null);
    setSuccessMessage(null);
    try {
      if (collectionMode === 'CASH' && !cashProofUrl) {
        throw new Error('Please upload cash collection proof before confirming.');
      }
      await collectCodPayment(id, {
        collectionMode,
        cashCollectionProof: collectionMode === 'CASH' ? cashProofUrl : undefined,
      });
      await refreshOrder();
      setSuccessMessage(
        collectionMode === 'QR'
          ? 'QR payment marked as received.'
          : 'Cash payment collected successfully.'
      );
    } catch (collectError) {
      setActionError(collectError.message);
    }
  };

  const handleConfirmDelivery = async () => {
    setActionError(null);
    setSuccessMessage(null);
    try {
      await completeDelivery(id, {
        notes: deliveryNotes,
        proofImage: deliveryImage,
      });
      await refreshOrder();
      setConfirmed(true);
      setSuccessMessage('Delivery confirmed and completed successfully.');
    } catch (updateError) {
      setActionError(updateError.message);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setDeliveryImage(reader.result);
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <p className="text-sm text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <p className="text-sm text-red-600">{actionError || error || 'Order not found'}</p>
        <Link to="/delivery/assigned-orders" className="text-blue-600 text-sm">Back to assigned orders</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/delivery/assigned-orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{order.id}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>
      )}

      {isCod && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          COD Order · Payment status: <strong>{paymentPaid ? 'Paid' : 'Pending collection'}</strong>
          {order.collectionMode ? ` · Collected via ${order.collectionMode}` : ''}
        </div>
      )}

      {needsCodCollection && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
            <FiCreditCard className="text-blue-600" /> Collect Payment
          </h3>
          <p className="text-sm text-gray-600">
            This is a COD order. Collect payment before marking delivered.
          </p>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="collection-mode"
                checked={collectionMode === 'QR'}
                onChange={() => setCollectionMode('QR')}
              />
              QR Payment
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="collection-mode"
                checked={collectionMode === 'CASH'}
                onChange={() => setCollectionMode('CASH')}
              />
              Cash Payment
            </label>
          </div>

          {collectionMode === 'QR' ? (
            <div className="space-y-3">
              {order.vendorQrImage ? (
                <img
                  src={order.vendorQrImage}
                  alt="Vendor UPI QR"
                  className="w-48 h-48 object-contain border border-gray-200 rounded-lg bg-white"
                />
              ) : generatedQr ? (
                <img
                  src={generatedQr}
                  alt="Generated UPI QR"
                  className="w-48 h-48 object-contain border border-gray-200 rounded-lg bg-white"
                />
              ) : (
                <p className="text-sm text-amber-700">
                  Vendor has not configured a UPI ID or QR image yet.
                </p>
              )}
              {order.vendorUpiId ? (
                <p className="text-sm text-gray-700">UPI ID: <strong>{order.vendorUpiId}</strong></p>
              ) : null}
              <button
                type="button"
                onClick={handleCollectPayment}
                disabled={actionLoading || (!order.vendorQrImage && !generatedQr)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 min-h-[44px]"
              >
                <FiCheck /> Payment Received
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <FiDollarSign /> Capture cash proof using camera or gallery.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {cashProofPreview ? (
                  <div className="relative inline-block">
                    <img src={cashProofPreview} alt="Cash proof" className="w-48 h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setCashProofPreview('');
                        setCashProofUrl('');
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 min-h-[44px]">
                    <FiCamera /> Capture / Upload Proof
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleCashProofUpload}
                    />
                  </label>
                )}
              </div>
              <button
                type="button"
                onClick={handleCollectPayment}
                disabled={actionLoading || uploadingProof || !cashProofUrl}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 min-h-[44px]"
              >
                <FiCheck /> {uploadingProof ? 'Uploading...' : 'Cash Collected'}
              </button>
            </div>
          )}
        </div>
      )}

      {nextAction && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Next Step</h3>
          <p className="text-sm text-gray-600 mb-4">
            Complete each delivery step in order. Current status:{' '}
            <span className="font-medium text-gray-900">{status.replace(/_/g, ' ')}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleLifecycleAction}
              disabled={actionLoading || rejectInFlight}
              className={`inline-flex items-center justify-center px-4 sm:px-6 py-2.5 h-10 sm:h-12 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 ${nextAction.className}`}
            >
              {actionLoading ? 'Updating...' : nextAction.label}
            </button>
            {status === 'assigned' && (
              <button
                type="button"
                onClick={() => setShowRejectConfirm(true)}
                disabled={actionLoading || rejectInFlight}
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 h-10 sm:h-12 border border-red-300 text-red-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            )}
          </div>
        </div>
      )}

      {showRejectConfirm && (
        <div className="bg-white rounded-xl border border-red-200 p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Reject Delivery Assignment?</h3>
            <p className="text-sm text-gray-600 mt-2">
              You will no longer be assigned to this delivery. The order will become available for reassignment.
              This does not cancel the customer order.
            </p>
          </div>
          <div>
            <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Why are you rejecting this assignment?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowRejectConfirm(false)}
              disabled={rejectInFlight}
              className="px-4 py-2.5 h-11 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRejectAssignment}
              disabled={rejectInFlight || actionLoading}
              className="px-4 py-2.5 h-11 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {rejectInFlight ? 'Rejecting…' : 'Reject Assignment'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <OrderDetailsCard order={order} />
        </div>
        <div>
          <TimelineTracker
            currentStatus={status}
            isCod={isCod}
            paymentPaid={paymentPaid}
          />
        </div>
      </div>

      {status === 'delivered' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <FiCheck size={16} className="text-green-500" />
            Proof of Delivery
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Photo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
                {deliveryImage ? (
                  <div className="relative">
                    <img src={deliveryImage} alt="Delivery proof" className="w-full h-40 sm:h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setDeliveryImage(null)}
                      disabled={confirmed}
                      className="absolute top-2 right-2 p-1.5 sm:p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <FiCamera size={36} className="text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Upload delivery photo (optional)</p>
                    <label className={`cursor-pointer inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors ${confirmed ? 'opacity-50 pointer-events-none' : ''}`}>
                      <FiCamera size={16} />
                      Choose Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={confirmed} />
                    </label>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Notes</label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={8}
                disabled={confirmed}
                placeholder="Add any delivery notes here..."
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setDeliveryImage(null);
                setDeliveryNotes('');
              }}
              disabled={confirmed || actionLoading}
              className="px-4 sm:px-6 py-2.5 h-10 sm:h-12 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleConfirmDelivery}
              disabled={confirmed || actionLoading}
              className="px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {confirmed ? 'Delivery Confirmed' : actionLoading ? 'Confirming...' : 'Confirm Delivery'}
            </button>
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          This delivery has been completed and confirmed.
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
