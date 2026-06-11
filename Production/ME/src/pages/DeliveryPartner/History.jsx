import React, { useState } from 'react';
import SearchBar from '../../components/delivery/SearchBar';
import StatusBadge from '../../components/delivery/StatusBadge';
import { deliveryHistory } from '../../data/deliveryHistory';

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredHistory = deliveryHistory.filter(item => {
    return searchTerm === '' || 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: deliveryHistory.length,
    successful: deliveryHistory.filter(h => h.status === 'delivered').length,
    failed: deliveryHistory.filter(h => h.status === 'failed').length,
    totalEarnings: deliveryHistory.reduce((sum, h) => sum + h.earnings, 0)
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Completed Deliveries</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">View your delivery history and performance</p>
      </div>

      {/* Statistics */}
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

      {/* Search */}
      <div className="flex justify-between items-center">
        <SearchBar
          placeholder="Search by order ID or vendor..."
          onSearch={handleSearch}
          className="w-full max-w-md"
        />
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{item.id}</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm text-gray-700">{item.vendor}</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm text-gray-700">{item.date}</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm text-gray-700">{item.distance} km</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">₹{item.amount.toFixed(2)}</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <p className="text-xs sm:text-sm font-semibold text-green-600">₹{item.earnings.toFixed(2)}</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {item.customerRating > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-xs sm:text-sm">★</span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">{item.customerRating}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs sm:text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHistory.length === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-sm sm:text-base text-gray-500">No delivery history found</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
