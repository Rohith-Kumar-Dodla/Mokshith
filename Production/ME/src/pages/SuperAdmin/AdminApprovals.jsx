import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import adminApprovalService from '../../services/adminApprovalService';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatRole = (role) => {
  const labels = {
    ADMIN: 'Admin',
    B2B_CUSTOMER: 'Vendor',
    DELIVERY_PARTNER: 'Delivery Partner',
    VENDOR: 'Vendor',
  };
  return labels[role] || role || '—';
};

const AdminApprovals = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const loadPendingUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminApprovalService.getPending();
      const payload = response.data ?? response;
      setUsers(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load pending registrations');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  const handleApprove = async (user) => {
    if (!window.confirm(`Approve ${user.name}? They will be able to log in immediately.`)) {
      return;
    }

    setActionId(user.id);
    try {
      await adminApprovalService.approve(user.id);
      await loadPendingUsers();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to approve user');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (user) => {
    if (!window.confirm(`Reject ${user.name}? They will not be able to log in.`)) {
      return;
    }

    setActionId(user.id);
    try {
      await adminApprovalService.reject(user.id);
      await loadPendingUsers();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reject user');
    } finally {
      setActionId(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'role',
      label: 'Role',
      render: (value) => formatRole(value),
    },
    {
      key: 'createdAt',
      label: 'Registered Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={String(value || 'PENDING').toLowerCase()} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleApprove(row)}
            disabled={actionId === row.id}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <FiCheck size={14} />
            Approve
          </button>
          <button
            type="button"
            onClick={() => handleReject(row)}
            disabled={actionId === row.id}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <FiX size={14} />
            Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="User Approvals"
        subtitle="Review and approve new Admin, Vendor, and Delivery Partner registrations."
        actions={
          <button
            type="button"
            onClick={loadPendingUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading pending registrations...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">No pending registration requests.</p>
        ) : (
          <DataTable columns={columns} data={users} />
        )}
      </div>
    </div>
  );
};

export default AdminApprovals;
