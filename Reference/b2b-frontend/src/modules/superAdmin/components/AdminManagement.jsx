import { useState } from "react";
import { UserCog, Search, Filter, Download, Eye, Edit, Ban, Plus } from 'lucide-react';
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import PasswordField from "../../../components/ui/PasswordField";
import EmptyState from "../../../components/ui/EmptyState";
import Table, { TableRow, TableCell } from "../../../components/ui/Table";

const AdminManagement = ({ admins, onCreateAdmin, onDeleteAdmin, onUpdateAdmin }) => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedAdminId(null);
    setForm({ name: '', email: '', password: '', mobile: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (admin) => {
    setIsEditing(true);
    setSelectedAdminId(admin.id || admin._id);
    setForm({ 
      name: admin.name, 
      email: admin.email, 
      password: '', 
      mobile: admin.mobile || '' 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        
        const success = await onUpdateAdmin(selectedAdminId, payload);
        if (success) {
          setShowModal(false);
          alert("Admin updated successfully!");
        }
      } else {
        const success = await onCreateAdmin(form);
        if (success) {
          setShowModal(false);
          setForm({ name: '', email: '', password: '', mobile: '' });
          alert("Admin created successfully!");
        } else {
          alert("Failed to create admin. Please check the details.");
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (adminId) => {
    if(window.confirm('Are you sure you want to disable this admin?')) {
      try {
        const success = await onDeleteAdmin(adminId);
        if (success) {
          alert("Admin disabled successfully!");
        } else {
          alert("Failed to disable admin.");
        }
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Administrator Management</h1>
            <p className="text-gray-500">Manage platform administrators and permissions.</p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2" />
            Create Admin
          </Button>
        </div>
      </div>

      {/* Admins List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          {/* Search and Filter Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search administrators..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            <button className="px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter</span>
            </button>
            <button className="px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Download size={20} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Export</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {Array.isArray(admins) && admins.length > 0 ? (
          <Table
            headers={['Name', 'Email', 'Mobile', 'Role', 'Status', 'Created Date', 'Actions']}
            containerClassName="rounded-none border-0"
          >
            {admins.map((admin) => (
              <TableRow key={admin.id || admin._id}>
                <TableCell className="font-semibold">{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.mobile || 'N/A'}</TableCell>
                <TableCell>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600">
                    {admin.role || 'Admin'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    admin.status === 'ACTIVE' 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-gray-50 text-gray-600'
                  }`}>
                    {admin.status || 'Active'}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="View">
                      <Eye size={18} className="text-gray-500" />
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(admin)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors" 
                      title="Edit"
                    >
                      <Edit size={18} className="text-gray-500" />
                    </button>
                    <button 
                      onClick={() => handleDelete(admin.id || admin._id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors" 
                      title="Disable"
                    >
                      <Ban size={18} className="text-red-500" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        ) : (
          <div className="p-12">
            <EmptyState
              icon={UserCog}
              title="No administrators found"
              description="Create your first administrator to manage the platform."
              actionText="Create First Administrator"
              onAction={handleOpenCreate}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Admin Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? "Edit Administrator" : "Create Administrator"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Enter full name"
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Enter email address"
          />
          <Input
            label="Mobile Number"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            required
            placeholder="Enter mobile number"
          />
          <PasswordField
            label={isEditing ? "New Password (leave blank to keep current)" : "Password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            required={!isEditing}
            placeholder={isEditing ? "Enter new password" : "Enter secure password"}
          />
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={() => setShowModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              {isEditing ? "Update Admin" : "Create Admin"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminManagement;
