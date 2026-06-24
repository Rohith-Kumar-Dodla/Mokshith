import React, { useEffect, useMemo, useState } from 'react';
import { FiEye, FiCheck, FiX } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import adminService from '../../services/adminService';

const mapPartnerStatus = (status) => {
  const normalized = String(status || '').toUpperCase();
  return normalized === 'ACTIVE' ? 'active' : 'inactive';
};

const mapPartner = (user) => ({
  id: user._id || user.id,
  name: user.name || '—',
  vehicleType: user.vehicleType || '—',
  vehicleNumber: user.vehicleNumber || '—',
  assignedArea: user.assignedArea || user.addresses?.[0]?.city || '—',
  completedDeliveries: user.completedDeliveries ?? '—',
  rating: user.rating ?? '—',
  status: mapPartnerStatus(user.status),
});

const DeliveryPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadPartners = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await adminService.getUsers({ role: 'DELIVERY_PARTNER' });
        const payload = response.data ?? response;
        const users = Array.isArray(payload) ? payload : payload?.users || [];
        setPartners(users.map(mapPartner));
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load delivery partners');
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };

    loadPartners();
  }, []);

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  const filteredPartners = useMemo(() => partners.filter((partner) => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase())
      || String(partner.vehicleNumber).toLowerCase().includes(searchTerm.toLowerCase())
      || String(partner.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [partners, searchTerm, statusFilter]);

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
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); /* view details - implement as needed */ }}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors min-h-[36px] min-w-[36px]"
            title="View"
          >
            <FiEye className="text-blue-600" size={16} />
          </button>
          {row.status !== 'active' ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); runStatusAction(row.id, 'activate'); }}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors min-h-[36px] min-w-[36px]"
              title="Activate"
            >
              <FiCheck className="text-green-600" size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); runStatusAction(row.id, 'deactivate'); }}
              className="p-2 hover:bg-orange-50 rounded-lg transition-colors min-h-[36px] min-w-[36px]"
              title="Deactivate"
            >
              <FiX className="text-orange-600" size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); /* edit placeholder */ window.alert('Edit partner - not implemented'); }}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors min-h-[36px] min-w-[36px]"
            title="Edit"
          >
            ✎
          </button>
        </div>
      ),
    },
  ];

  const [actionLoading, setActionLoading] = useState(false);

  const runStatusAction = async (id, action) => {
    setActionLoading(true);
    try {
      if (action === 'activate') await adminService.updateUserStatus(id, 'ACTIVE');
      if (action === 'deactivate') await adminService.updateUserStatus(id, 'INACTIVE');
      // reload partners
      const response = await adminService.getUsers({ role: 'DELIVERY_PARTNER' });
      const payload = response.data ?? response;
      const users = Array.isArray(payload) ? payload : payload?.users || [];
      setPartners(users.map(mapPartner));
    } catch (err) {
      // ignore UI-only error handling here
    } finally {
      setActionLoading(false);
    }
  };

  const stats = [
    { label: 'Total Partners', value: partners.length },
    { label: 'Active', value: partners.filter((p) => p.status === 'active').length },
    { label: 'Inactive', value: partners.filter((p) => p.status === 'inactive').length },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Delivery Partners"
        subtitle="Manage delivery partner accounts."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
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
              placeholder="Search delivery partners..."
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
          <p className="text-sm text-gray-500">Loading delivery partners...</p>
        ) : filteredPartners.length === 0 ? (
          <p className="text-sm text-gray-500">No delivery partners found.</p>
        ) : (
          <DataTable columns={columns} data={filteredPartners} />
        )}
      </div>
    </div>
  );
};

export default DeliveryPartners;
