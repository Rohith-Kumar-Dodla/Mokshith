import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { useSearchParams } from 'react-router-dom';
import { FiEye, FiPackage, FiCheckCircle, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import PageHeader from '../superadmin/PageHeader';
import SearchBar from '../superadmin/SearchBar';
import FilterDropdown from '../superadmin/FilterDropdown';
import StatusBadge from '../superadmin/StatusBadge';
import Modal from '../superadmin/Modal';
import Card from '../admin/Card';
import orderService from '../../services/orderService';
import {
  extractAdminOrdersResponse,
  formatPaymentMethodLabel,
} from '../../utils/orderMapper';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useViewport from '../../hooks/useViewport';

const STATUS_OPTIONS = [
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

export default function SuperAdminOrderManagement({
  title = 'Global Orders',
  subtitle = 'Manage all platform orders across regions',
}) {
  const { isMobile } = useViewport();
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
  const hasLoadedOnceRef = useRef(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStatus !== 'all') count += 1;
    if (paymentMethodFilter !== 'all' && kpiFilter !== KPI_KEYS.cod) count += 1;
    if (paymentStatusFilter !== 'all') count += 1;
    if (startDate) count += 1;
    if (endDate) count += 1;
    return count;
  }, [selectedStatus, paymentMethodFilter, paymentStatusFilter, startDate, endDate, kpiFilter]);

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
      if (paymentMethodFilter !== 'all') {
        params.paymentMethod = paymentMethodFilter;
      }
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
      const total = extractAdminOrdersResponse(totalRes).pagination?.total ?? 0;
      const completed = extractAdminOrdersResponse(completedRes).pagination?.total ?? 0;
      const cod = extractAdminOrdersResponse(codRes).pagination?.total ?? 0;
      setKpiCounts({ total, completed, cod });
    } catch {
      // KPI counts are secondary; list error handling covers primary failures
    }
  }, []);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await orderService.getAllOrders(buildListParams());
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

  useEffect(() => {
    loadKpiCounts();
  }, [loadKpiCounts]);

  const applyKpi = (key) => {
    setKpiFilter(key);
    if (key === KPI_KEYS.cod) {
      setPaymentMethodFilter('COD');
    } else if (key === KPI_KEYS.total || key === KPI_KEYS.completed) {
      setPaymentMethodFilter('all');
    }
    const next = new URLSearchParams(searchParams);
    if (key === KPI_KEYS.total) next.delete('kpi');
    else next.set('kpi', key);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setPaymentMethodFilter(kpiFilter === KPI_KEYS.cod ? 'COD' : 'all');
    setPaymentStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const summaryCards = [
    {
      key: KPI_KEYS.total,
      title: 'Total',
      value: String(kpiCounts.total),
      icon: FiPackage,
      description: 'Show all orders',
    },
    {
      key: KPI_KEYS.completed,
      title: 'Completed',
      value: String(kpiCounts.completed),
      icon: FiCheckCircle,
      description: 'Show payment-completed orders',
    },
    {
      key: KPI_KEYS.cod,
      title: 'COD',
      value: String(kpiCounts.cod),
      icon: FiDollarSign,
      description: 'Show COD payment method orders',
    },
  ];

  const emphasizePaymentMethod = kpiFilter === KPI_KEYS.completed;

  const renderOrderCard = (order) => (
    <Card key={order.id} className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{order.vendor || 'Vendor'}</p>
          <p className="text-xs text-gray-500">Order: {String(order.orderNumber || order.id).slice(-8)}</p>
          <p className="text-xs text-gray-500 mt-1">Amount: ₹{order.amount?.toLocaleString() ?? '—'}</p>
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <StatusBadge status={order.status} />
            <PaymentMethodBadge method={order.paymentMethod} emphasize={emphasizePaymentMethod} />
            <span className="text-xs text-gray-500">Pay: {order.paymentStatus}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{order.date || '—'}</p>
          <button
            type="button"
            onClick={() => {
              setSelectedOrder(order);
              setIsViewModalOpen(true);
            }}
            className="mt-2 inline-flex items-center gap-1 px-3 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg text-xs"
          >
            <FiEye size={14} /> View
          </button>
        </div>
      </div>
    </Card>
  );

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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <SearchBar
                placeholder="Search by order ID or vendor..."
                value={searchInput}
                onSearch={setSearchInput}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterDropdown
                label="Filter"
                options={STATUS_OPTIONS}
                selected={selectedStatus}
                onSelect={setSelectedStatus}
                onClear={() => setSelectedStatus('all')}
              />
              {kpiFilter !== KPI_KEYS.cod && (
                <FilterDropdown
                  label="Payment Method"
                  options={PAYMENT_METHOD_OPTIONS}
                  selected={paymentMethodFilter}
                  onSelect={setPaymentMethodFilter}
                  onClear={() => setPaymentMethodFilter('all')}
                />
              )}
              <FilterDropdown
                label="Payment Status"
                options={PAYMENT_STATUS_OPTIONS}
                selected={paymentStatusFilter}
                onSelect={setPaymentStatusFilter}
                onClear={() => setPaymentStatusFilter('all')}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm min-h-[44px]"
              aria-label="Start date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm min-h-[44px]"
              aria-label="End date"
            />
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] border rounded-lg text-sm text-red-600 hover:bg-red-50"
              >
                Reset filters ({activeFilterCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                loadOrders();
                loadKpiCounts();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] border rounded-lg text-sm hover:bg-gray-50"
            >
              <FiRefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </Card>

      {loading && orders.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-600">Loading orders...</Card>
      ) : isMobile ? (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <Card className="p-8 text-center text-sm text-gray-500">No orders found</Card>
          ) : (
            orders.map(renderOrderCard)
          )}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Order ID', 'Customer/Vendor', 'Amount', 'Order Status', 'Payment Method', 'Payment Status', 'Date', 'Actions'].map((h) => (
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
                    <td className="px-3 sm:px-6 py-3">
                      <PaymentMethodBadge method={order.paymentMethod} emphasize={emphasizePaymentMethod} />
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm capitalize">{order.paymentStatus}</td>
                    <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm">{order.date}</td>
                    <td className="px-3 sm:px-6 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsViewModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg text-xs sm:text-sm"
                      >
                        <FiEye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && <div className="text-center py-8 text-sm text-gray-500">No orders found</div>}
        </Card>
      )}

      {pagination && (
        <div className="flex items-center justify-between text-sm">
          <span>Page {pagination.page} of {pagination.pages} · {pagination.total} orders</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-2 min-h-[44px] border rounded disabled:opacity-50">Prev</button>
            <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-2 min-h-[44px] border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Order Details" size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">Order ID</p>
                <p className="text-lg font-bold">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Payment Method</p>
                <div className="mt-1">
                  <PaymentMethodBadge method={selectedOrder.paymentMethod} emphasize />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600">Order Status</p>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Payment Status</p>
                <p className="text-sm font-medium capitalize">{selectedOrder.paymentStatus}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Vendor</p>
                <p className="text-sm font-medium">{selectedOrder.vendor}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Amount</p>
                <p className="text-sm font-medium">₹{selectedOrder.amount?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
