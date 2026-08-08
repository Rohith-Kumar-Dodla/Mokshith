import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { useSearchParams } from 'react-router-dom';
import {
  FiUsers,
  FiUserCheck,
  FiShoppingBag,
  FiTruck,
  FiSearch,
  FiPlus,
} from 'react-icons/fi';
import AdminApprovals from './AdminApprovals';
import Vendors from './Vendors';
import DeliveryPartners from './DeliveryPartners';
import { mapVendorUser } from '../../utils/vendorMapper';
import adminApprovalService from '../../services/adminApprovalService';
import PageHeader from '../../components/superadmin/PageHeader';
import '../../pages/SuperAdmin/userManagement.css';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import Modal from '../../components/superadmin/Modal';
import adminService from '../../services/adminService';

const SECTION_KEYS = [
  { key: 'approvals', label: 'User Approvals', icon: FiUserCheck },
  { key: 'admins', label: 'Admin Management', icon: FiUsers },
  { key: 'vendors', label: 'Vendor Management', icon: FiShoppingBag },
  { key: 'delivery', label: 'Delivery Partners', icon: FiTruck },
];

const VALID_TABS = new Set(SECTION_KEYS.map((s) => s.key));

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await adminService.getUsers({ role: 'ADMIN' });
      const payload = resp?.data ?? resp;
      const users = Array.isArray(payload) ? payload : payload?.users || [];
      setAdmins(users.map((u) => ({
        id: u._id || u.id,
        name: u.name || '—',
        email: u.email || '—',
        phone: u.mobile || u.phone || '—',
        status: String(u.status || 'INACTIVE').toLowerCase(),
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
      })));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to load admins');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const runAction = async (id, action) => {
    setActionLoading(true);
    setError('');
    try {
      if (action === 'activate') await adminService.updateUserStatus(id, 'ACTIVE');
      if (action === 'deactivate') await adminService.updateUserStatus(id, 'INACTIVE');
      await loadAdmins();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Pending', value: 'pending' },
  ];

  const filtered = useMemo(() => admins.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase())
      || a.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [admins, searchTerm, statusFilter]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (v) => formatDate(v),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (v) => formatDate(v),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status !== 'active' ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => runAction(row.id, 'activate')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 min-h-[44px]"
            >
              Activate
            </button>
          ) : (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => runAction(row.id, 'deactivate')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 min-h-[44px]"
            >
              Deactivate
            </button>
          )}
          <button
            type="button"
            disabled
            title="Reset password (backend not exposed)"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg opacity-60 cursor-not-allowed min-h-[44px]"
          >
            Reset Password
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin Management"
        subtitle="Create, view and manage admin accounts."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <SearchBar placeholder="Search admins..." value={searchTerm} onSearch={setSearchTerm} />
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
          <p className="text-sm text-gray-500">Loading admins...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">No admins found.</p>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>
    </div>
  );
};


/* Mobile card renderers for approvals, vendors and delivery partners
   Implemented here to avoid changing existing shared components.
*/
const formatCode = (prefix, index) => {
  const num = String(index + 1).padStart(4, '0');
  return `${prefix}-${num}`;
};

const ApprovalsCardList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await adminApprovalService.getPending();
        const payload = resp?.data ?? resp;
        const list = Array.isArray(payload) ? payload : payload?.users || [];
        if (!mounted) return;
        setItems(list);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load approvals');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading pending registrations...</p>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (items.length === 0) return <p className="text-sm text-gray-500">No pending registration requests.</p>;

  return (
    <div className="space-y-3">
      {items.map((u, idx) => (
        <div key={u._id || u.id || idx} className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{u.name || '—'}</p>
              <p className="text-xs text-gray-500 truncate">{u.email || '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Phone: {u.mobile || u.phone || '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Role: {u.role || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Requested</p>
              <p className="text-sm font-medium text-gray-900">{new Date(u.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-gray-500 mt-2">{formatCode('USR', idx)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const VendorsCardList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await adminService.getUsers({ role: 'VENDOR' });
        const payload = resp?.data ?? resp;
        const users = Array.isArray(payload) ? payload : payload?.users || [];
        if (!mounted) return;
        // normalize vendor shape using shared mapper used by desktop view
        setItems(users.map(mapVendorUser));
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load vendors');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading vendors...</p>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (items.length === 0) return <p className="text-sm text-gray-500">No vendors found.</p>;

  return (
    <div className="space-y-3">
      {items.map((v, idx) => (
        <div key={v.id || idx} className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{v.shopName}</p>
              <p className="text-xs text-gray-500">{v.ownerName} · {v.email}</p>
              <p className="text-xs text-gray-500 mt-1">Phone: {v.phone}</p>
              <p className="text-xs text-gray-500 mt-1">Orders: {v.orders ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Status: <StatusBadge status={v.status} /></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Registered</p>
              <p className="text-sm font-medium text-gray-900">{v.registeredDate}</p>
              <p className="text-xs text-gray-500 mt-2">{formatCode('VEN', idx)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DeliveryCardList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await adminService.getUsers({ role: 'DELIVERY_PARTNER' });
        const payload = resp?.data ?? resp;
        const users = Array.isArray(payload) ? payload : payload?.users || [];
        if (!mounted) return;
        // Normalize delivery partner objects for consistent mobile rendering
        const normalized = users.map((u) => ({
          id: u._id || u.id,
          name: u.name || u.fullName || '—',
          phone: u.mobile || u.phone || '—',
          assignedArea: u.assignedArea || u.addresses?.[0]?.area || '—',
          completedDeliveries: u.completedDeliveries ?? u.completed ?? '—',
          rating: u.rating ?? '—',
          status: (u.status || 'INACTIVE').toLowerCase(),
        }));
        setItems(normalized);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load delivery partners');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading delivery partners...</p>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (items.length === 0) return <p className="text-sm text-gray-500">No delivery partners found.</p>;

  return (
    <div className="space-y-3">
      {items.map((d, idx) => (
        <div key={d.id || idx} className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{d.name}</p>
              <p className="text-xs text-gray-500">Phone: {d.phone}</p>
              <p className="text-xs text-gray-500 mt-1">Assigned: {d.assignedArea}</p>
              <p className="text-xs text-gray-500 mt-1">Completed: {d.completedDeliveries}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Performance</p>
              <p className="text-sm font-medium text-gray-900">{d.rating}</p>
              <p className="text-xs text-gray-500 mt-2">{formatCode('DEL', idx)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
const UserManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialSection = VALID_TABS.has(tabParam) ? tabParam : 'approvals';
  const [section, setSection] = useState(initialSection);
  const [mobileOpen, setMobileOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const next = searchParams.get('tab');
    if (VALID_TABS.has(next) && next !== section) {
      setSection(next);
    }
  }, [searchParams, section]);

  const selectSection = (key) => {
    setSection(key);
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-[70vh] user-management">
      <div className="space-y-4">
        <header>
          <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all platform users from a single place.</p>
        </header>

        {/* Top navigation tabs */}
        <div className="mt-3">
          {/* Desktop & Tablet: grid layout */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SECTION_KEYS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => selectSection(s.key)}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                  section === s.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-700 hover:bg-gray-50'
                }`}
                aria-current={section === s.key ? 'page' : undefined}
              >
                <s.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile: 2x2 grid (avoids horizontal overflow and improves touch targets) */}
          <div className="sm:hidden px-4">
            <div className="grid grid-cols-2 gap-3">
              {SECTION_KEYS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => selectSection(s.key)}
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                    section === s.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-700'
                  }`}
                  aria-current={section === s.key ? 'page' : undefined}
                >
                  <s.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected section content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-6 transition-all">
          <div className="table-wrapper -mx-4 sm:-mx-0 px-4 sm:px-0" ref={contentRef}>
            <div key={section} className="transition-opacity duration-300 ease-in-out">
              {section === 'approvals' && <AdminApprovals />}
              {section === 'admins' && <AdminManagement />}
              {section === 'vendors' && <Vendors />}
              {section === 'delivery' && <DeliveryPartners />}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={mobileOpen} onClose={() => setMobileOpen(false)} title="Quick Actions">
        <div className="space-y-3">
          <button type="button" className="w-full inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg min-h-[44px]">
            <FiPlus />
            Create Admin
          </button>
          <button type="button" className="w-full inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg min-h-[44px]">
            <FiSearch />
            Search Users
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;

