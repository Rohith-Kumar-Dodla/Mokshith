import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiEye, FiPackage, FiTruck, FiClock, FiCheck, FiRefreshCw } from 'react-icons/fi';
import Card from './Card';
import StatusBadge from './StatusBadge';
import SearchBar from './SearchBar';
import FilterDropdown from './FilterDropdown';
import Modal from './Modal';
import orderService from '../../services/orderService';
import { computeOrderStats, extractAdminOrdersResponse } from '../../utils/orderMapper';

const ADMIN_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'READY_TO_DISPATCH', label: 'Ready To Dispatch' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out For Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const NEXT_STATUS_MAP = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'PACKED', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_TO_DISPATCH', 'CANCELLED'],
  READY_TO_DISPATCH: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'RETURNED'],
  COMPLETED: ['RETURNED'],
  RETURNED: ['REFUNDED'],
};

export default function AdminOrderManagement({ PageHeader, title, subtitle }) {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [statusNote, setStatusNote] = useState('');

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        _refresh: Date.now(),
      };
      const response = await orderService.getAllOrders(params);
      const { orders: mapped, pagination: pag } = extractAdminOrdersResponse(response);
      setOrders(mapped);
      setPagination(pag);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError.message || 'Failed to load orders');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, searchTerm, selectedStatus, startDate, endDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const stats = useMemo(() => computeOrderStats(orders), [orders]);

  const summaryCards = [
    { title: 'Total', value: String(stats.totalOrders), icon: FiPackage, color: 'blue' },
    { title: 'Pending', value: String(stats.pendingOrders), icon: FiClock, color: 'orange' },
    { title: 'Confirmed', value: String(stats.confirmedOrders), icon: FiPackage, color: 'blue' },
    { title: 'Processing', value: String(stats.processingOrders), icon: FiPackage, color: 'purple' },
    { title: 'Dispatched', value: String(stats.dispatchedOrders), icon: FiTruck, color: 'green' },
    { title: 'Delivered', value: String(stats.deliveredOrders), icon: FiTruck, color: 'green' },
    { title: 'Cancelled', value: String(stats.cancelledOrders), icon: FiClock, color: 'red' },
  ];

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !confirmStatus) return;
    setStatusUpdating(true);
    try {
      await orderService.updateOrderStatus(selectedOrder.rawId || selectedOrder.id, {
        status: confirmStatus,
        note: statusNote,
      });
      setConfirmStatus(null);
      setStatusNote('');
      await loadOrders({ silent: true });
      if (selectedOrder) {
        const refreshed = orders.find((o) => o.id === selectedOrder.id);
        if (refreshed) setSelectedOrder(refreshed);
      }
    } catch (updateError) {
      setError(updateError?.response?.data?.message || updateError.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder({ ...order, rawId: order.raw?._id || order.id });
    setIsViewModalOpen(true);
    setConfirmStatus(null);
    setStatusNote('');
  };

  const nextStatuses = selectedOrder?.backendStatus
    ? NEXT_STATUS_MAP[selectedOrder.backendStatus] || []
    : [];

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader title={title} subtitle={subtitle} />
        <Card className="p-8 text-center text-sm text-gray-600">Loading orders...</Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

      {error && <Card className="p-4 text-sm text-red-600">{error}</Card>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="text-center p-2 sm:p-4">
            <p className="text-gray-600 text-xs">{card.title}</p>
            <p className="text-base sm:text-xl font-bold text-gray-900">{card.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <SearchBar placeholder="Search by order ID or vendor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} />
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            <FilterDropdown label="Status" options={ADMIN_STATUS_OPTIONS} selected={selectedStatus} onSelect={setSelectedStatus} />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm min-h-[44px]" aria-label="Start date" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm min-h-[44px]" aria-label="End date" />
            <button type="button" onClick={() => loadOrders()} className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] border rounded-lg text-sm hover:bg-gray-50">
              <FiRefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Order ID', 'Vendor', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium">{order.id}</td>
                  <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm">{order.vendor}</td>
                  <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold">₹{order.amount.toLocaleString()}</td>
                  <td className="px-3 sm:px-6 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm">{order.date}</td>
                  <td className="px-3 sm:px-6 py-3">
                    <button type="button" onClick={() => handleViewOrder(order)} className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg text-xs sm:text-sm">
                      <FiEye size={14} /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && <div className="text-center py-8 text-sm text-gray-500">No orders found</div>}
        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span>Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border rounded disabled:opacity-50">Prev</button>
              <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Order Management" size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">Order ID</p>
                <p className="text-lg font-bold">{selectedOrder.id}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {(selectedOrder.raw?.statusHistory || []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Status History</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedOrder.raw.statusHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm p-2 bg-gray-50 rounded">
                      <FiCheck className="text-green-600 mt-0.5 shrink-0" size={14} />
                      <div>
                        <p className="font-medium">{entry.status}</p>
                        <p className="text-gray-500">{entry.note} · {new Date(entry.changedAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nextStatuses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setConfirmStatus(status)}
                      className={`px-3 py-2 min-h-[44px] rounded-lg text-xs sm:text-sm border ${confirmStatus === status ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}
                    >
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                {confirmStatus && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Optional note for audit log"
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={handleStatusUpdate} disabled={statusUpdating} className="px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm">
                        {statusUpdating ? 'Updating...' : `Confirm ${confirmStatus.replace(/_/g, ' ')}`}
                      </button>
                      <button type="button" onClick={() => setConfirmStatus(null)} className="px-4 py-2.5 border rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
