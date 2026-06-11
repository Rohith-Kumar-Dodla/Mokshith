import React, { useState } from 'react';
import { FiCheck, FiX, FiEye, FiXCircle } from 'react-icons/fi';
import { vendors } from '../../data/vendors';
import PageHeader from '../../components/superadmin/PageHeader';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';

const Vendors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Approved', value: 'approved' },
    { label: 'Pending', value: 'pending' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: 'id', label: 'Vendor ID' },
    { key: 'shopName', label: 'Shop Name' },
    { key: 'ownerName', label: 'Owner Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'area', label: 'Area' },
    { key: 'orders', label: 'Orders' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1 sm:gap-2">
          {row.status === 'pending' && (
            <>
              <button className="p-2 hover:bg-green-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]" title="Approve">
                <FiCheck className="text-green-600" size={16} />
              </button>
              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]" title="Reject">
                <FiX className="text-red-600" size={16} />
              </button>
            </>
          )}
          {row.status === 'approved' && (
            <button className="p-2 hover:bg-yellow-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]" title="Suspend">
              <FiXCircle className="text-yellow-600" size={16} />
            </button>
          )}
          <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]" title="View">
            <FiEye className="text-blue-600" size={16} />
          </button>
        </div>
      )
    }
  ];

  const stats = [
    { label: 'Total Vendors', value: vendors.length, color: 'blue' },
    { label: 'Approved', value: vendors.filter(v => v.status === 'approved').length, color: 'green' },
    { label: 'Pending', value: vendors.filter(v => v.status === 'pending').length, color: 'yellow' },
    { label: 'Rejected', value: vendors.filter(v => v.status === 'rejected').length, color: 'red' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Vendor Management"
        subtitle="Manage vendor registrations and approvals."
      />

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search vendors by shop name, owner, or ID..."
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

      {/* Vendor Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={filteredVendors} />
      </div>
    </div>
  );
};

export default Vendors;
