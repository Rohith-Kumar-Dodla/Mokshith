import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { useSearchParams } from 'react-router-dom';
import { FiEye, FiCheck, FiX, FiMapPin, FiPhone, FiMail, FiCalendar, FiUsers, FiClock } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import TableResponsive from '../../components/common/TableResponsive';
import StatusBadge from '../../components/admin/StatusBadge';
import SearchBar from '../../components/admin/SearchBar';
import FilterDropdown from '../../components/admin/FilterDropdown';
import Modal from '../../components/admin/Modal';
import adminService from '../../services/adminService';
import { mapVendorUser } from '../../utils/vendorMapper';

const KPI_STATUS = {
  total: 'all',
  active: 'approved',
  pending: 'pending',
  suspended: 'suspended',
};

const Vendors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = searchParams.get('status');
  const initialStatus = ['approved', 'pending', 'rejected', 'suspended', 'all'].includes(statusFromUrl)
    ? statusFromUrl
    : statusFromUrl === 'active'
      ? 'approved'
      : 'all';

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [activeKpi, setActiveKpi] = useState(
    initialStatus === 'approved' ? 'active'
      : initialStatus === 'pending' ? 'pending'
        : initialStatus === 'suspended' || initialStatus === 'rejected' ? 'suspended'
          : 'total'
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getUsers({ role: 'VENDOR' });
      const payload = response.data ?? response;
      const users = Array.isArray(payload) ? payload : payload?.users || [];
      setVendors(users.map(mapVendorUser));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to load vendors'));
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  useEffect(() => {
    const next = searchParams.get('status');
    if (!next || next === 'all') {
      setSelectedStatus('all');
      setActiveKpi('total');
      return;
    }
    if (next === 'active' || next === 'approved') {
      setSelectedStatus('approved');
      setActiveKpi('active');
      return;
    }
    if (next === 'pending') {
      setSelectedStatus('pending');
      setActiveKpi('pending');
      return;
    }
    if (next === 'suspended' || next === 'rejected') {
      setSelectedStatus(next);
      setActiveKpi('suspended');
    }
  }, [searchParams]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const filteredVendors = useMemo(() => vendors.filter((vendor) => {
    const matchesSearch = vendor.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(vendor.id).toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (activeKpi === 'suspended') {
      matchesStatus = vendor.status === 'suspended' || vendor.status === 'rejected';
    } else if (selectedStatus !== 'all') {
      matchesStatus = vendor.status === selectedStatus;
    }

    return matchesSearch && matchesStatus;
  }), [vendors, searchTerm, selectedStatus, activeKpi]);

  const applyKpi = (kpiKey) => {
    setActiveKpi(kpiKey);
    const status = KPI_STATUS[kpiKey] || 'all';
    setSelectedStatus(status);
    const next = new URLSearchParams(searchParams);
    if (status === 'all') next.delete('status');
    else next.set('status', status === 'approved' ? 'active' : status);
    setSearchParams(next, { replace: true });
  };

  const handleStatusFilter = (value) => {
    setSelectedStatus(value);
    if (value === 'all') setActiveKpi('total');
    else if (value === 'approved') setActiveKpi('active');
    else if (value === 'pending') setActiveKpi('pending');
    else if (value === 'suspended' || value === 'rejected') setActiveKpi('suspended');

    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('status');
    else next.set('status', value === 'approved' ? 'active' : value);
    setSearchParams(next, { replace: true });
  };

  const summaryCards = [
    { key: 'total', title: 'Total Vendors', value: String(vendors.length), icon: FiUsers, color: 'blue' },
    { key: 'active', title: 'Active Vendors', value: String(vendors.filter((v) => v.status === 'approved').length), icon: FiCheck, color: 'green' },
    { key: 'pending', title: 'Pending Approval', value: String(vendors.filter((v) => v.status === 'pending').length), icon: FiClock, color: 'orange' },
    { key: 'suspended', title: 'Suspended Vendors', value: String(vendors.filter((v) => v.status === 'suspended' || v.status === 'rejected').length), icon: FiX, color: 'red' },
  ];

  const handleViewVendor = (vendor) => {
    setSelectedVendor(vendor);
    setIsViewModalOpen(true);
  };

  const runVendorAction = async (vendorId, action) => {
    setActionLoading(true);
    setError('');
    try {
      if (action === 'approve') await adminService.approveUser(vendorId);
      else if (action === 'reject') await adminService.rejectUser(vendorId);
      else if (action === 'suspend') await adminService.updateUserStatus(vendorId, 'SUSPENDED');
      await loadVendors();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Action failed'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Vendor Management"
        subtitle="Manage vendors within your assigned area"
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {summaryCards.map((card) => {
          const colorClasses = {
            blue: { bg: 'bg-blue-100', icon: 'text-blue-500' },
            green: { bg: 'bg-green-100', icon: 'text-green-500' },
            orange: { bg: 'bg-orange-100', icon: 'text-orange-500' },
            red: { bg: 'bg-red-100', icon: 'text-red-500' },
          };
          const colors = colorClasses[card.color];
          const active = activeKpi === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => applyKpi(card.key)}
              aria-pressed={active}
              aria-label={`Show ${card.title}`}
              className={`text-left rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                active ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-transparent'
              }`}
            >
              <Card className={`hover:shadow-md transition-shadow p-3 sm:p-6 ${active ? 'bg-transparent shadow-none' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className={`p-2 sm:p-3 rounded-lg ${colors.bg}`}>
                    <card.icon size={18} className={colors.icon} />
                  </div>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mt-3 sm:mt-4">{card.title}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </Card>
            </button>
          );
        })}
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search vendors by shop name, owner, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
          <FilterDropdown
            label="Status"
            options={statusOptions}
            selected={selectedStatus}
            onSelect={handleStatusFilter}
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500">Loading vendors...</p>
          </div>
        ) : (
          <TableResponsive>
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Vendor ID</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Shop Name</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Owner</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Phone</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Area</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{String(vendor.id).slice(-8)}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{vendor.shopName}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{vendor.ownerName}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{vendor.phone}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{vendor.area}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <StatusBadge status={vendor.status} />
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewVendor(vendor)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                          title="View Profile"
                        >
                          <FiEye size={14} className="text-blue-600" />
                        </button>
                        {vendor.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => runVendorAction(vendor.id, 'approve')}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
                              title="Approve"
                            >
                              <FiCheck size={14} className="text-green-600" />
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => runVendorAction(vendor.id, 'reject')}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
                              title="Reject"
                            >
                              <FiX size={14} className="text-red-600" />
                            </button>
                          </>
                        )}
                        {vendor.status === 'approved' && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => runVendorAction(vendor.id, 'suspend')}
                            className="p-2 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
                            title="Suspend"
                          >
                            <FiX size={14} className="text-orange-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableResponsive>
        )}
        {!loading && filteredVendors.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500">No vendors found</p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Vendor Profile"
        size="lg"
      >
        {selectedVendor && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
                {selectedVendor.shopName.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedVendor.shopName}</h3>
                <p className="text-sm sm:text-base text-gray-600 mt-1">{selectedVendor.ownerName}</p>
                <div className="mt-3">
                  <StatusBadge status={selectedVendor.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Contact Information</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiPhone size={14} className="text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-700">{selectedVendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiMail size={14} className="text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-700">{selectedVendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiMapPin size={14} className="text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-700">{selectedVendor.area}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Business Information</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiCalendar size={14} className="text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-700">Registered: {selectedVendor.registeredDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Vendors;
