import { useState } from "react";
import { useSuperAdmin } from "../hooks/useSuperAdmin";
import { Truck, Search, Filter, Download, Eye, Edit, Ban } from 'lucide-react';
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import Table, { TableRow, TableCell } from "../../../components/ui/Table";

const DeliveryPartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);

  const { getDeliveryPartners } = useSuperAdmin();

  const handleLoadPartners = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryPartners();
      setPartners(data);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Partner Management</h1>
        <p className="text-gray-500">Manage delivery personnel and logistics fleet.</p>
      </div>

      {/* Partners List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">All Delivery Partners</h2>
            <Button
              onClick={handleLoadPartners}
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
                placeholder="Search delivery partners..."
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
        {partners.length > 0 ? (
          <Table
            headers={['Partner ID', 'Name', 'Mobile', 'Email', 'Vehicle Type', 'Vehicle Number', 'License Number', 'Status', 'Actions']}
            containerClassName="rounded-none border-0"
          >
            {partners.map((partner) => (
              <TableRow key={partner.id || partner._id}>
                <TableCell className="font-mono text-xs">{partner.id || partner._id?.slice(-8)}</TableCell>
                <TableCell className="font-semibold">{partner.name}</TableCell>
                <TableCell>{partner.mobile}</TableCell>
                <TableCell>{partner.email}</TableCell>
                <TableCell className="capitalize">{partner.vehicleType?.replace('_', ' ') || 'N/A'}</TableCell>
                <TableCell className="font-mono text-xs">{partner.vehicleNumber || 'N/A'}</TableCell>
                <TableCell className="font-mono text-xs">{partner.licenseNumber || 'N/A'}</TableCell>
                <TableCell>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600">Active</span>
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
              icon={Truck}
              title="No delivery partners found"
              description="Register delivery partners through the Partners page."
              actionText="Go to Partners Page"
              onAction={() => window.location.href = '/super-admin/partners'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPartnersPage;
