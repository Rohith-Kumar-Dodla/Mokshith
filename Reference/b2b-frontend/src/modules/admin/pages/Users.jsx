import { useState, useEffect } from "react";
import { Search, CreditCard, Filter, MoreVertical } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import { adminService } from "../services/adminService";
import './AdminShared.css';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditLimit, setCreditLimit] = useState(50000);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      const allUsers = response.data || response || [];
      const filteredUsers = allUsers.filter(u => u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN');
      setUsers(filteredUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateCredit = async () => {
    try {
      await adminService.updateCredit(selectedUser._id, Number(creditLimit));
      setShowCreditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const openCreditModal = (user) => {
    setSelectedUser(user);
    setCreditLimit(user.creditLimit || 50000);
    setShowCreditModal(true);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner"></div>
      <p>Fetching user directory...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Oversee platform members and credit allocations</p>
        </div>
      </div>

      <div className="table-controls">
        <div className="table-search">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <Filter size={18} />
          <span>Filters</span>
        </Button>
      </div>

      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Information</th>
                <th>Platform Role</th>
                <th>Account Status</th>
                <th>Credit Limit</th>
                <th>Available</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.875rem' }}>{user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        color: 'var(--primary-color)',
                        backgroundColor: 'rgba(14, 165, 233, 0.1)',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      ₹{user.creditLimit?.toLocaleString() || '50,000'}
                    </td>
                    <td style={{ fontWeight: '800', color: 'var(--primary-color)' }}>
                      ₹{user.availableCredit?.toLocaleString() || '50,000'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={() => openCreditModal(user)}
                        className="flex items-center gap-2"
                      >
                        <CreditCard size={14} />
                        <span>Credit</span>
                      </Button>
                    </td>
                  </tr>
                ) )
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div className="flex flex-col items-center gap-3">
                      <Search size={40} opacity={0.2} />
                      <p className="font-bold">No users match your criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreditModal && (
        <Modal title="Adjust Credit Limit" onClose={() => setShowCreditModal(false)}>
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="avatar">{selectedUser?.name?.charAt(0)}</div>
              <div>
                <p className="font-bold text-slate-900">{selectedUser?.name}</p>
                <p className="text-xs text-slate-500">{selectedUser?.email}</p>
              </div>
            </div>
            
            <Input 
              label="New Credit Limit (₹)" 
              type="number" 
              value={creditLimit} 
              onChange={(e) => setCreditLimit(e.target.value)} 
              className="h-12"
            />
            
            <div className="flex gap-4 pt-2">
              <Button variant="secondary" onClick={() => setShowCreditModal(false)} className="flex-1 h-12">Cancel</Button>
              <Button onClick={handleUpdateCredit} className="flex-1 h-12">Update Allocation</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsersPage;
