import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import OrderDetailsCard from '../../components/delivery/OrderDetailsCard';
import TimelineTracker from '../../components/delivery/TimelineTracker';
import StatusBadge from '../../components/delivery/StatusBadge';
import { assignedOrders } from '../../data/deliveryAssignedOrders';

const OrderDetails = () => {
  const { id } = useParams();
  const [status, setStatus] = useState('assigned');
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [deliveryImage, setDeliveryImage] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [signature, setSignature] = useState('');

  const order = assignedOrders.find(o => o.id === id) || assignedOrders[0];

  const statusOptions = [
    { value: 'assigned', label: 'Assigned' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'out_for_delivery', label: 'Out For Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed Delivery' }
  ];

  const handleStatusUpdate = (newStatus) => {
    setStatus(newStatus);
    setShowStatusUpdate(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeliveryImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/delivery/assigned-orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} className="sm:size-24 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{order.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <StatusBadge status={status} />
          <button
            onClick={() => setShowStatusUpdate(!showStatusUpdate)}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FiEdit2 size={16} className="sm:size-18" />
            <span className="hidden sm:inline">Update Status</span>
            <span className="sm:hidden">Update</span>
          </button>
        </div>
      </div>

      {/* Status Update Panel */}
      {showStatusUpdate && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Update Delivery Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusUpdate(option.value)}
                className={`p-2 sm:p-4 rounded-lg border-2 transition-all text-xs sm:text-sm font-medium ${
                  status === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <p>{option.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2">
          <OrderDetailsCard order={order} />
        </div>

        {/* Timeline */}
        <div>
          <TimelineTracker currentStatus={status} />
        </div>
      </div>

      {/* Proof of Delivery Section */}
      {status === 'delivered' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <FiCheck size={16} className="sm:size-20 text-green-500" />
            Proof of Delivery
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Delivery Image */}
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
                      onClick={() => setDeliveryImage(null)}
                      className="absolute top-2 right-2 p-1.5 sm:p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <FiX size={14} className="sm:size-16" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <FiCamera size={36} className="sm:size-48 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Upload delivery photo</p>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors">
                      <FiCamera size={16} className="sm:size-18" />
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Signature
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 h-40 sm:h-48 flex items-center justify-center bg-gray-50">
                {signature ? (
                  <img
                    src={signature}
                    alt="Customer signature"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <FiEdit2 size={36} className="sm:size-48 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-xs sm:text-sm text-gray-600">Customer signature placeholder</p>
                    <p className="text-xs text-gray-400 mt-1 sm:mt-2">Digital signature capture</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Notes */}
          <div className="mt-4 sm:mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Notes
            </label>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={4}
              placeholder="Add any delivery notes here..."
              className="w-full px-3 sm:px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              className="px-4 sm:px-6 py-2.5 h-10 sm:h-12 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors">
              Confirm Delivery
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
