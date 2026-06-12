import React, { useEffect, useMemo, useState } from 'react';
import { FiEye } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import orderService from '../../services/orderService';

const mapOrderStatus = (status) => String(status || 'pending').toLowerCase();

const mapOrder = (order) => ({
  id: order.orderNumber || order._id || order.id,
  vendor: order.userId?.name || order.vendorName || '—',
  area: order.shippingAddress?.city || order.area || '—',
  admin: order.assignedAdmin?.name || '—',
  amount: order.totalAmount || 0,
  status: mapOrderStatus(order.status),
  deliveryPartner: order.deliveryPartner?.name || null,
  date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—',
});

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError('');
      try {
        const response = await orderService.getAllOrders({ _refresh: Date.now() });
        const payload = response.data ?? response;
        const list = Array.isArray(payload) ? payload : payload?.orders || [];
        if (isMounted) {
          setOrders(list.map(mapOrder));
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || err?.message || 'Failed to load orders');
          setOrders([]);
        }
      } finally {
        if (isMounted && !silent) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadOrders({ silent: true });
      }
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesSearch = String(order.id).toLowerCase().includes(searchTerm.toLowerCase())
      || order.vendor.toLowerCase().includes(searchTerm.toLowerCase())
      || order.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [orders, searchTerm, statusFilter]);

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'area', label: 'Area' },
    { key: 'admin', label: 'Admin' },
    { key: 'amount', label: 'Amount', render: (value) => `₹${Number(value || 0).toLocaleString()}` },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    { key: 'deliveryPartner', label: 'Delivery Partner', render: (value) => value || '-' },
    { key: 'date', label: 'Date' },
    {
      key: 'actions',
      label: 'Actions',
      render: () => (
        <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors min-h-[36px] min-w-[36px]" title="View">
          <FiEye className="text-blue-600" size={16} />
        </button>
      ),
    },
  ];

  const stats = [
    { label: 'Total Orders', value: orders.length },
    { label: 'Pending', value: orders.filter((o) => o.status === 'pending').length },
    { label: 'Processing', value: orders.filter((o) => o.status === 'processing').length },
    { label: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Monitor and manage platform orders."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search orders..."
              value={searchTerm}
              onSearch={setSearchTerm}
            />
          </div>
          <FilterDropdown
            options={statusOptions}
            selected={statusFilter}
            onSelect={setStatusFilter}
            label="Filter by Status"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders found.</p>
        ) : (
          <DataTable columns={columns} data={filteredOrders} />
        )}
      </div>
    </div>
  );
};

export default Orders;
