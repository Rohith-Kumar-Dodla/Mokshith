import React, { useState } from 'react';
import { FiEye } from 'react-icons/fi';
import { orders } from '../../data/orders';
import PageHeader from '../../components/superadmin/PageHeader';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'area', label: 'Area' },
    { key: 'admin', label: 'Admin' },
    { key: 'amount', label: 'Amount', render: (value) => `₹${value.toLocaleString()}` },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    { key: 'deliveryPartner', label: 'Delivery Partner', render: (value) => value || '-' },
    { key: 'date', label: 'Date' },
    {
      key: 'actions',
      label: 'Actions',
      render: () => (
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]" title="View">
            <FiEye className="text-blue-600" size={16} />
          </button>
        </div>
      )
    }
  ];

  const stats = [
    { label: 'Total Orders', value: orders.length, color: 'blue' },
    { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'yellow' },
    { label: 'Processing', value: orders.filter(o => o.status === 'processing').length, color: 'blue' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: 'green' },
    { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: 'red' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Order Monitoring"
        subtitle="Track and monitor all platform orders."
      />

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search orders by ID, vendor, or area..."
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

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={filteredOrders} />
      </div>
    </div>
  );
};

export default Orders;
