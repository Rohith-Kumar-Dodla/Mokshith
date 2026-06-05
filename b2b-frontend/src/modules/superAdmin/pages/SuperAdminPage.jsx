import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useSuperAdmin } from "../hooks/useSuperAdmin";
import { useAuth } from "../../auth/hooks/useAuth";
import AuditTable from "../components/AuditTable.jsx";
import SystemConfigForm from "../components/SystemConfigForm.jsx";
import MetricsCards from "../components/MetricsCards.jsx";
import AdminManagement from "../components/AdminManagement.jsx";
import CategoryControl from "../components/CategoryControl.jsx";
import FeatureAndSecurityPanel from "../components/FeatureAndSecurityPanel.jsx";
import PartnerAccountCreation from "../components/PartnerAccountCreation.jsx";
import DbShell from "../components/DbShell.jsx";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { LogOut, ArrowLeft, Eye, Trash2, Building2, Truck, UserPlus, Phone, Mail, MapPin, ShieldCheck, Key, CreditCard, Users } from 'lucide-react';

const SuperAdminPage = () => {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'b2b-list', 'delivery-list'
  const [accounts, setAccounts] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [viewDetailsAccount, setViewDetailsAccount] = useState(null);

  const { 
    config, 
    metrics, 
    admins, 
    categories, 
    auditLogs, 
    loading, 
    error, 
    updateConfig, 
    createAdmin,
    deleteAdmin,
    updateAdmin,
    createCategory,
    deleteCategory,
    updateCategory,
    fetchDbCollection,
    exportAuditLogs,
    createB2BCustomer,
    createDeliveryPartner,
    getB2BCustomers,
    deleteB2BCustomer,
    getDeliveryPartners,
    deleteDeliveryPartner
  } = useSuperAdmin();
  const { logout } = useAuth();
  const { showDbShell, setShowDbShell } = useOutletContext();

  const handleViewB2B = async () => {
    setListLoading(true);
    try {
      const data = await getB2BCustomers();
      setAccounts(data);
      setActiveView('b2b-list');
    } catch (err) {
      alert(err.message);
    } finally {
      setListLoading(false);
    }
  };

  const handleViewDelivery = async () => {
    setListLoading(true);
    try {
      const data = await getDeliveryPartners();
      setAccounts(data);
      setActiveView('delivery-list');
    } catch (err) {
      alert(err.message);
    } finally {
      setListLoading(false);
    }
  };

  const handleDeleteAccount = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    try {
      if (type === 'B2B') await deleteB2BCustomer(id);
      else await deleteDeliveryPartner(id);
      setAccounts(accounts.filter(acc => (acc.id || acc._id) !== id));
      alert("Account deleted successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportLogs = async () => {
    try {
      const blob = await exportAuditLogs();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to export logs: " + err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-rose-200"></div>
        <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Initializing Root Console</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--error)' }}>{error}</p>
      <Button onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>Retry</Button>
    </div>
  );

  if (activeView === 'b2b-list' || activeView === 'delivery-list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveView('dashboard')}
              className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {activeView === 'b2b-list' ? 'B2B Customer Accounts' : 'Delivery Partner Fleet'}
              </h2>
              <p className="text-xs text-gray-500 font-medium">Managing {accounts.length} registered partners</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Partner Information</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">{activeView === 'b2b-list' ? 'Credit / GST' : 'Vehicle / License'}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Contact Details</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {accounts.length > 0 ? accounts.map((acc) => (
                  <tr key={acc.id || acc._id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeView === 'b2b-list' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {activeView === 'b2b-list' ? <Building2 size={20} /> : <Truck size={20} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 tracking-tight">{acc.businessName || acc.name}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{acc.ownerName || 'Strategic Partner'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {activeView === 'b2b-list' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-rose-600">₹{acc.creditLimit?.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{acc.gstNumber || 'NO GST'}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-emerald-600">{acc.vehicleType?.replace('_', ' ')}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{acc.vehicleNumber}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{acc.email}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{acc.mobile}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setViewDetailsAccount({...acc, type: activeView === 'b2b-list' ? 'B2B' : 'DELIVERY'})}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all active:scale-95"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAccount(acc.id || acc._id, activeView === 'b2b-list' ? 'B2B' : 'DELIVERY')}
                          className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all active:scale-95"
                          title="Delete Account"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                          <Users size={32} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No accounts discovered in this sector</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal (using existing logic but styled better) */}
        {viewDetailsAccount && (
          <Modal 
            title={`${viewDetailsAccount.type === 'B2B' ? 'B2B Partner' : 'Logistics Partner'} Profile`} 
            onClose={() => setViewDetailsAccount(null)}
          >
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${viewDetailsAccount.type === 'B2B' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {viewDetailsAccount.type === 'B2B' ? <Building2 size={32} /> : <Truck size={32} />}
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900 tracking-tight">{viewDetailsAccount.businessName || viewDetailsAccount.name}</h4>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{viewDetailsAccount.type} Tier Partner</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Full Name" value={viewDetailsAccount.name || viewDetailsAccount.ownerName} icon={<UserPlus size={14}/>} />
                <DetailItem label="Mobile" value={viewDetailsAccount.mobile} icon={<Phone size={14}/>} />
                <DetailItem label="Email Address" value={viewDetailsAccount.email} icon={<Mail size={14}/>} className="col-span-2" />
                
                {viewDetailsAccount.type === 'B2B' ? (
                  <>
                    <DetailItem label="GST Identity" value={viewDetailsAccount.gstNumber} icon={<ShieldCheck size={14}/>} />
                    <DetailItem label="Credit Line" value={`₹${viewDetailsAccount.creditLimit?.toLocaleString()}`} icon={<CreditCard size={14}/>} />
                    <DetailItem label="Business Location" value={viewDetailsAccount.businessAddress} icon={<MapPin size={14}/>} className="col-span-2" />
                  </>
                ) : (
                  <>
                    <DetailItem label="Vehicle Class" value={viewDetailsAccount.vehicleType?.replace('_', ' ')} icon={<Truck size={14}/>} />
                    <DetailItem label="Registry Number" value={viewDetailsAccount.vehicleNumber} icon={<ShieldCheck size={14}/>} />
                    <DetailItem label="License Registry" value={viewDetailsAccount.licenseNumber} icon={<Key size={14}/>} className="col-span-2" />
                  </>
                )}
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => setViewDetailsAccount(null)} 
                  fullWidth 
                  className="h-14 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Close Profile View
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">Global Management</h2>
        <p className="text-gray-500 mt-1">Enterprise control center for Mokshith B2B platform</p>
      </div>

      <MetricsCards metrics={metrics} />

      <SystemConfigForm config={config} onSave={updateConfig} />

      <FeatureAndSecurityPanel config={config} onSave={updateConfig} />

      <PartnerAccountCreation 
        onCreateB2B={createB2BCustomer} 
        onCreateDelivery={createDeliveryPartner} 
        onViewB2B={handleViewB2B}
        onViewDelivery={handleViewDelivery}
        listLoading={listLoading}
      />

      <AdminManagement admins={admins} onCreateAdmin={createAdmin} onDeleteAdmin={deleteAdmin} onUpdateAdmin={updateAdmin} />

      <CategoryControl categories={categories} onCreateCategory={createCategory} onDeleteCategory={deleteCategory} onUpdateCategory={updateCategory} />

      <div id="audit-trail" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '900', 
            color: '#111827',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            System Audit Trail
          </h3>
        </div>
        <div className="flex justify-end mb-4">
          <Button variant="secondary" size="small" onClick={handleExportLogs} style={{ borderRadius: '0.75rem', fontWeight: '800' }}>
            Export Logs
          </Button>
        </div>
        <div style={{ paddingLeft: '1rem' }}>
          <AuditTable logs={auditLogs} />
        </div>
      </div>

      {showDbShell && (
        <DbShell 
          onFetchCollection={fetchDbCollection} 
          onClose={() => setShowDbShell(false)} 
        />
      )}
    </div>
  );
};

const DetailItem = ({ label, value, icon, className = '' }) => (
  <div className={`p-4 bg-white border border-gray-100 rounded-2xl ${className}`}>
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
      {icon}
      {label}
    </span>
    <p className="text-sm font-bold text-gray-800 break-words">{value || 'N/A'}</p>
  </div>
);

export default SuperAdminPage;
