import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory.js';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import { 
  Package, 
  Warehouse, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Edit3,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  Search,
  LayoutGrid,
  Filter,
  History,
  Box,
  Truck
} from 'lucide-react';
import "../../admin/pages/AdminShared.css";

const InventoryPage = () => {
  const { inventory: rawInventory, lowStockItems: rawLowStockItems, stats, loading, error, updateStock } = useInventory();
  const inventory = Array.isArray(rawInventory) ? rawInventory : [];
  const lowStockItems = Array.isArray(rawLowStockItems) ? rawLowStockItems : [];
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stockToUpdate, setStockToUpdate] = useState({ quantity: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEditStock = (item) => {
    setSelectedItem(item);
    setStockToUpdate({ quantity: item.available });
    setIsModalOpen(true);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await updateStock(selectedItem._id, stockToUpdate);
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error("Failed to update stock:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !inventory.length) {
    return (
      <div className="admin-page-content animate-pulse">
        <div className="admin-page-header">
          <div className="page-title-section">
            <div className="h-10 w-64 bg-gray-100 rounded-xl mb-2"></div>
            <div className="h-4 w-96 bg-gray-50 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[1, 2, 3].map((i) => <div key={i} className="h-44 bg-gray-50 rounded-[2rem] border border-gray-100"></div>)}
        </div>
        <div className="h-[600px] bg-gray-50 rounded-[2.5rem] border border-gray-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-content flex flex-col items-center justify-center py-32">
        <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 text-center max-w-md">
          <AlertCircle size={64} className="mx-auto mb-6 text-red-400" />
          <h3 className="text-2xl font-black text-main mb-2">Inventory Sync Error</h3>
          <p className="text-red-600 font-medium mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            RETRY SYNC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-content animate-in fade-in duration-700">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">Inventory Control</h1>
          <p className="page-subtitle">Real-time stock monitoring and warehouse distribution management</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => window.location.reload()}
            className="bg-white border border-border p-3.5 rounded-2xl text-muted hover:text-primary hover:border-primary transition-all shadow-sm"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="admin-card p-8 flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Package size={32} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2">Total Managed SKUs</p>
          <p className="text-5xl font-black text-main tracking-tighter">{stats?.productCount || stats?.totalProducts || inventory.length}</p>
        </div>
        
        <div className="admin-card p-8 flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-amber-100">
            <AlertTriangle size={32} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-2">Low Stock Alerts</p>
          <p className="text-5xl font-black text-main tracking-tighter">{stats?.lowStockCount || lowStockItems.length}</p>
        </div>

        <div className="admin-card p-8 flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-emerald-100">
            <ShieldCheck size={32} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Operational Health</p>
          <p className="text-5xl font-black text-main tracking-tighter">{stats?.inStockCount || inventory.filter(i => (i.stock - (i.reserved || 0)) >= 10).length}</p>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-10 p-6 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-[2rem] animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-sm font-black text-main uppercase tracking-widest">Critical Replenishment Required</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {lowStockItems.filter(item => item.productId).slice(0, 10).map((item) => (
              <div key={item._id} className="bg-white px-4 py-2 rounded-xl border border-amber-200 flex items-center gap-3 shadow-sm">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
                <span className="text-xs font-bold text-main">{item.productId?.name}</span>
                <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">
                  {item.stock} LEFT
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <div className="p-6 border-b border-border bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="table-search max-w-md w-full">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by product name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="status-badge active">
              <Box size={14} />
              <span>{filteredInventory.length} Total Items</span>
            </div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Total Stock</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Status</th>
                <th>Warehouse</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-32 text-center">
                    <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <Package size={40} className="text-primary/20" />
                    </div>
                    <h3 className="text-xl font-black text-main mb-2">No items found</h3>
                    <p className="text-muted font-medium uppercase tracking-widest text-[10px]">Try adjusting your search filters</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.filter(item => item.productId).map((item) => {
                  const available = item.stock - (item.reserved || 0);
                  const status = available <= 0 ? 'out-of-stock' : available < 10 ? 'low' : 'in-stock';
                  
                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-border text-lg">
                            📦
                          </div>
                          <div>
                            <p className="font-black text-main line-clamp-1">{item.productId?.name}</p>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">SKU: {item.productId?.sku || item.productId?._id?.substring(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-black text-main">{item.stock}</span>
                      </td>
                      <td>
                        <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">{item.reserved || 0}</span>
                      </td>
                      <td>
                        <span className={`font-black ${available <= 0 ? 'text-red-600' : 'text-primary'}`}>{available}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${status === 'in-stock' ? 'active' : status === 'low' ? 'pending' : 'inactive'}`}>
                          {status.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted">
                          <Warehouse size={14} />
                          {item.warehouse || 'Main Distribution'}
                        </div>
                      </td>
                      <td className="text-right">
                        <button 
                          onClick={() => handleEditStock(item)}
                          className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Update Stock Levels"
      >
        <div className="p-8">
          {selectedItem && (
            <form onSubmit={handleUpdateStock} className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-8">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Current Item</p>
                <p className="font-black text-main text-lg">{selectedItem.productId?.name}</p>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-main uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" />
                  Available Quantity
                </label>
                <input 
                  type="number" 
                  value={stockToUpdate.quantity}
                  onChange={(e) => setStockToUpdate({ quantity: parseInt(e.target.value) })}
                  className="w-full h-14 bg-gray-50 border border-border rounded-2xl px-6 font-black text-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <p className="text-xs text-muted font-medium leading-relaxed">
                  Enter the total physical stock available for this product. This will automatically update available quantities after subtracting reservations.
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-14 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" /> : 'UPDATE STOCK'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;