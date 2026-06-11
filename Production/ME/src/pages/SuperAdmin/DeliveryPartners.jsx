import React, { useState } from 'react';
import { FiEye, FiEdit, FiXCircle } from 'react-icons/fi';
import { deliveryPartners } from '../../data/deliveryPartners';
import PageHeader from '../../components/superadmin/PageHeader';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';

const DeliveryPartners = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  const filteredPartners = deliveryPartners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: 'id', label: 'Partner ID' },
    { key: 'name', label: 'Name' },
    { key: 'vehicleType', label: 'Vehicle Type' },
    { key: 'vehicleNumber', label: 'Vehicle Number' },
    { key: 'assignedArea', label: 'Assigned Area' },
    { key: 'completedDeliveries', label: 'Completed Deliveries' },
    { key: 'rating', label: 'Rating' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'actions',
      label: 'Actions',
      render: () => (
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]" title="View">
            <FiEye className="text-blue-600" size={16} />
          </button>
          <button className="p-2 hover:bg-green-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]" title="Edit">
            <FiEdit className="text-green-600" size={16} />
          </button>
          <button className="p-2 hover:bg-yellow-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]" title="Deactivate">
            <FiXCircle className="text-yellow-600" size={16} />
          </button>
        </div>
      )
    }
  ];

  const stats = [
    { label: 'Total Partners', value: deliveryPartners.length, color: 'blue' },
    { label: 'Active', value: deliveryPartners.filter(p => p.status === 'active').length, color: 'green' },
    { label: 'Inactive', value: deliveryPartners.filter(p => p.status === 'inactive').length, color: 'red' },
    { label: 'Total Deliveries', value: deliveryPartners.reduce((acc, p) => acc + p.completedDeliveries, 0).toLocaleString(), color: 'purple' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Delivery Partners"
        subtitle="Manage delivery partner fleet and performance."
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
              placeholder="Search partners by name, vehicle number, or ID..."
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

      {/* Partners Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={filteredPartners} />
      </div>
    </div>
  );
};

export default DeliveryPartners;
