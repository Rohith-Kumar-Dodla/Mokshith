import React, { useState } from 'react';
import { usePromotion } from '../hooks/usePromotion.js';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog.jsx';
import { 
  Tag, 
  Plus, 
  Calendar, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Percent,
  Clock,
  Zap,
  Ticket,
  AlertCircle,
  X,
  Search,
  LayoutGrid,
  Sparkles,
  RefreshCw,
  Gift
} from 'lucide-react';
import "../../admin/pages/AdminShared.css";

const PromotionPage = () => {
  const { promotions: rawPromotions, loading, error, createPromotion, updatePromotion, deletePromotion, toggleStatus } = usePromotion();
  const promotions = Array.isArray(rawPromotions) ? rawPromotions : [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    value: 0,
    maxDiscount: '',
    expiresAt: '',
    isActive: true
  });

  const handleOpenModal = (promo = null) => {
    setLocalError(null);
    if (promo) {
      setSelectedPromo(promo);
      setFormData({
        code: promo.code,
        discountType: promo.discountType || 'PERCENTAGE',
        value: promo.value || 0,
        maxDiscount: promo.maxDiscount || '',
        expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().split('T')[0] : '',
        isActive: promo.isActive ?? true
      });
    } else {
      setSelectedPromo(null);
      setFormData({ code: '', discountType: 'PERCENTAGE', value: 0, maxDiscount: '', expiresAt: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    try {
      setIsSubmitting(true);
      if (selectedPromo) {
        await updatePromotion(selectedPromo._id, formData);
      } else {
        await createPromotion(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setLocalError(err.message || "Failed to save promotion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePromotion(deleteId);
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete promotion:", err);
    }
  };

  const filteredPromotions = promotions.filter(promo => 
    promo.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !promotions.length) {
    return (
      <div className="admin-page-content animate-pulse">
        <div className="admin-page-header">
          <div className="page-title-section">
            <div className="h-10 w-64 bg-gray-100 rounded-xl mb-2"></div>
            <div className="h-4 w-96 bg-gray-50 rounded-lg"></div>
          </div>
        </div>
        <div className="h-[600px] bg-gray-50 rounded-[2.5rem] border border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="admin-page-content animate-in fade-in duration-700">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">Marketing Growth</h1>
          <p className="page-subtitle">Launch and manage high-converting promotional campaigns</p>
        </div>
        <div className="header-actions">
          <Button 
            onClick={() => handleOpenModal()} 
            className="h-14 px-8 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 uppercase"
          >
            <Plus size={18} />
            New Promotion
          </Button>
        </div>
      </div>

      {(error || localError) && (
        <div className="mb-8 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center justify-between gap-3 text-red-600 font-bold">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertCircle size={20} />
            </div>
            {error || localError}
          </div>
          <button onClick={() => setLocalError(null)} className="p-2 hover:bg-red-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <div className="p-6 border-b border-border bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="table-search max-w-md w-full">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by promo code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="status-badge active">
              <Ticket size={14} />
              <span>{filteredPromotions.length} Campaigns</span>
            </div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Promotion Details</th>
                <th>Discount Offer</th>
                <th>Expiry Timeline</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-32 text-center">
                    <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <Ticket size={40} className="text-primary/20" />
                    </div>
                    <h3 className="text-xl font-black text-main mb-2">No promotions found</h3>
                    <p className="text-muted font-medium uppercase tracking-widest text-[10px]">Try creating a new marketing campaign</p>
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promo) => (
                  <tr key={promo._id}>
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm border border-primary/5">
                          <Tag size={20} />
                        </div>
                        <div>
                          <p className="font-black text-main tracking-widest uppercase">{promo.code}</p>
                          <p className="text-[10px] text-muted font-bold uppercase tracking-widest">CAMPAIGN ID: {promo._id?.substring(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 font-black text-lg text-emerald-600">
                          <span>{promo.value}</span>
                          {promo.discountType === 'PERCENTAGE' ? <Percent size={14} /> : <span>₹</span>}
                          <span className="text-[10px] uppercase tracking-widest ml-1">Off</span>
                        </div>
                        {promo.maxDiscount && (
                          <span className="text-[9px] font-black text-muted uppercase tracking-widest">
                            UP TO ₹{promo.maxDiscount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-xs font-bold text-main">
                        <Calendar size={14} className="text-primary" />
                        {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Expiry'}
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleStatus(promo._id)}
                        className={`status-badge ${promo.isActive ? 'active' : 'inactive'}`}
                      >
                        {promo.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(promo)}
                          className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(promo._id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={selectedPromo ? "Refine Promotion" : "Launch Campaign"}
      >
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-main uppercase tracking-widest flex items-center gap-2">
                <Ticket size={14} className="text-primary" /> Promo Code
              </label>
              <input 
                type="text" 
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. WELCOME50"
                className="w-full h-14 bg-gray-50 border border-border rounded-2xl px-6 font-black text-main focus:ring-2 focus:ring-primary/20 outline-none transition-all tracking-widest"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-main uppercase tracking-widest">Discount Type</label>
                <select 
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full h-14 bg-gray-50 border border-border rounded-2xl px-6 font-bold text-main outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-main uppercase tracking-widest">Value</label>
                <input 
                  type="number" 
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  className="w-full h-14 bg-gray-50 border border-border rounded-2xl px-6 font-black text-main outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-main uppercase tracking-widest">Max Discount (₹)</label>
                <input 
                  type="number" 
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full h-14 bg-gray-50 border border-border rounded-2xl px-6 font-black text-main outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-main uppercase tracking-widest">Expiry Date</label>
                <input 
                  type="date" 
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full h-14 bg-gray-50 border border-border rounded-2xl px-6 font-bold text-main outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
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
                {isSubmitting ? <RefreshCw className="animate-spin" /> : (selectedPromo ? 'UPDATE PROMO' : 'LAUNCH CAMPAIGN')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Promotion?"
        message="This will permanently deactivate and remove this promotional code. Existing orders using this code will not be affected."
        confirmText="DELETE PROMO"
        type="danger"
      />
    </div>
  );
};

export default PromotionPage;