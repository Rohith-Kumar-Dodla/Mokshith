import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus, FiUsers, FiTruck } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import Modal from '../../components/superadmin/Modal';
import PasswordInput from '../../components/common/PasswordInput';
import superAdminService from '../../services/superAdminService';
import { getPasswordRequirementsText } from '../../utils/authValidationPolicy';

const TABS = [
  { key: 'admins', label: 'Admins', icon: FiUsers },
  { key: 'delivery', label: 'Delivery Agents', icon: FiTruck },
];

const VEHICLE_TYPES = [
  { value: 'TWO_WHEELER', label: 'Two Wheeler' },
  { value: 'THREE_WHEELER', label: 'Three Wheeler' },
  { value: 'FOUR_WHEELER', label: 'Four Wheeler' },
  { value: 'HEAVY_VEHICLE', label: 'Heavy Vehicle' },
];

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

const inputClass =
  'w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const emptyAdminForm = {
  name: '',
  email: '',
  mobile: '',
  employeeId: '',
  password: '',
  confirmPassword: '',
  status: 'ACTIVE',
};

const emptyDeliveryForm = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  confirmPassword: '',
  vehicleType: '',
  vehicleNumber: '',
  serviceArea: '',
  status: 'ACTIVE',
};

function StaffOnboarding() {
  const [activeTab, setActiveTab] = useState('admins');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [deliveryForm, setDeliveryForm] = useState(emptyDeliveryForm);
  const [formError, setFormError] = useState('');

  const isAdmins = activeTab === 'admins';

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter,
      };
      const response = isAdmins
        ? await superAdminService.getAdmins(params)
        : await superAdminService.getDeliveryAgents(params);
      const payload = response?.data ?? response;
      const users = payload?.users || [];
      setRows(users.map((user) => ({
        id: user._id || user.id,
        name: user.name || '—',
        email: user.email || '—',
        phone: user.mobile || user.phone || '—',
        status: String(user.status || 'INACTIVE').toLowerCase(),
        rawStatus: user.status || 'INACTIVE',
        employeeId: user.employeeId || '—',
        vehicleType: user.vehicleType || '—',
        vehicleNumber: user.vehicleNumber || '—',
        serviceArea: user.serviceArea || '—',
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      })));
      setTotalPages(payload?.pages || 1);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load staff records');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAdmins, page, searchTerm, statusFilter]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm, statusFilter]);

  const openCreateModal = () => {
    setFormError('');
    setSelectedRow(null);
    setAdminForm(emptyAdminForm);
    setDeliveryForm(emptyDeliveryForm);
    setModalMode('create');
  };

  const openEditModal = (row) => {
    setFormError('');
    setSelectedRow(row);
    if (isAdmins) {
      setAdminForm({
        name: row.name === '—' ? '' : row.name,
        email: row.email === '—' ? '' : row.email,
        mobile: row.phone === '—' ? '' : row.phone,
        employeeId: row.employeeId === '—' ? '' : row.employeeId,
        password: '',
        confirmPassword: '',
        status: row.rawStatus || 'ACTIVE',
      });
    } else {
      setDeliveryForm({
        name: row.name === '—' ? '' : row.name,
        email: row.email === '—' ? '' : row.email,
        mobile: row.phone === '—' ? '' : row.phone,
        password: '',
        confirmPassword: '',
        vehicleType: row.vehicleType === '—' ? '' : row.vehicleType,
        vehicleNumber: row.vehicleNumber === '—' ? '' : row.vehicleNumber,
        serviceArea: row.serviceArea === '—' ? '' : row.serviceArea,
        status: row.rawStatus || 'ACTIVE',
      });
    }
    setModalMode('edit');
  };

  const openViewModal = (row) => {
    setSelectedRow(row);
    setModalMode('view');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedRow(null);
    setFormError('');
  };

  const validateAdminForm = () => {
    if (!adminForm.name.trim()) return 'Name is required';
    if (!adminForm.email.trim()) return 'Email is required';
    if (!/^\d{10}$/.test(String(adminForm.mobile).replace(/\D/g, ''))) return 'Phone must be 10 digits';
    if (modalMode === 'create' && !adminForm.password) return 'Password is required';
    if (adminForm.password && adminForm.password !== adminForm.confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const validateDeliveryForm = () => {
    if (!deliveryForm.name.trim()) return 'Name is required';
    if (!deliveryForm.email.trim()) return 'Email is required';
    if (!/^\d{10}$/.test(String(deliveryForm.mobile).replace(/\D/g, ''))) return 'Phone must be 10 digits';
    if (!deliveryForm.vehicleType) return 'Vehicle type is required';
    if (!deliveryForm.vehicleNumber.trim()) return 'Vehicle number is required';
    if (!deliveryForm.serviceArea.trim()) return 'Service area is required';
    if (modalMode === 'create' && !deliveryForm.password) return 'Password is required';
    if (deliveryForm.password && deliveryForm.password !== deliveryForm.confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validationMessage = isAdmins ? validateAdminForm() : validateDeliveryForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setActionLoading(true);
    try {
      if (isAdmins) {
        const payload = {
          name: adminForm.name.trim(),
          email: adminForm.email.trim(),
          mobile: String(adminForm.mobile).replace(/\D/g, ''),
          employeeId: adminForm.employeeId.trim() || undefined,
          status: adminForm.status,
        };
        if (adminForm.password) payload.password = adminForm.password;

        if (modalMode === 'create') {
          await superAdminService.createAdmin(payload);
        } else {
          await superAdminService.updateAdmin(selectedRow.id, payload);
        }
      } else {
        const payload = {
          name: deliveryForm.name.trim(),
          email: deliveryForm.email.trim(),
          mobile: String(deliveryForm.mobile).replace(/\D/g, ''),
          vehicleType: deliveryForm.vehicleType,
          vehicleNumber: deliveryForm.vehicleNumber.trim(),
          serviceArea: deliveryForm.serviceArea.trim(),
          status: deliveryForm.status,
        };
        if (deliveryForm.password) payload.password = deliveryForm.password;

        if (modalMode === 'create') {
          await superAdminService.createDeliveryAgent(payload);
        } else {
          await superAdminService.updateDeliveryAgent(selectedRow.id, payload);
        }
      }

      closeModal();
      await loadRows();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async (row) => {
    setActionLoading(true);
    setError('');
    try {
      const nextStatus = row.rawStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      if (isAdmins) {
        await superAdminService.updateAdmin(row.id, { status: nextStatus });
      } else {
        await superAdminService.updateDeliveryAgent(row.id, { status: nextStatus });
      }
      await loadRows();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const adminColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'employeeId', label: 'Employee ID' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => formatDate(value),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => openViewModal(row)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">View</button>
          <button type="button" onClick={() => openEditModal(row)} className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50">Edit</button>
          <button type="button" disabled={actionLoading} onClick={() => toggleStatus(row)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            {row.rawStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  const deliveryColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'vehicleType', label: 'Vehicle Type' },
    { key: 'vehicleNumber', label: 'Vehicle Number' },
    { key: 'serviceArea', label: 'Service Area' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => openViewModal(row)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">View</button>
          <button type="button" onClick={() => openEditModal(row)} className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50">Edit</button>
          <button type="button" disabled={actionLoading} onClick={() => toggleStatus(row)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            {row.rawStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  const columns = useMemo(() => (isAdmins ? adminColumns : deliveryColumns), [isAdmins, actionLoading]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff Onboarding"
        subtitle="Create and manage admin and delivery agent accounts."
        actions={(
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <FiPlus size={16} />
            {isAdmins ? 'Create Admin' : 'Create Delivery Agent'}
          </button>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <SearchBar placeholder={`Search ${isAdmins ? 'admins' : 'delivery agents'}...`} value={searchTerm} onSearch={setSearchTerm} />
        <FilterDropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No records found.</p>
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}

      <Modal
        isOpen={Boolean(modalMode)}
        onClose={closeModal}
        title={
          modalMode === 'view'
            ? (isAdmins ? 'Admin Details' : 'Delivery Agent Details')
            : modalMode === 'create'
              ? (isAdmins ? 'Create Admin' : 'Create Delivery Agent')
              : (isAdmins ? 'Edit Admin' : 'Edit Delivery Agent')
        }
      >
        {modalMode === 'view' && selectedRow && (
          <div className="space-y-3 text-sm">
            <p><span className="font-medium">Name:</span> {selectedRow.name}</p>
            <p><span className="font-medium">Email:</span> {selectedRow.email}</p>
            <p><span className="font-medium">Phone:</span> {selectedRow.phone}</p>
            {isAdmins ? (
              <p><span className="font-medium">Employee ID:</span> {selectedRow.employeeId}</p>
            ) : (
              <>
                <p><span className="font-medium">Vehicle Type:</span> {selectedRow.vehicleType}</p>
                <p><span className="font-medium">Vehicle Number:</span> {selectedRow.vehicleNumber}</p>
                <p><span className="font-medium">Service Area:</span> {selectedRow.serviceArea}</p>
              </>
            )}
            <p><span className="font-medium">Status:</span> {selectedRow.rawStatus}</p>
            <p><span className="font-medium">Created:</span> {formatDate(selectedRow.createdAt)}</p>
          </div>
        )}

        {modalMode !== 'view' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            {isAdmins ? (
              <>
                <input className={inputClass} placeholder="Name" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} required />
                <input className={inputClass} type="email" placeholder="Email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} required />
                <input className={inputClass} placeholder="Phone (10 digits)" value={adminForm.mobile} onChange={(e) => setAdminForm({ ...adminForm, mobile: e.target.value })} required />
                <input className={inputClass} placeholder="Employee ID (optional)" value={adminForm.employeeId} onChange={(e) => setAdminForm({ ...adminForm, employeeId: e.target.value })} />
                <select className={inputClass} value={adminForm.status} onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                <PasswordInput className={inputClass} placeholder={modalMode === 'create' ? 'Password' : 'New password (optional)'} value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} required={modalMode === 'create'} />
                <PasswordInput className={inputClass} placeholder="Confirm password" value={adminForm.confirmPassword} onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })} required={Boolean(adminForm.password)} />
              </>
            ) : (
              <>
                <input className={inputClass} placeholder="Name" value={deliveryForm.name} onChange={(e) => setDeliveryForm({ ...deliveryForm, name: e.target.value })} required />
                <input className={inputClass} type="email" placeholder="Email" value={deliveryForm.email} onChange={(e) => setDeliveryForm({ ...deliveryForm, email: e.target.value })} required />
                <input className={inputClass} placeholder="Phone (10 digits)" value={deliveryForm.mobile} onChange={(e) => setDeliveryForm({ ...deliveryForm, mobile: e.target.value })} required />
                <select className={inputClass} value={deliveryForm.vehicleType} onChange={(e) => setDeliveryForm({ ...deliveryForm, vehicleType: e.target.value })} required>
                  <option value="">Select vehicle type</option>
                  {VEHICLE_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input className={inputClass} placeholder="Vehicle number" value={deliveryForm.vehicleNumber} onChange={(e) => setDeliveryForm({ ...deliveryForm, vehicleNumber: e.target.value })} required />
                <input className={inputClass} placeholder="Service area" value={deliveryForm.serviceArea} onChange={(e) => setDeliveryForm({ ...deliveryForm, serviceArea: e.target.value })} required />
                <select className={inputClass} value={deliveryForm.status} onChange={(e) => setDeliveryForm({ ...deliveryForm, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                <PasswordInput className={inputClass} placeholder={modalMode === 'create' ? 'Password' : 'New password (optional)'} value={deliveryForm.password} onChange={(e) => setDeliveryForm({ ...deliveryForm, password: e.target.value })} required={modalMode === 'create'} />
                <PasswordInput className={inputClass} placeholder="Confirm password" value={deliveryForm.confirmPassword} onChange={(e) => setDeliveryForm({ ...deliveryForm, confirmPassword: e.target.value })} required={Boolean(deliveryForm.password)} />
              </>
            )}

            <p className="text-xs text-gray-500">{getPasswordRequirementsText()}</p>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="px-4 py-2.5 text-sm border rounded-lg">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
                {actionLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default StaffOnboarding;
