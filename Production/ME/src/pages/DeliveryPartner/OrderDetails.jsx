import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiCheck, FiX } from 'react-icons/fi';
import OrderDetailsCard from '../../components/delivery/OrderDetailsCard';
import TimelineTracker from '../../components/delivery/TimelineTracker';
import StatusBadge from '../../components/delivery/StatusBadge';
import useDelivery from '../../hooks/useDelivery';

const NEXT_ACTIONS = {
  assigned: {
    label: 'Accept Delivery',
    nextStatus: 'accepted',
    action: 'accept',
    className: 'bg-blue-600 hover:bg-blue-700',
  },
  accepted: {
    label: 'Mark Picked Up',
    nextStatus: 'picked_up',
    action: 'pick',
    className: 'bg-indigo-600 hover:bg-indigo-700',
  },
  picked_up: {
    label: 'Start Delivery',
    nextStatus: 'out_for_delivery',
    action: 'start',
    className: 'bg-orange-600 hover:bg-orange-700',
  },
  out_for_delivery: {
    label: 'Mark Delivered',
    nextStatus: 'delivered',
    action: 'deliver',
    className: 'bg-green-600 hover:bg-green-700',
  },
};

const OrderDetails = () => {
  const { id } = useParams();
  const {
    loadShipment,
    acceptDelivery,
    pickUpDelivery,
    startDelivery,
    markAsDelivered,
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
        if (isMounted) {
          setActionError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [id, loadShipment]);

  const nextAction = useMemo(() => NEXT_ACTIONS[status] || null, [status]);

  const handleLifecycleAction = async () => {
    if (!nextAction) return;

    setActionError(null);
    setSuccessMessage(null);

    try {
      if (nextAction.action === 'accept') {
        await acceptDelivery(id);
      } else if (nextAction.action === 'pick') {
        await pickUpDelivery(id);
      } else if (nextAction.action === 'start') {
        await startDelivery(id);
      } else if (nextAction.action === 'deliver') {
        await markAsDelivered(id);
      }

      await refreshOrder();
      setSuccessMessage(`${nextAction.label} successful.`);
    } catch (updateError) {
      setActionError(updateError.message);
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
    reader.onloadend = () => {
      setDeliveryImage(reader.result);
    };
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
          <Link
            to="/delivery/assigned-orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {nextAction && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Next Step</h3>
          <p className="text-sm text-gray-600 mb-4">
            Complete each delivery step in order. Current status:{' '}
            <span className="font-medium text-gray-900">{status.replace(/_/g, ' ')}</span>
          </p>
          <button
            onClick={handleLifecycleAction}
            disabled={actionLoading}
            className={`inline-flex items-center px-4 sm:px-6 py-2.5 h-10 sm:h-12 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 ${nextAction.className}`}
          >
            {actionLoading ? 'Updating...' : nextAction.label}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <OrderDetailsCard order={order} />
        </div>
        <div>
          <TimelineTracker currentStatus={status} />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
                {deliveryImage ? (
                  <div className="relative">
                    <img
                      src={deliveryImage}
                      alt="Delivery proof"
                      className="w-full h-40 sm:h-48 object-cover rounded-lg"
                    />
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
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={confirmed}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Notes
              </label>
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
