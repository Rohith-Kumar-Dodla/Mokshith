import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { useSearchParams } from 'react-router-dom';
import { FiEye, FiPackage, FiCheckCircle, FiDollarSign, FiCheck, FiRefreshCw } from 'react-icons/fi';
import Card from './Card';
import StatusBadge from './StatusBadge';
import SearchBar from './SearchBar';
import FilterDropdown from './FilterDropdown';
import Modal from './Modal';
import orderService from '../../services/orderService';
import {
  extractAdminOrdersResponse,
  formatPaymentMethodLabel,
  mapAdminOrderView,
} from '../../utils/orderMapper';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useOrderStatusSync from '../../hooks/useOrderStatusSync';
import { getOrderStatusLabel } from '../../utils/orderStatusSync';

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

const PAYMENT_METHOD_OPTIONS = [
  { value: 'all', label: 'All Methods' },
  { value: 'COD', label: 'COD' },
  { value: 'ONLINE', label: 'ONLINE' },
  { value: 'RAZORPAY', label: 'RAZORPAY' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'CARD' },
  { value: 'CREDIT', label: 'CREDIT' },
  { value: 'BANK_TRANSFER', label: 'BANK_TRANSFER' },
  { value: 'HYBRID', label: 'HYBRID' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Payment Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REJECTED', label: 'Rejected' },
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

const KPI_KEYS = {
  total: 'total',
  completed: 'completed',
  cod: 'cod',
};

function PaymentMethodBadge({ method, emphasize = false }) {
  const label = formatPaymentMethodLabel(method);
  const isCod = label === 'COD';
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold tracking-wide ${
        emphasize
          ? isCod
            ? 'bg-amber-100 text-amber-800 border border-amber-200'
            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      {label}
    </span>
  );
}

export default function AdminOrderManagement({ PageHeader, title, subtitle }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKpi = searchParams.get('kpi');
  const [kpiFilter, setKpiFilter] = useState(
    initialKpi === KPI_KEYS.completed || initialKpi === KPI_KEYS.cod ? initialKpi : KPI_KEYS.total
  );
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [kpiCounts, setKpiCounts] = useState({ total: 0, completed: 0, cod: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const hasLoadedOnceRef = useRef(false);

  const buildListParams = useCallback((overrides = {}) => {
    const params = {
      page: overrides.page ?? page,
      limit: overrides.limit ?? 20,
      search: debouncedSearch || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
    };

    if (kpiFilter === KPI_KEYS.completed) {
      params.paymentCompleted = true;
      if (paymentMethodFilter !== 'all') params.paymentMethod = paymentMethodFilter;
    } else if (kpiFilter === KPI_KEYS.cod) {
      params.paymentMethod = 'COD';
    } else if (paymentMethodFilter !== 'all') {
      params.paymentMethod = paymentMethodFilter;
    }

    return params;
  }, [
    page,
    debouncedSearch,
    selectedStatus,
    startDate,
    endDate,
    paymentStatusFilter,
    paymentMethodFilter,
    kpiFilter,
  ]);

  const loadKpiCounts = useCallback(async () => {
    try {
      const [totalRes, completedRes, codRes] = await Promise.all([
        orderService.getAllOrders({ page: 1, limit: 1 }),
        orderService.getAllOrders({ page: 1, limit: 1, paymentCompleted: true }),
        orderService.getAllOrders({ page: 1, limit: 1, paymentMethod: 'COD' }),
      ]);
      setKpiCounts({
        total: extractAdminOrdersResponse(totalRes).pagination?.total ?? 0,
        completed: extractAdminOrdersResponse(completedRes).pagination?.total ?? 0,
        cod: extractAdminOrdersResponse(codRes).pagination?.total ?? 0,
      });
    } catch {
      // secondary to list load
    }
  }, []);

  const loadOrders = useCallback(async ({ silent = false, forceRefresh = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = buildListParams();
      if (forceRefresh) params._refresh = Date.now();
      const response = await orderService.getAllOrders(params);
      const { orders: mapped, pagination: pag } = extractAdminOrdersResponse(response);
      setOrders(mapped);
      setPagination(pag);
      hasLoadedOnceRef.current = true;
    } catch (loadError) {
      setError(getUserFacingErrorMessage(loadError, 'Failed to load orders'));
      setOrders([]);
      setPagination(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [buildListParams]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedStatus, startDate, endDate, paymentMethodFilter, paymentStatusFilter, kpiFilter]);

  useEffect(() => {
    loadOrders({ silent: hasLoadedOnceRef.current });
  }, [loadOrders]);

  useOrderStatusSync((event) => {
    setOrders((current) =>
      current.map((order) => {
        const orderId = String(order.raw?._id || order.id);
        if (orderId !== String(event.orderId)) return order;

        const updatedRaw = {
          ...(order.raw || {}),
          status: event.status,
          statusHistory: event.statusHistory || order.raw?.statusHistory,
          logisticsStatus: event.logisticsStatus || order.raw?.logisticsStatus,
          updatedAt: event.updatedAt || order.raw?.updatedAt,
        };
        return mapAdminOrderView(updatedRaw);
      })
    );

    setSelectedOrder((current) => {
      if (!current) return current;
      const currentId = String(current.raw?._id || current.id);
      if (currentId !== String(event.orderId)) return current;
      const updatedRaw = {
        ...(current.raw || {}),
        status: event.status,
        statusHistory: event.statusHistory || current.raw?.statusHistory,
        logisticsStatus: event.logisticsStatus || current.raw?.logisticsStatus,
        updatedAt: event.updatedAt || current.raw?.updatedAt,
      };
      return mapAdminOrderView(updatedRaw);
    });
  });

  useEffect(() => {
    loadKpiCounts();
  }, [loadKpiCounts]);

  const applyKpi = (key) => {
    setKpiFilter(key);
    if (key === KPI_KEYS.cod) setPaymentMethodFilter('COD');
    else if (key === KPI_KEYS.total || key === KPI_KEYS.completed) setPaymentMethodFilter('all');
    const next = new URLSearchParams(searchParams);
    if (key === KPI_KEYS.total) next.delete('kpi');
    else next.set('kpi', key);
    setSearchParams(next, { replace: true });
  };

  const summaryCards = [
    { key: KPI_KEYS.total, title: 'Total', value: String(kpiCounts.total), icon: FiPackage, description: 'Show all orders' },
    { key: KPI_KEYS.completed, title: 'Completed', value: String(kpiCounts.completed), icon: FiCheckCircle, description: 'Show payment-completed orders' },
    { key: KPI_KEYS.cod, title: 'COD', value: String(kpiCounts.cod), icon: FiDollarSign, description: 'Show COD payment method orders' },
  ];

  const emphasizePaymentMethod = kpiFilter === KPI_KEYS.completed;

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
      await loadKpiCounts();
    } catch (updateError) {
      setError(getUserFacingErrorMessage(updateError, 'Failed to update status'));
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
    <div className="space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden">
      <PageHeader title={title} subtitle={subtitle} />

      {error && <Card className="p-4 text-sm text-red-600">{error}</Card>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {summaryCards.map((card) => {
          const active = kpiFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => applyKpi(card.key)}
              aria-pressed={active}
              aria-label={card.description}
              className={`text-left rounded-xl border p-4 sm:p-5 transition-all min-h-[88px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                active
                  ? 'border-blue-400 bg-blue-50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">{card.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <card.icon className={active ? 'text-blue-600' : 'text-gray-400'} size={22} />
              </div>
            </button>
          );
        })}
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <SearchBar placeholder="Search by order ID or vendor..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onClear={() => setSearchInput('')} />
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            <FilterDropdown label="Status" options={ADMIN_STATUS_OPTIONS} selected={selectedStatus} onSelect={setSelectedStatus} />
            {kpiFilter !== KPI_KEYS.cod && (
              <FilterDropdown label="Payment Method" options={PAYMENT_METHOD_OPTIONS} selected={paymentMethodFilter} onSelect={setPaymentMethodFilter} />
            )}
            <FilterDropdown label="Payment Status" options={PAYMENT_STATUS_OPTIONS} selected={paymentStatusFilter} onSelect={setPaymentStatusFilter} />
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm min-h-[44px]" aria-label="Start date" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm min-h-[44px]" aria-label="End date" />
            </div>
            <button
              type="button"
              onClick={() => {
                loadOrders({ forceRefresh: true });
                loadKpiCounts();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] border rounded-lg text-sm hover:bg-gray-50"
            >
              <FiRefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Order ID', 'Vendor', 'Amount', 'Order Status', 'Payment Method', 'Payment Status', 'Date', 'Actions'].map((h) => (
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
                  <td className="px-3 sm:px-6 py-3">
                    <StatusBadge status={order.status} />
                    {order.raw?.logisticsStatus && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        Delivery: {getOrderStatusLabel(order.raw.logisticsStatus)}
                      </p>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-3">
                    <PaymentMethodBadge method={order.paymentMethod} emphasize={emphasizePaymentMethod} />
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm capitalize">{order.paymentStatus}</td>
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
            <span>Page {pagination.page} of {pagination.pages} · {pagination.total} orders</span>
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
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={selectedOrder.status} />
                <PaymentMethodBadge method={selectedOrder.paymentMethod} emphasize />
                <p className="text-xs text-gray-500 capitalize">Payment: {selectedOrder.paymentStatus}</p>
              </div>
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
