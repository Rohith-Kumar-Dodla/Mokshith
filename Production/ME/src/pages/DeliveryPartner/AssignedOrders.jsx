import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DeliveryCard from '../../components/delivery/DeliveryCard';
import SearchBar from '../../components/delivery/SearchBar';
import FilterPanel from '../../components/delivery/FilterPanel';
import { assignedOrders } from '../../data/deliveryAssignedOrders';

const AssignedOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    date: ''
  });

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      date: ''
    });
    setSearchTerm('');
  };

  const filteredOrders = assignedOrders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filters.status === 'all' || order.status === filters.status;
    const matchesPriority = filters.priority === 'all' || order.priority === filters.priority;
    const matchesDate = filters.date === '' || order.assignedTime.startsWith(filters.date);

    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  const stats = {
    total: assignedOrders.length,
    assigned: assignedOrders.filter(o => o.status === 'assigned').length,
    accepted: assignedOrders.filter(o => o.status === 'accepted').length,
    pickedUp: assignedOrders.filter(o => o.status === 'picked_up').length,
    outForDelivery: assignedOrders.filter(o => o.status === 'out_for_delivery').length
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Assigned Deliveries</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">View and manage your assigned orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-2 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Total</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-2 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Assigned</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.assigned}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-2 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Accepted</p>
          <p className="text-lg sm:text-2xl font-bold text-indigo-600">{stats.accepted}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-2 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Picked Up</p>
          <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.pickedUp}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-2 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Out for Delivery</p>
          <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.outForDelivery}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <SearchBar
            placeholder="Search by order ID, vendor, or location..."
            onSearch={handleSearch}
            className="w-full"
          />
        </div>
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-gray-500">No orders found</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filteredOrders.map((order) => (
            <DeliveryCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedOrders;
