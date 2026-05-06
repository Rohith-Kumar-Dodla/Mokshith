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
  AlertCircle
} from 'lucide-react';

const WarehouseCard = ({ warehouse, onEdit, onDelete }) => {
  const currentLoad = warehouse.currentLoad || 0;
  const capacity = warehouse.capacity || 1;
  const loadPercentage = (currentLoad / capacity) * 100;
  const isFull = loadPercentage >= 90;
  const isModerate = loadPercentage >= 60 && loadPercentage < 90;

  return (
    <Card className="hover:shadow-2xl transition-all duration-500 border border-gray-100 bg-white group overflow-hidden rounded-[2.5rem] p-10 flex flex-col items-center text-center relative">
      <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onEdit(warehouse)} 
            className="p-3 bg-white shadow-xl hover:bg-blue-600 hover:text-white rounded-2xl text-blue-600 transition-all border border-gray-50"
          >
            <Edit3 size={18} />
          </button>
          <button 
            onClick={() => onDelete(warehouse._id)} 
            className="p-3 bg-white shadow-xl hover:bg-rose-600 hover:text-white rounded-2xl text-rose-500 transition-all border border-gray-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
        <Warehouse size={48} className="text-blue-600" />
      </div>

      <div className="space-y-2 mb-10">
        <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-tight uppercase italic">
          {warehouse.name}
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest">
          <MapPin size={16} className="text-blue-500" />
          <span>
            {warehouse.city}, {warehouse.state}
          </span>
        </div>
      </div>

      <div className="w-full space-y-10">
        <div className="w-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Utilization</p>
              <p className={`text-4xl font-black tracking-tighter ${isFull ? 'text-rose-600' : isModerate ? 'text-amber-500' : 'text-emerald-500'}`}>
                {Math.round(loadPercentage)}%
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Current Load</span>
              <span className="px-4 py-1.5 bg-gray-900 text-white text-xs font-black rounded-xl tracking-widest">
                {currentLoad.toLocaleString()} / {capacity.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-full h-5 bg-gray-50 rounded-full overflow-hidden p-1.5 border border-gray-100 shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
                isFull ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 
                isModerate ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                'bg-gradient-to-r from-emerald-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(loadPercentage, 100)}%` }}
            >
              <div className="w-full h-full bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full">
          <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 group-hover:bg-white group-hover:shadow-xl transition-all duration-500">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 flex items-center justify-center gap-2">
              <Layers size={12} className="text-blue-500" /> Capacity
            </p>
            <p className="font-black text-gray-900 text-2xl tracking-tighter">{capacity.toLocaleString()}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Units Total</p>
          </div>
          <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 group-hover:bg-white group-hover:shadow-xl transition-all duration-500">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 mb-3 flex items-center justify-center gap-2">
              <Box size={12} /> Available
            </p>
            <p className="font-black text-blue-700 text-2xl tracking-tighter">
              {Math.max(0, capacity - currentLoad).toLocaleString()}
            </p>
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">Free Slots</p>
          </div>
        </div>
      </div>
    </Card>
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
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between animate-pulse">
          <div className="space-y-3">
            <div className="h-10 w-64 bg-gray-200 rounded-2xl"></div>
            <div className="h-5 w-96 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="h-12 w-44 bg-gray-200 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-gray-100 rounded-[2.5rem] animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12 pl-24 pr-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 pl-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic">
            Warehouse <span className="text-blue-600">Network</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium tracking-tight flex items-center gap-3">
            <Truck size={22} className="text-blue-500" />
            Manage storage locations and global inventory distribution
          </p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="shadow-2xl shadow-blue-500/20 h-16 px-10 text-xs font-black tracking-widest uppercase rounded-[1.5rem] flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white transition-all group"
        >
          <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
          Add Warehouse
        </Button>
      </div>

      {(error || localError) && (
        <div className="mb-8 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center justify-between gap-3 text-red-600 font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertCircle size={20} />
            </div>
            {error || localError}
          </div>
          <button onClick={() => setLocalError(null)} className="p-2 hover:bg-red-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 max-w-[1600px] mx-auto w-full">
        {warehouses.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3">
            <Card className="text-center py-24 border-2 border-dashed border-gray-200 bg-white/50">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Warehouse size={48} className="text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">No Warehouses Found</h3>
              <p className="text-gray-500 font-bold max-w-md mx-auto mb-10">
                You haven't added any storage locations yet. Start building your distribution network today.
              </p>
              <Button onClick={() => handleOpenModal()} variant="secondary" className="h-14 px-10 rounded-2xl">
                Create First Warehouse
              </Button>
            </Card>
          </div>
        ) : (
          warehouses.map((warehouse) => (
            <WarehouseCard 
              key={warehouse._id} 
              warehouse={warehouse} 
              onEdit={handleOpenModal}
              onDelete={setDeleteId}
            />
          ))
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title={selectedWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
        size="lg"
        preventClose={isSubmitting}
        footer={
          <div className="flex gap-4 w-full sm:w-auto">
            <Button 
              variant="secondary" 
              onClick={() => setIsModalOpen(false)} 
              disabled={isSubmitting}
              className="flex-1 h-14 rounded-2xl font-black border-2 border-gray-100 hover:bg-gray-50 transition-all"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              loading={isSubmitting}
              className="flex-1 h-14 rounded-2xl font-black shadow-xl shadow-blue-100 bg-blue-600 hover:bg-blue-700 text-white transition-all"
            >
              {selectedWarehouse ? 'Save Changes' : 'Create Warehouse'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <Input
              label="Warehouse Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Central Distribution Center"
              required
              disabled={isSubmitting}
              helperText="Internal name for this storage facility"
            />
            
            <Input
              label="Location (Address, City, State)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. 123 Industrial Area, Mumbai, Maharashtra"
              required
              disabled={isSubmitting}
              helperText="Format: Address, City, State"
            />

            <Input
              label="Total Capacity (Units)"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              required
              disabled={isSubmitting}
              helperText="Maximum number of product units this facility can hold"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? All inventory associated with it might be affected."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default WarehousePage;