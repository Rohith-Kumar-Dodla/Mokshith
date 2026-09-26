import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { Link, useSearchParams } from 'react-router-dom';
import { FiEye, FiPackage, FiCheckCircle, FiDollarSign, FiCheck, FiRefreshCw, FiTruck, FiFilter } from 'react-icons/fi';
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
import ProcurementPanel from './ProcurementPanel';
import SupplierAllocationSummary from './SupplierAllocationSummary';

const ADMIN_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
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

const DELIVERY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Delivery' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'active', label: 'Active Delivery' },
  { value: 'attention', label: 'Delivery Attention' },
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

export default function AdminOrderManagement({ PageHeader, title, subtitle, deliveryAssignmentPath = '/admin/delivery-assignment', useLegacyProcurementPanel = true }) {
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
  const [deliveryFilter, setDeliveryFilter] = useState(searchParams.get('deliveryFilter') || 'all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
      deliveryFilter: deliveryFilter !== 'all' ? deliveryFilter : undefined,
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
    deliveryFilter,
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
  }, [debouncedSearch, selectedStatus, startDate, endDate, paymentMethodFilter, paymentStatusFilter, deliveryFilter, kpiFilter]);

  useEffect(() => {
    const nextStatus = searchParams.get('status');
    const nextMethod = searchParams.get('paymentMethod');
    const nextPaymentStatus = searchParams.get('paymentStatus');
    const nextDelivery = searchParams.get('deliveryFilter');
    if (nextStatus) setSelectedStatus(nextStatus.toUpperCase());
    if (nextMethod) setPaymentMethodFilter(nextMethod.toUpperCase());
    if (nextPaymentStatus) setPaymentStatusFilter(nextPaymentStatus.toUpperCase());
    if (nextDelivery) setDeliveryFilter(nextDelivery.toLowerCase());
  }, [searchParams]);

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

  const handleViewOrder = (order) => {
    setSelectedOrder({ ...order, rawId: order.raw?._id || order.id });
    setIsViewModalOpen(true);
  };
  const activeFilterCount = [selectedStatus !== 'all', paymentMethodFilter !== 'all', paymentStatusFilter !== 'all', deliveryFilter !== 'all', Boolean(startDate), Boolean(endDate)].filter(Boolean).length;

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
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="relative">
              <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] border rounded-lg text-sm hover:bg-gray-50">
                <FiFilter size={16} /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
              </button>
              {filtersOpen && <div className="absolute left-0 top-full mt-2 z-50 w-full sm:w-[22rem] rounded-lg border bg-white p-4 shadow-xl space-y-3">
                <FilterDropdown label="Status" options={ADMIN_STATUS_OPTIONS} selected={selectedStatus} onSelect={setSelectedStatus} />
                {kpiFilter !== KPI_KEYS.cod && <FilterDropdown label="Payment Method" options={PAYMENT_METHOD_OPTIONS} selected={paymentMethodFilter} onSelect={setPaymentMethodFilter} />}
                <FilterDropdown label="Payment Status" options={PAYMENT_STATUS_OPTIONS} selected={paymentStatusFilter} onSelect={setPaymentStatusFilter} />
                <FilterDropdown label="Delivery" options={DELIVERY_FILTER_OPTIONS} selected={deliveryFilter} onSelect={setDeliveryFilter} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm min-h-[44px]" aria-label="Start date" />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm min-h-[44px]" aria-label="End date" />
                </div>
                <button type="button" onClick={() => { setSelectedStatus('all'); setPaymentMethodFilter('all'); setPaymentStatusFilter('all'); setDeliveryFilter('all'); setStartDate(''); setEndDate(''); setFiltersOpen(false); }} className="text-sm text-blue-700 font-medium">Clear filters</button>
              </div>}
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
          <table className="hidden md:table w-full min-w-[980px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Order ID', 'Customer', 'Amount', 'Order Status', 'Payment Method', 'Payment Status', 'Delivery', 'Partner', 'Date', 'Actions'].map((h) => (
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
                  <td className="px-3 sm:px-6 py-3"><StatusBadge status={String(order.raw?.logisticsStatus || 'unassigned').toLowerCase()} /></td>
                  <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm">{order.deliveryPartner || 'Not Assigned'}</td>
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
        <div className="md:hidden divide-y">
          {orders.map((order) => (
            <div key={order.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-gray-900">#{String(order.id).slice(-8).toUpperCase()}</p><p className="text-sm text-gray-600">{order.vendor}</p></div><StatusBadge status={order.status} /></div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600"><span>Amount <strong className="block text-sm text-gray-900">₹{order.amount.toLocaleString('en-IN')}</strong></span><span>Payment <strong className="block text-sm text-gray-900">{formatPaymentMethodLabel(order.paymentMethod)} · {order.paymentStatus}</strong></span><span>Delivery <strong className="block text-sm text-gray-900">{getOrderStatusLabel(order.raw?.logisticsStatus || 'UNASSIGNED')}</strong></span><span>Partner <strong className="block text-sm text-gray-900">{order.deliveryPartner || 'Not Assigned'}</strong></span></div>
              <div className="flex flex-wrap gap-2"><button type="button" onClick={() => handleViewOrder(order)} className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg text-xs"><FiEye size={14} /> Manage</button>{!order.raw?.shipmentId || !order.raw?.logisticsStatus ? <Link to={`${deliveryAssignmentPath}?orderId=${encodeURIComponent(order.raw?._id || order.id)}`} className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] border border-blue-200 text-blue-700 rounded-lg text-xs"><FiTruck size={14} /> Assign Delivery</Link> : null}</div>
            </div>
          ))}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3"><h4 className="font-semibold text-gray-900 mb-1">Customer</h4><p>{selectedOrder.raw?.userId?.name || selectedOrder.vendor}</p><p className="text-gray-600">{selectedOrder.raw?.userId?.mobile || selectedOrder.raw?.userId?.email || 'Contact unavailable'}</p><p className="text-gray-600 mt-1">{selectedOrder.address}</p></div>
              <div className="rounded-lg border p-3"><h4 className="font-semibold text-gray-900 mb-1">Delivery</h4><p>Status: {getOrderStatusLabel(selectedOrder.raw?.logisticsStatus || 'UNASSIGNED')}</p><p>Partner: {selectedOrder.deliveryPartner || 'Not Assigned'}</p><p>Distance: {selectedOrder.raw?.deliveryDistance || 'Not available'}</p><Link to={`${deliveryAssignmentPath}?orderId=${encodeURIComponent(selectedOrder.raw?._id || selectedOrder.id)}`} className="inline-flex items-center gap-1 mt-2 text-blue-700 font-semibold"><FiTruck size={14} /> {selectedOrder.raw?.deliveryPartner ? 'Review assignment' : 'Assign Delivery'}</Link></div>
            </div>

            {useLegacyProcurementPanel ? <ProcurementPanel orderId={selectedOrder.raw?._id || selectedOrder.id} /> : <SupplierAllocationSummary orderId={selectedOrder.raw?._id || selectedOrder.id} />}

            <div className="rounded-lg border p-3"><h4 className="font-semibold text-gray-900 mb-2">Order items</h4><div className="space-y-2">{(selectedOrder.raw?.items || []).map((item, index) => <div key={`${item.productId?._id || item.productId || index}`} className="flex justify-between gap-3 text-sm"><span>{item.name || item.productId?.name || 'Product'} × {item.quantity}</span><span>₹{Number(item.finalPrice ?? item.price ?? 0).toLocaleString('en-IN')}</span></div>)}</div><div className="flex justify-between border-t mt-3 pt-3 font-semibold"><span>Total</span><span>₹{Number(selectedOrder.amount || 0).toLocaleString('en-IN')}</span></div></div>

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

          </div>
        )}
      </Modal>
    </div>
  );
}
