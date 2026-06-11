import React, { useState } from 'react';
import { FiEye, FiCheck, FiX, FiSearch, FiFilter, FiMapPin, FiPhone, FiMail, FiCalendar, FiUsers, FiClock } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import StatusBadge from '../../components/admin/StatusBadge';
import SearchBar from '../../components/admin/SearchBar';
import FilterDropdown from '../../components/admin/FilterDropdown';
import Modal from '../../components/admin/Modal';
import { vendors } from '../../data/vendors';

const Vendors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const summaryCards = [
    { title: 'Total Vendors', value: '89', icon: FiUsers, color: 'blue' },
    { title: 'Active Vendors', value: '76', icon: FiCheck, color: 'green' },
    { title: 'Pending Approval', value: '8', icon: FiClock, color: 'orange' },
    { title: 'Suspended Vendors', value: '5', icon: FiX, color: 'red' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || vendor.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewVendor = (vendor) => {
    setSelectedVendor(vendor);
    setIsViewModalOpen(true);
  };

  const handleApproveVendor = (vendorId) => {
    console.log('Approve vendor:', vendorId);
  };

  const handleRejectVendor = (vendorId) => {
    console.log('Reject vendor:', vendorId);
  };

  const handleSuspendVendor = (vendorId) => {
    console.log('Suspend vendor:', vendorId);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Vendor Management"
        subtitle="Manage vendors within your assigned area"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {summaryCards.map((card, index) => {
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
            green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-500' },
            red: { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-500' },
          };
          const colors = colorClasses[card.color];
          return (
            <Card key={index} className="hover:shadow-md transition-shadow p-3 sm:p-6">
              <div className="flex items-start justify-between">
                <div className={`p-2 sm:p-3 rounded-lg ${colors.bg}`}>
                  <card.icon size={18} sm:size={24} className={colors.icon} />
                </div>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mt-3 sm:mt-4">{card.title}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
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

      {/* Vendors Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Vendor ID</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Shop Name</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Owner</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Area</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Orders</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Revenue</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{vendor.id}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{vendor.shopName}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{vendor.ownerName}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{vendor.phone}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{vendor.area}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{vendor.orders}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">₹{(vendor.orders * 500).toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <StatusBadge status={vendor.status} />
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleViewVendor(vendor)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                        title="View Profile"
                      >
                        <FiEye size={14} sm:size={16} className="text-blue-600" />
                      </button>
                      {vendor.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveVendor(vendor.id)}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                            title="Approve"
                          >
                            <FiCheck size={14} sm:size={16} className="text-green-600" />
                          </button>
                          <button
                            onClick={() => handleRejectVendor(vendor.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                            title="Reject"
                          >
                            <FiX size={14} sm:size={16} className="text-red-600" />
                          </button>
                        </>
                      )}
                      {vendor.status === 'approved' && (
                        <button
                          onClick={() => handleSuspendVendor(vendor.id)}
                          className="p-2 hover:bg-orange-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                          title="Suspend"
                        >
                          <FiX size={14} sm:size={16} className="text-orange-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredVendors.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500">No vendors found</p>
          </div>
        )}
      </Card>

      {/* Vendor Profile Modal */}
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
                    <FiPhone size={14} sm:size={18} className="text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-700">{selectedVendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiMail size={14} sm:size={18} className="text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-700">{selectedVendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiMapPin size={14} sm:size={18} className="text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-700">{selectedVendor.area}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Business Information</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiCalendar size={14} sm:size={18} className="text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-700">Registered: {selectedVendor.registeredDate}</span>
                  </div>
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-600">Total Orders</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-900">{selectedVendor.orders}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-green-600">Total Revenue</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-900">₹{(selectedVendor.orders * 500).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">GST Information</h4>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-700">GSTIN: 29ABCDE1234F1Z5</p>
                <p className="text-xs text-gray-500 mt-1">Verified</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Vendors;
