import { useState, useEffect } from "react";
import { Search, Plus, Filter, MoreVertical, Building2, MapPin, CreditCard, ShieldCheck } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import { adminService } from "../services/adminService";
import './AdminShared.css';

const AdminVendorsPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowCreditModal] = useState(false); // Reusing showAddModal state for simplicity in name
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    businessName: "",
    ownerName: "",
    gstNumber: "",
    businessAddress: "",
    creditLimit: 50000
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers('B2B_CUSTOMER');
      setCustomers(response.data || response || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createB2BCustomer(formData);
      setShowAddCustomerModal(false);
      setFormData({
        name: "", email: "", mobile: "", password: "",
        businessName: "", ownerName: "", gstNumber: "",
        businessAddress: "", creditLimit: 50000
      });
      fetchCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner"></div>
      <p>Loading customer ecosystem...</p>
    </div>
  );

  return (
    <div className="admin-page-content animate-in fade-in duration-700">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">B2B Customer Management</h1>
          <p className="page-subtitle">Onboard and manage strategic B2B partners and credit allocations</p>
        </div>
        <div className="header-actions">
          <Button 
            onClick={() => setShowAddCustomerModal(true)}
            className="h-14 px-8 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 uppercase"
          >
            <Plus size={18} />
            Onboard B2B Customer
          </Button>
        </div>
      </div>

      <div className="admin-card">
        <div className="p-6 border-b border-border bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="table-search max-w-md w-full">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by business name, owner or GSTIN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="status-badge active">
              <Building2 size={14} />
              <span>{customers.length} Active Customers</span>
            </div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Business Entity</th>
                <th>Owner Details</th>
                <th>GSTIN</th>
                <th>Credit Standing</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{customer.businessName}</div>
                          <div className="flex items-center gap-1 text-[10px] text-muted font-bold uppercase tracking-tight">
                            <MapPin size={10} />
                            <span className="truncate max-w-[150px]">{customer.businessAddress}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.875rem' }}>{customer.ownerName || customer.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{customer.mobile}</div>
                    </td>
                    <td>
                      <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-600 border border-slate-200">
                        {customer.gstNumber || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-[10px] font-bold text-muted uppercase">Available</span>
                          <span className="text-xs font-black text-primary">₹{customer.availableCredit?.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(customer.availableCredit / customer.creditLimit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${customer.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {customer.status}
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
                    <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="font-bold text-slate-400">No B2B customers found in the ecosystem</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddCustomerModal && (
        <Modal title="Onboard New B2B Customer" onClose={() => setShowAddCustomerModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Business Name" name="businessName" value={formData.businessName} onChange={handleChange} required />
              <Input label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Owner/Contact Name" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
              <Input label="Display Name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} required />
              <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
            <Input label="Business Address" name="businessAddress" value={formData.businessAddress} onChange={handleChange} required />
            <Input label="Initial Credit Limit (₹)" name="creditLimit" type="number" value={formData.creditLimit} onChange={handleChange} required />
            
            <div className="flex gap-4 pt-6 sticky bottom-0 bg-white">
              <Button type="button" variant="secondary" onClick={() => setShowAddCustomerModal(false)} className="flex-1 h-12">Cancel</Button>
              <Button type="submit" className="flex-1 h-12">Create Account</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminVendorsPage;
