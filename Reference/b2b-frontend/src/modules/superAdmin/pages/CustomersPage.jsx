import { useState } from "react";
import { useSuperAdmin } from "../hooks/useSuperAdmin";
import { Users, Search, Filter, Download, Eye, Edit, Ban } from 'lucide-react';
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import Table, { TableRow, TableCell } from "../../../components/ui/Table";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const { getB2BCustomers } = useSuperAdmin();

  const handleLoadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getB2BCustomers();
      setCustomers(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">B2B Customer Management</h1>
        <p className="text-gray-500">View and manage all onboarded B2B customers.</p>
      </div>

      {/* Customers List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">All Customers</h2>
            <Button
              onClick={handleLoadCustomers}
              disabled={loading}
              variant="secondary"
              className="border border-gray-200"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
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
        {customers.length > 0 ? (
          <Table
            headers={['Customer ID', 'Business Name', 'Owner Name', 'GST Number', 'Mobile', 'Email', 'Credit Limit', 'Status', 'Created Date', 'Actions']}
            containerClassName="rounded-none border-0"
          >
            {customers.map((customer) => (
              <TableRow key={customer.id || customer._id}>
                <TableCell className="font-mono text-xs">{customer.id || customer._id?.slice(-8)}</TableCell>
                <TableCell className="font-semibold">{customer.businessName || customer.name}</TableCell>
                <TableCell>{customer.ownerName || 'N/A'}</TableCell>
                <TableCell className="font-mono text-xs">{customer.gstNumber || 'N/A'}</TableCell>
                <TableCell>{customer.mobile}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell className="font-semibold text-green-600">₹{customer.creditLimit?.toLocaleString()}</TableCell>
                <TableCell>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600">Active</span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="View">
                      <Eye size={18} className="text-gray-500" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Edit">
                      <Edit size={18} className="text-gray-500" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Disable">
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
              icon={Users}
              title="No B2B customers found"
              description="Customers will appear here after onboarding through the Partners page."
              actionText="Go to Partners Page"
              onAction={() => window.location.href = '/super-admin/partners'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
