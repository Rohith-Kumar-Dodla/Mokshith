import React, { useState } from 'react';
import { useWarehouse } from '../hooks/useWarehouse.js';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog.jsx';
import { 
  Warehouse, 
  MapPin, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  Activity,
  Box,
  LayoutGrid,
  Map,
  Truck,
  X,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Settings
} from 'lucide-react';
import "../../admin/pages/AdminShared.css";

const WarehouseCard = ({ warehouse, onEdit, onDelete }) => {
  const currentLoad = warehouse.currentLoad || 0;
  const capacity = warehouse.capacity || 1;
  const loadPercentage = (currentLoad / capacity) * 100;
  const isFull = loadPercentage >= 90;
  const isModerate = loadPercentage >= 60 && loadPercentage < 90;

  return (
    <div className="admin-card group p-0 overflow-hidden flex flex-col h-full">
      <div className="p-8 flex flex-col items-center text-center flex-1">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-sm border border-primary/5">
            <Warehouse size={36} />
          </div>
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button 
              onClick={() => onEdit(warehouse)} 
              className="p-2 bg-white shadow-lg hover:bg-primary hover:text-white rounded-xl text-primary transition-all border border-border"
            >
              <Edit3 size={14} />
            </button>
          </div>
        </div>

        <h3 className="text-2xl font-black text-main mb-2 tracking-tight line-clamp-1">
          {warehouse.name}
        </h3>
        
        <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest mb-8 bg-gray-50 px-4 py-1.5 rounded-full border border-border">
          <MapPin size={12} className="text-primary" />
          {warehouse.city}, {warehouse.state}
        </div>

        <div className="w-full space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Utilization</p>
              <p className={`text-2xl font-black tracking-tighter ${isFull ? 'text-red-600' : isModerate ? 'text-amber-500' : 'text-emerald-500'}`}>
                {Math.round(loadPercentage)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Stock Load</p>
              <span className="text-xs font-black text-main">
                {currentLoad.toLocaleString()} / {capacity.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-border shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isFull ? 'bg-red-500' : 
                isModerate ? 'bg-amber-500' : 
                'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(loadPercentage, 100)}%` }}
            >
              <div className="w-full h-full bg-white/20 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-border group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 flex items-center justify-center gap-1.5">
                <Layers size={10} className="text-primary" /> Capacity
              </p>
              <p className="font-black text-main text-lg tracking-tight">{capacity.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 flex items-center justify-center gap-1.5">
                <Box size={10} /> Available
              </p>
              <p className="font-black text-primary text-lg tracking-tight">
                {Math.max(0, capacity - currentLoad).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-gray-50/50 flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => onEdit(warehouse)}
          className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-xl border-border hover:bg-white"
        >
          Manage
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onDelete(warehouse._id)}
          className="h-10 w-10 p-0 rounded-xl border-border text-red-500 hover:bg-red-50 hover:border-red-100"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
};

const WarehousePage = () => {
  const { warehouses: rawWarehouses, loading, error, createWarehouse, updateWarehouse, deleteWarehouse } = useWarehouse();
  const warehouses = Array.isArray(rawWarehouses) ? rawWarehouses : [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '', capacity: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [localError, setLocalError] = useState(null);

  const handleOpenModal = (warehouse = null) => {
    setLocalError(null);
    if (warehouse) {
      setSelectedWarehouse(warehouse);
      const locationStr = typeof warehouse.location === 'object' 
        ? `${warehouse.location.address || ''}${warehouse.location.address ? ', ' : ''}${warehouse.location.city || ''}${warehouse.location.city ? ', ' : ''}${warehouse.location.state || ''}`.trim()
        : warehouse.location || '';
      setFormData({ name: warehouse.name, location: locationStr, capacity: warehouse.capacity });
    } else {
      setSelectedWarehouse(null);
      setFormData({ name: '', location: '', capacity: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    try {
      setIsSubmitting(true);
      const locationParts = formData.location.split(',').map(s => s.trim());
      const locationObj = {
        address: locationParts[0] || '',
        city: locationParts[1] || '',
        state: locationParts[2] || '',
        country: 'India'
      };

      const submissionData = {
        ...formData,
        location: locationObj
      };

      if (selectedWarehouse) {
        await updateWarehouse(selectedWarehouse._id, submissionData);
      } else {
        await createWarehouse(submissionData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setLocalError(err.message || "Failed to save warehouse");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteWarehouse(deleteId);
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete warehouse:", err);
    }
  };

  if (loading && !warehouses.length) {
    return (
      <div className="admin-page-content animate-pulse">
        <div className="admin-page-header">
          <div className="page-title-section">
            <div className="h-10 w-64 bg-gray-100 rounded-xl mb-2"></div>
            <div className="h-4 w-96 bg-gray-50 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 bg-gray-50 rounded-[2.5rem] border border-gray-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-content flex flex-col items-center justify-center py-32">
        <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 text-center max-w-md">
          <AlertCircle size={64} className="mx-auto mb-6 text-red-400" />
          <h3 className="text-2xl font-black text-main mb-2">Warehouse Sync Error</h3>
          <p className="text-red-600 font-medium mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-2"
          >
            <Activity size={18} />
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
          <h1 className="page-title">Warehouse Network</h1>
          <p className="page-subtitle">Strategic distribution hubs and storage capacity management</p>
        </div>
        <div className="header-actions">
          <Button 
            onClick={() => handleOpenModal()} 
            className="h-14 px-8 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 uppercase"
          >
            <Plus size={18} />
            Provision Hub
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {warehouses.length > 0 ? (
          warehouses.map((warehouse) => (
            <WarehouseCard 
              key={warehouse._id} 
              warehouse={warehouse} 
              onEdit={handleOpenModal}
              onDelete={setDeleteId}
            />
          ))
        ) : (
          <div className="col-span-full py-32 text-center">
            <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Warehouse size={48} className="text-primary/20" />
            </div>
            <h3 className="text-2xl font-black text-main mb-2">No Active Hubs</h3>
            <p className="text-muted font-medium max-w-sm mx-auto mb-8 uppercase tracking-widest text-[10px]">
              Provision your first distribution center to start managing inventory
            </p>
            <Button 
              onClick={() => handleOpenModal()} 
              className="h-14 px-10 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-primary/20"
            >
              CREATE FIRST WAREHOUSE
            </Button>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={selectedWarehouse ? "Optimize Warehouse" : "Provision New Hub"}
      >
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {localError && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3 text-red-600 text-sm font-bold">
                <AlertCircle size={18} />
                {localError}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[10px] font-black text-main uppercase tracking-widest flex items-center gap-2">
                <Warehouse size={14} className="text-primary" /> Hub Name
              </label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Bangalore North Distribution Hub"
                className="w-full h-14 bg-gray-50 border border-border rounded-2xl px-6 font-black text-main focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-main uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> Physical Location
              </label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Address, City, State"
                className="w-full h-14 bg-gray-50 border border-border rounded-2xl px-6 font-black text-main focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
              <p className="text-[9px] text-muted font-bold italic">Format: Street, City, State</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-main uppercase tracking-widest flex items-center gap-2">
                <Layers size={14} className="text-primary" /> Maximum Capacity (Units)
              </label>
              <input 
                type="number" 
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full h-14 bg-gray-50 border border-border rounded-2xl px-6 font-black text-main focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 h-14 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                {isSubmitting ? <Activity className="animate-spin" /> : (selectedWarehouse ? 'UPDATE HUB' : 'PROVISION HUB')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Decommission Warehouse?"
        message="This action will permanently remove this hub from your network. Please ensure all inventory has been transferred before proceeding."
        confirmText="DECOMMISSION"
        type="danger"
      />
    </div>
  );
};

export default WarehousePage;