import { useState, useEffect } from "react";
import { Search, Plus, Filter, MoreVertical, Truck, Phone, User, ShieldCheck } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import { adminService } from "../services/adminService";
import './AdminShared.css';

const AdminDeliveryPartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    vehicleType: "TWO_WHEELER",
    vehicleNumber: "",
    licenseNumber: ""
  });

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers('DELIVERY_PARTNER');
      setPartners(response.data || response || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createDeliveryPartner(formData);
      setShowAddModal(false);
      setFormData({
        name: "", email: "", mobile: "", password: "",
        vehicleType: "TWO_WHEELER", vehicleNumber: "", licenseNumber: ""
      });
      fetchPartners();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredPartners = partners.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mobile?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner"></div>
      <p>Syncing logistics fleet...</p>
    </div>
  );

  return (
    <div className="admin-page-content animate-in fade-in duration-700">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">Delivery Partner Management</h1>
          <p className="page-subtitle">Manage your last-mile logistics fleet and delivery personnel</p>
        </div>
        <div className="header-actions">
          <Button 
            onClick={() => setShowAddModal(true)}
            className="h-14 px-8 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 uppercase"
          >
            <Plus size={18} />
            Register Delivery Partner
          </Button>
        </div>
      </div>

      <div className="admin-card">
        <div className="p-6 border-b border-border bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="table-search max-w-md w-full">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by name, vehicle number or mobile..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="status-badge active">
              <Truck size={14} />
              <span>{partners.length} Fleet Members</span>
            </div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Partner Details</th>
                <th>Vehicle Info</th>
                <th>License Number</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.length > 0 ? (
                filteredPartners.map((partner) => (
                  <tr key={partner._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                          {partner.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{partner.name}</div>
                          <div className="text-[10px] text-muted font-bold uppercase tracking-tight">{partner.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase">{partner.vehicleType?.replace('_', ' ')}</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 border border-slate-200 w-fit mt-1">
                          {partner.vehicleNumber}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <ShieldCheck size={14} className="text-primary" />
                        {partner.licenseNumber}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <Phone size={14} className="text-slate-400" />
                        {partner.mobile}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${partner.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {partner.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
                    <Truck size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="font-bold text-slate-400">No delivery partners found in the fleet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <Modal title="Register Delivery Partner" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
              <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} required />
              <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="text-xs font-black text-muted uppercase tracking-widest mb-2 block">Vehicle Type</label>
              <select 
                name="vehicleType" 
                value={formData.vehicleType} 
                onChange={handleChange}
                className="w-full h-12 px-4 bg-slate-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
              >
                <option value="TWO_WHEELER">Two Wheeler (Bike)</option>
                <option value="THREE_WHEELER">Three Wheeler (Auto)</option>
                <option value="FOUR_WHEELER">Four Wheeler (Van)</option>
                <option value="HEAVY_VEHICLE">Heavy Vehicle (Truck)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Vehicle Number" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required placeholder="e.g. MH-01-AB-1234" />
              <Input label="License Number" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required />
            </div>
            
            <div className="flex gap-4 pt-6">
              <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1 h-12">Cancel</Button>
              <Button type="submit" className="flex-1 h-12">Register Partner</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminDeliveryPartnersPage;
