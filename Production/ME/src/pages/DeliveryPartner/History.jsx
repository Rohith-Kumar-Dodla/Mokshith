import React, { useState } from 'react';
import SearchBar from '../../components/delivery/SearchBar';
import StatusBadge from '../../components/delivery/StatusBadge';
import useDelivery from '../../hooks/useDelivery';

const History = () => {
  const { history, loading, error } = useDelivery();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredHistory = history.filter((item) => {
    return (
      searchTerm === '' ||
      String(item.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.vendor).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const stats = {
    total: history.length,
    successful: history.filter((h) => h.status === 'delivered').length,
    failed: history.filter((h) => h.status === 'failed').length,
    totalEarnings: history.reduce((sum, h) => sum + Number(h.earnings || 0), 0),
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Completed Deliveries</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Loading delivery history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Completed Deliveries</h1>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Completed Deliveries</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">View your delivery history and performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Deliveries</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Successful</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.successful}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Failed</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{stats.failed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Earnings</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">₹{stats.totalEarnings.toLocaleString()}</p>
        </div>
      </div>

      <SearchBar
        placeholder="Search by order ID or vendor..."
        onSearch={handleSearch}
        className="w-full"
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700">Vendor</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700">Location</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700">Earnings</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">{item.id}</td>
                  <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-700">{item.vendor}</td>
                  <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-700">{item.deliveryLocation}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-900">₹{item.earnings}</td>
                  <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-700">
                    {item.completedAt ? new Date(item.completedAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredHistory.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500">No delivery history found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
