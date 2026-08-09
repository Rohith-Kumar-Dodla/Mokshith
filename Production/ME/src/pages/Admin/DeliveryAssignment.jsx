import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiTruck, FiUser, FiMapPin, FiStar, FiClock, FiCheck, FiRefreshCw } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import StatusBadge from '../../components/admin/StatusBadge';
import SearchBar from '../../components/admin/SearchBar';
import Modal from '../../components/admin/Modal';
import useDeliveryAssignment from '../../hooks/useDeliveryAssignment';

const DeliveryAssignment = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(
    ['unassigned', 'active', 'completed', 'partners'].includes(tabFromUrl) ? tabFromUrl : 'unassigned'
  );
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);

  const {
    unassignedItems,
    activeDeliveries,
    history,
    partners,
    loading,
    actionLoading,
    error,
    refreshAll,
    assignPartner,
    reassignPartner,
  } = useDeliveryAssignment();

  useEffect(() => {
    const next = searchParams.get('tab');
    if (['unassigned', 'active', 'completed', 'partners'].includes(next) && next !== activeTab) {
      setActiveTab(next);
    }
  }, [searchParams, activeTab]);

  const availablePartners = partners.filter((partner) => partner.status === 'active');
  const isInitialLoad =
    loading &&
    unassignedItems.length === 0 &&
    activeDeliveries.length === 0 &&
    history.length === 0 &&
    partners.length === 0;

  const selectTab = (id) => {
    setActiveTab(id);
    const next = new URLSearchParams(searchParams);
    if (id === 'unassigned') next.delete('tab');
    else next.set('tab', id);
    setSearchParams(next, { replace: true });
  };

  const tabItems = {
    unassigned: unassignedItems,
    active: activeDeliveries,
    completed: history,
  };

  const currentItems = (tabItems[activeTab] || []).filter((order) => {
    const term = searchTerm.toLowerCase();
    return (
      String(order.id).toLowerCase().includes(term) ||
      String(order.orderId || '').toLowerCase().includes(term) ||
      String(order.vendor).toLowerCase().includes(term)
    );
  });

  const filteredPartners = partners.filter((partner) => {
    const term = searchTerm.toLowerCase();
    return (
      String(partner.name || '').toLowerCase().includes(term) ||
      String(partner.phone || '').toLowerCase().includes(term) ||
      String(partner.id || '').toLowerCase().includes(term)
    );
  });

  const handleAssignDelivery = (order) => {
    setSelectedOrder(order);
    setSelectedPartner(null);
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedOrder || !selectedPartner) return;

    try {
      if (activeTab === 'active' && selectedOrder.deliveryPartnerId) {
        await reassignPartner(selectedOrder.id, selectedPartner.id);
      } else {
        await assignPartner(selectedOrder, selectedPartner.id);
      }
      setIsAssignModalOpen(false);
      setSelectedOrder(null);
      setSelectedPartner(null);
    } catch {
      // Error surfaced via hook state.
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Delivery Assignment"
        subtitle="Assign delivery partners to pending orders"
        actions={
          <button
            type="button"
            onClick={() => refreshAll({ silent: !isInitialLoad })}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 h-10 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'unassigned', label: 'Unassigned', count: unassignedItems.length },
          { id: 'active', label: 'Active', count: activeDeliveries.length },
          { id: 'completed', label: 'Completed', count: history.length },
          { id: 'partners', label: 'All Partners', count: partners.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => selectTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {activeTab === 'partners' ? (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">All Delivery Partners</h2>
            <span className="text-xs sm:text-sm font-medium text-gray-600">{filteredPartners.length} partners</span>
          </div>
          <div className="mb-4">
            <SearchBar
              placeholder="Search delivery partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
          {loading && partners.length === 0 ? (
            <p className="text-sm text-gray-500">Loading partners...</p>
          ) : filteredPartners.length === 0 ? (
            <p className="text-sm text-gray-500">No delivery partners found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredPartners.map((partner) => (
                <Card key={partner.id} className="hover:shadow-md transition-shadow p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0">
                        {(partner.name || '?').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">{partner.name}</h3>
                        <p className="text-xs text-gray-500">{partner.phone || '—'}</p>
                      </div>
                    </div>
                    <StatusBadge status={partner.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiMapPin size={12} />
                    <span>{partner.area || partner.assignedArea || '—'}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      ) : (
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {activeTab === 'unassigned' && 'Unassigned Orders'}
            {activeTab === 'active' && 'Active Deliveries'}
            {activeTab === 'completed' && 'Completed Deliveries'}
          </h2>
          <div className="flex items-center gap-2">
            <FiTruck size={16} className="text-orange-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              {loading ? 'Loading...' : `${currentItems.length} records`}
            </span>
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

        {isInitialLoad ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500">Loading delivery data...</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {currentItems.map((order) => (
              <div key={`${order.id}-${order.orderId}`} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900">
                        {String(order.orderId || order.id).slice(-8).toUpperCase()}
                      </h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700">{order.vendor}</p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiMapPin size={12} />
                        <span>{order.area}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiTruck size={12} />
                        <span>{order.items} items</span>
                      </div>
                      {order.date && (
                        <div className="flex items-center gap-1">
                          <FiClock size={12} />
                          <span>{new Date(order.date).toLocaleDateString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FiUser size={12} />
                        <span>
                          Assigned Partner:{' '}
                          {order.assignedPartnerLabel || order.deliveryPartnerName || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    {order.isRejectedAssignment && (
                      <p className="text-xs text-red-700 mt-2 font-medium">
                        Delivery Partner Rejected
                        {order.rejectionReason ? ` — ${order.rejectionReason}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">₹{Number(order.amount || 0).toLocaleString('en-IN')}</p>
                    {(activeTab === 'unassigned' || activeTab === 'active') && (
                      <button
                        type="button"
                        onClick={() => handleAssignDelivery(order)}
                        className="mt-2 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                      >
                        <FiTruck size={14} />
                        <span>
                          {order.isRejectedAssignment || activeTab === 'unassigned'
                            ? 'Assign Delivery Partner'
                            : 'Reassign'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isInitialLoad && currentItems.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <FiTruck size={36} className="text-gray-300 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-500">
              {activeTab === 'unassigned' && 'All orders have been assigned'}
              {activeTab === 'active' && 'No active deliveries'}
              {activeTab === 'completed' && 'No completed deliveries yet'}
            </p>
          </div>
        )}
      </Card>
      )}

      {activeTab !== 'partners' && (
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Available Delivery Partners</h2>
          <div className="flex items-center gap-2">
            <FiUser size={16} className="text-green-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">{availablePartners.length} partners available</span>
          </div>
        </div>

        {loading && partners.length === 0 ? (
          <p className="text-sm text-gray-500">Loading partners...</p>
        ) : availablePartners.length === 0 ? (
          <p className="text-sm text-gray-500">No active delivery partners found.</p>
        ) : (
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
                      <FiStar size={12} className="text-yellow-500" />
                      <span className="font-medium text-gray-900">{partner.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Area</span>
                    <span className="font-medium text-gray-900">{partner.area}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
      )}

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={activeTab === 'active' ? 'Reassign Delivery Partner' : 'Assign Delivery Partner'}
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4 sm:space-y-6">
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {String(selectedOrder.orderId || selectedOrder.id).slice(-8).toUpperCase()}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">{selectedOrder.vendor}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedOrder.area} • {selectedOrder.items} items</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Select Delivery Partner</label>
              <div className="space-y-2 sm:space-y-3">
                {availablePartners.map((partner) => (
                  <div
                    key={partner.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPartner(partner)}
                    onKeyDown={(event) => event.key === 'Enter' && setSelectedPartner(partner)}
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
                        <FiStar size={12} className="text-yellow-500" />
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
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 sm:px-6 py-2.5 h-12 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={!selectedPartner || actionLoading}
                className="px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <FiCheck size={14} className="inline mr-1 sm:mr-2" />
                {actionLoading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeliveryAssignment;
