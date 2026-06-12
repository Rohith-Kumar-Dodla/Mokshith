import React, { useEffect, useMemo, useState } from 'react';
import { FiEye, FiPackage, FiTruck, FiDollarSign, FiClock } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import StatusBadge from '../../components/admin/StatusBadge';
import SearchBar from '../../components/admin/SearchBar';
import FilterDropdown from '../../components/admin/FilterDropdown';
import Modal from '../../components/admin/Modal';
import orderService from '../../services/orderService';
import { computeOrderStats, mapAdminOrders } from '../../utils/orderMapper';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await orderService.getAllOrders({ _refresh: Date.now() });
        if (isMounted) {
          setOrders(mapAdminOrders(response));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError?.response?.data?.message || loadError.message || 'Failed to load orders');
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

  const stats = useMemo(() => computeOrderStats(orders), [orders]);

  const summaryCards = [
    { title: 'Total Orders', value: String(stats.totalOrders), icon: FiPackage, color: 'blue' },
    { title: 'Pending', value: String(stats.pendingOrders), icon: FiClock, color: 'orange' },
    { title: 'Confirmed', value: String(stats.confirmedOrders), icon: FiPackage, color: 'blue' },
    { title: 'Processing', value: String(stats.processingOrders), icon: FiPackage, color: 'purple' },
    { title: 'Dispatched', value: String(stats.dispatchedOrders), icon: FiTruck, color: 'green' },
    { title: 'Delivered', value: String(stats.deliveredOrders), icon: FiTruck, color: 'green' },
    { title: 'Cancelled', value: String(stats.cancelledOrders), icon: FiClock, color: 'red' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'packed', label: 'Packed' },
    { value: 'dispatched', label: 'Dispatched' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(order.vendor).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader title="Area Orders" subtitle="Monitor and manage orders within your assigned area" />
        <Card className="p-8 text-center text-sm text-gray-600">Loading orders...</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader title="Area Orders" subtitle="Monitor and manage orders within your assigned area" />
        <Card className="p-8 text-center text-sm text-red-600">{error}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Area Orders"
        subtitle="Monitor and manage orders within your assigned area"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4">
        {summaryCards.map((card, index) => {
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
            green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-500' },
            red: { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-500' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-500' },
          };
          const colors = colorClasses[card.color];
          return (
            <Card key={index} className="text-center p-2 sm:p-4">
              <div className="flex justify-center mb-1 sm:mb-2">
                <div className={`p-1.5 sm:p-2 rounded-lg ${colors.bg}`}>
                  <card.icon size={14} sm:size={20} className={colors.icon} />
                </div>
              </div>
              <p className="text-gray-600 text-xs">{card.title}</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">{card.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search orders by ID or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <FilterDropdown
              label="Status"
              options={statusOptions}
              selected={selectedStatus}
              onSelect={setSelectedStatus}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Order ID</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Vendor</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Products</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Amount</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Date</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Delivery Partner</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{order.vendor}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{order.items} items</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">₹{order.amount.toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{order.date}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{order.deliveryPartner || 'Not Assigned'}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                    >
                      <FiEye size={14} sm:size={16} />
                      <span className="hidden sm:inline">View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500">No orders found</p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Order ID</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{selectedOrder.id}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Vendor Details</h4>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-900">{selectedOrder.vendor}</p>
                <p className="text-xs text-gray-600">Vendor ID: {selectedOrder.vendorId}</p>
                <p className="text-xs text-gray-600">Area: {selectedOrder.area}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Ordered Products</h4>
              <div className="space-y-2 sm:space-y-3">
                {(selectedOrder.products || []).map((item) => (
                  <div key={`${item.productId}-${item.productName}`} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">₹{item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Pricing</h4>
              <div className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900">₹{selectedOrder.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Delivery Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Delivery Partner</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{selectedOrder.deliveryPartner || 'Not Assigned'}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Order Date</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{selectedOrder.date}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Payment Information</h4>
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiDollarSign size={16} sm:size={20} className="text-green-600" />
                  <span className="text-xs sm:text-sm font-medium text-green-900">
                    {selectedOrder.paymentStatus === 'paid' ? 'Payment Completed' : 'Payment Pending'}
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">Method: {selectedOrder.paymentMethod}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
