import React, { useState } from 'react';
import { FiTruck, FiUser, FiMapPin, FiStar, FiClock, FiCheck, FiSearch } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import StatusBadge from '../../components/admin/StatusBadge';
import SearchBar from '../../components/admin/SearchBar';
import Modal from '../../components/admin/Modal';
import { orders } from '../../data/orders';
import { deliveryPartners } from '../../data/deliveryPartners';

const DeliveryAssignment = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);

  const unassignedOrders = orders.filter(order => !order.deliveryPartner);
  const availablePartners = deliveryPartners.filter(partner => partner.status === 'active');

  const handleAssignDelivery = (order) => {
    setSelectedOrder(order);
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssignment = () => {
    console.log('Assign delivery:', selectedOrder.id, 'to partner:', selectedPartner?.name);
    setIsAssignModalOpen(false);
    setSelectedOrder(null);
    setSelectedPartner(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Delivery Assignment"
        subtitle="Assign delivery partners to pending orders"
      />

      {/* Unassigned Orders */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Unassigned Orders</h2>
          <div className="flex items-center gap-2">
            <FiTruck size={16} sm:size={20} className="text-orange-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">{unassignedOrders.length} orders pending</span>
          </div>
        </div>

        <div className="mb-4">
          <SearchBar
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
        </div>

        <div className="space-y-3 sm:space-y-4">
          {unassignedOrders
            .filter(order => order.id.toLowerCase().includes(searchTerm.toLowerCase()) || order.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((order) => (
              <div key={order.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900">{order.id}</h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700">{order.vendor}</p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiMapPin size={12} sm:size={16} />
                        <span>{order.area}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiTruck size={12} sm:size={16} />
                        <span>{order.items} items</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock size={12} sm:size={16} />
                        <span>{order.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">₹{order.amount.toLocaleString()}</p>
                    <button
                      onClick={() => handleAssignDelivery(order)}
                      className="mt-2 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                    >
                      <FiTruck size={14} sm:size={16} />
                      <span className="hidden sm:inline">Assign Delivery</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {unassignedOrders.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <FiTruck size={36} sm:size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-500">All orders have been assigned</p>
          </div>
        )}
      </Card>

      {/* Available Delivery Partners */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Available Delivery Partners</h2>
          <div className="flex items-center gap-2">
            <FiUser size={16} sm:size={20} className="text-green-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">{availablePartners.length} partners available</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {availablePartners.map((partner) => (
            <Card key={partner.id} className="hover:shadow-md transition-shadow p-3 sm:p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0">
                    {partner.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">{partner.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{partner.vehicle}</p>
                  </div>
                </div>
                <StatusBadge status={partner.status} />
              </div>

              <div className="space-y-1.5 sm:space-y-2 mt-3 sm:mt-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Current Deliveries</span>
                  <span className="font-medium text-gray-900">{partner.currentDeliveries}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <FiStar size={12} sm:size={16} className="text-yellow-500" />
                    <span className="font-medium text-gray-900">{partner.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Area</span>
                  <span className="font-medium text-gray-900">{partner.area}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Total Deliveries</span>
                  <span className="font-medium text-gray-900">{partner.totalDeliveries}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPartner(partner);
                  if (unassignedOrders.length > 0) {
                    handleAssignDelivery(unassignedOrders[0]);
                  }
                }}
                className="mt-3 sm:mt-4 w-full py-2.5 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
              >
                Assign to Next Order
              </button>
            </Card>
          ))}
        </div>
      </Card>

      {/* Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Delivery Partner"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4 sm:space-y-6">
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">{selectedOrder.id}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{selectedOrder.vendor}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedOrder.area} • {selectedOrder.items} items</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Select Delivery Partner</label>
              <div className="space-y-2 sm:space-y-3">
                {availablePartners.map((partner) => (
                  <div
                    key={partner.id}
                    onClick={() => setSelectedPartner(partner)}
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPartner?.id === partner.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          {partner.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{partner.name}</p>
                          <p className="text-xs text-gray-600">{partner.vehicle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <FiStar size={12} sm:size={16} className="text-yellow-500" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">{partner.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                      <span>Current: {partner.currentDeliveries}</span>
                      <span>Area: {partner.area}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 sm:px-6 py-2.5 h-12 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={!selectedPartner}
                className="px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <FiCheck size={14} sm:size={16} className="inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Confirm Assignment</span>
                <span className="sm:hidden">Confirm</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeliveryAssignment;
