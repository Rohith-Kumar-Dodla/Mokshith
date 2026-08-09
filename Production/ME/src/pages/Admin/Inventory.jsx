import React, { useEffect, useMemo, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { FiEdit, FiAlertTriangle, FiPackage, FiTrendingUp } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import TableResponsive from '../../components/common/TableResponsive';
import StatusBadge from '../../components/admin/StatusBadge';
import SearchBar from '../../components/admin/SearchBar';
import FilterDropdown from '../../components/admin/FilterDropdown';
import Modal from '../../components/admin/Modal';
import inventoryService from '../../services/inventoryService';
import { mapBackendInventory, mapInventoryStats } from '../../utils/inventoryMapper';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);

    try {
      const [inventoryResult, statsResult] = await Promise.allSettled([
        inventoryService.getInventory(),
        inventoryService.getInventoryStats(),
      ]);

      if (inventoryResult.status !== 'fulfilled') {
        throw inventoryResult.reason;
      }

      setInventory(mapBackendInventory(inventoryResult.value));

      if (statsResult.status === 'fulfilled') {
        setStats(mapInventoryStats(statsResult.value));
      } else {
        // Keep the page usable when the aggregate stats endpoint is slower than the row list.
        setStats(mapInventoryStats(null));
      }
    } catch (loadError) {
      setError(getUserFacingErrorMessage(loadError, 'Failed to load inventory'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const summaryCards = useMemo(() => {
    const lowStockCount = inventory.filter(
      (item) => item.status === 'low_stock' || item.status === 'out_of_stock'
    ).length;

    return [
      { title: 'Total Stock', value: String(stats?.totalStock ?? 0), icon: FiPackage, color: 'blue' },
      { title: 'Low Stock Products', value: String(stats?.lowStockProducts ?? lowStockCount), icon: FiAlertTriangle, color: 'orange' },
      { title: 'Out of Stock', value: String(stats?.outOfStock ?? inventory.filter((item) => item.status === 'out_of_stock').length), icon: FiAlertTriangle, color: 'red' },
      { title: 'Inventory Value', value: `₹${Number(stats?.inventoryValue ?? 0).toLocaleString('en-IN')}`, icon: FiTrendingUp, color: 'green' },
    ];
  }, [inventory, stats]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'healthy', label: 'Healthy Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ];

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.productId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const lowStockItems = inventory.filter(
    (item) => item.status === 'low_stock' || item.status === 'out_of_stock'
  );

  const handleUpdateStock = (item) => {
    setSelectedInventory(item);
    setStockQuantity(String(item.currentStock));
    setSaveError(null);
    setIsStockModalOpen(true);
  };

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    if (!selectedInventory) return;

    const nextStock = Number(stockQuantity);
    if (Number.isNaN(nextStock) || nextStock < 0) {
      setSaveError('Enter a valid stock quantity');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await inventoryService.updateStock({
        productId: selectedInventory.raw?.productId?._id || selectedInventory.productId,
        warehouseId: selectedInventory.warehouseId,
        stock: nextStock,
        type: 'SET',
      });
      setIsStockModalOpen(false);
      await loadInventory();
    } catch (submitError) {
      setSaveError(getUserFacingErrorMessage(submitError, 'Failed to update stock'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader title="Inventory Control" subtitle="Monitor and manage inventory levels within your assigned area" />
        <Card className="p-8 text-center text-sm text-gray-600">Loading inventory...</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader title="Inventory Control" subtitle="Monitor and manage inventory levels within your assigned area" />
        <Card className="p-8 text-center text-sm text-red-600">{error}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Inventory Control"
        subtitle="Monitor and manage inventory levels within your assigned area"
      />

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {summaryCards.map((card, index) => {
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
            green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-500' },
            red: { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-500' },
          };
          const colors = colorClasses[card.color];
          return (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow p-3 sm:p-6"
              data-testid={`inventory-stat-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 sm:p-3 rounded-lg ${colors.bg}`}>
                  <card.icon size={18} sm:size={24} className={colors.icon} />
                </div>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mt-3 sm:mt-4">{card.title}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </Card>
          );
        })}
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-l-4 border-orange-500 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <FiAlertTriangle size={18} sm:size={24} className="text-orange-500" />
            <h3 className="text-sm sm:text-lg font-bold text-gray-900">Low Stock Alert</h3>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 sm:p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{item.productName}</p>
                  <p className="text-xs text-gray-600">Current: {item.currentStock} | Reorder Level: {item.reorderLevel}</p>
                </div>
                <button
                  onClick={() => handleUpdateStock(item)}
                  className="px-3 sm:px-4 py-2 h-10 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs sm:text-sm"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search inventory by product name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <FilterDropdown
              label="Status"
              options={statusOptions}
              selected={selectedStatus}
              onSelect={setSelectedStatus}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <TableResponsive>
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Product</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Category</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Current Stock</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Reorder Level</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Last Updated</th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.productId}</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{item.category}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{item.currentStock}</span>
                    <span className="text-xs text-gray-500"> / {item.maxStock}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{item.reorderLevel}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{item.lastUpdated}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <button
                      type="button"
                      aria-label={`Update stock for ${item.productName}`}
                      data-testid={`inventory-update-${item.id}`}
                      onClick={() => handleUpdateStock(item)}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                    >
                      <FiEdit size={14} sm:size={16} />
                      <span className="hidden sm:inline">Update Stock</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableResponsive>
        {filteredInventory.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500">No inventory items found</p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="Update Stock"
        size="md"
      >
        {selectedInventory && (
          <form className="space-y-4 sm:space-y-6" onSubmit={handleStockSubmit}>
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm font-medium text-gray-900">{selectedInventory.productName}</p>
              <p className="text-xs text-gray-600">Current Stock: {selectedInventory.currentStock}</p>
            </div>
            {saveError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2" htmlFor="inventory-stock-quantity">
                Current Quantity
              </label>
              <input
                id="inventory-stock-quantity"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                aria-label="Current Quantity"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="px-4 sm:px-6 py-2.5 h-12 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;
