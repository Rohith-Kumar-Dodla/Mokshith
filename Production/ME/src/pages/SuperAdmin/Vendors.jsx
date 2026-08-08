import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { FiEye, FiCheck, FiX } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import adminService from '../../services/adminService';
import { mapVendorUser } from '../../utils/vendorMapper';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getUsers({ role: 'VENDOR' });
      const payload = response.data ?? response;
      const users = Array.isArray(payload) ? payload : payload?.users || [];
      setVendors(users.map(mapVendorUser));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to load vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const runVendorAction = async (vendorId, action) => {
    setActionLoading(true);
    setError('');
    try {
      if (action === 'approve') await adminService.approveUser(vendorId);
      else if (action === 'reject') await adminService.rejectUser(vendorId);
      else if (action === 'suspend') await adminService.updateUserStatus(vendorId, 'SUSPENDED');
      await loadVendors();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Approved', value: 'approved' },
    { label: 'Pending', value: 'pending' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const filteredVendors = useMemo(() => vendors.filter((vendor) => {
    const matchesSearch = vendor.shopName.toLowerCase().includes(searchTerm.toLowerCase())
      || vendor.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
      || String(vendor.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [vendors, searchTerm, statusFilter]);

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
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runVendorAction(row.id, 'approve')}
                className="p-2 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                title="Approve"
              >
                <FiCheck className="text-green-600" size={16} />
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runVendorAction(row.id, 'reject')}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Reject"
              >
                <FiX className="text-red-600" size={16} />
              </button>
            </>
          )}
          {row.status === 'approved' && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => runVendorAction(row.id, 'suspend')}
              className="p-2 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
              title="Suspend"
            >
              <FiX className="text-orange-600" size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const stats = [
    { label: 'Total Vendors', value: vendors.length },
    { label: 'Approved', value: vendors.filter((v) => v.status === 'approved').length },
    { label: 'Pending', value: vendors.filter((v) => v.status === 'pending').length },
    { label: 'Rejected', value: vendors.filter((v) => v.status === 'rejected').length },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Vendor Management"
        subtitle="Manage vendor registrations and approvals."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 items-stretch">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 h-full flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

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
            label="Filter"
            onClear={() => setStatusFilter('all')}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading vendors...</p>
        ) : filteredVendors.length === 0 ? (
          <p className="text-sm text-gray-500">No vendors found.</p>
        ) : (
          <DataTable columns={columns} data={filteredVendors} />
        )}
      </div>
    </div>
  );
};

export default Vendors;
