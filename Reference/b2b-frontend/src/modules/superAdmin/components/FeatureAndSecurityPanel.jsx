import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import { useState } from "react";
import { X, ShieldAlert, FileText, Plus } from "lucide-react";

const FeatureAndSecurityPanel = ({ config, onSave }) => {
  const [showIpModal, setShowIpModal] = useState(false);
  const [newIp, setNewIp] = useState("");
  
  const blockedIps = config?.blockedIps || [];

  const defaultFlags = {
    creditSystem: true,
    cod: true,
    notifications: true,
    reviews: true,
    recommendations: true,
    dynamicPricing: false
  };

  const featureFlags = config?.featureFlags || defaultFlags;

  const handleToggleFeature = (feature) => {
    const newFlags = { ...featureFlags, [feature]: !featureFlags[feature] };
    onSave({ featureFlags: newFlags });
  };

  const handleAddIp = () => {
    if (newIp && !blockedIps.includes(newIp)) {
      onSave({ blockedIps: [...blockedIps, newIp] });
      setNewIp("");
    }
  };

  const handleRemoveIp = (ipToRemove) => {
    onSave({ blockedIps: blockedIps.filter(ip => ip !== ipToRemove) });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
      <Card style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '900', 
          marginBottom: '2rem', 
          textAlign: 'center',
          color: '#111827',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Feature Flags
        </h3>
        <div style={{ display: 'grid', gap: '1.25rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          {Object.entries(featureFlags).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'capitalize', color: '#374151' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '22px' }}>
                <input 
                  type="checkbox" 
                  checked={value} 
                  onChange={() => handleToggleFeature(key)}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: value ? 'var(--primary)' : '#cbd5e1', 
                  transition: '.4s', borderRadius: '22px',
                  boxShadow: value ? '0 4px 6px -1px rgba(14, 165, 233, 0.2)' : 'none'
                }}>
                  <span style={{ 
                    position: 'absolute', height: '18px', width: '18px', 
                    left: value ? '24px' : '2px', bottom: '2px', 
                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}></span>
                </span>
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '900', 
          marginBottom: '2rem', 
          textAlign: 'center',
          color: '#111827',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Security Panel
        </h3>
        <div style={{ marginBottom: '2rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Security Overview</p>
          <div style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500' }}>Blocked IPs</span>
              <span style={{ fontWeight: '800', color: blockedIps.length > 0 ? 'var(--error)' : 'var(--text-muted)' }}>{blockedIps.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>Active Sessions</span>
              <span style={{ fontWeight: '800', color: 'var(--success)' }}>Active</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <Button 
            size="small" 
            variant="secondary" 
            onClick={() => setShowIpModal(true)}
            style={{ flex: 1, borderRadius: '0.75rem', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
          >
            <ShieldAlert size={14} />
            Block IP List
          </Button>
          <Button 
            size="small" 
            variant="secondary" 
            onClick={() => {
              const auditSection = document.getElementById('audit-trail');
              if (auditSection) auditSection.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ flex: 1, borderRadius: '0.75rem', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
          >
            <FileText size={14} />
            View Logs
          </Button>
        </div>
      </Card>

      {/* IP Block Modal */}
      <Modal isOpen={showIpModal} onClose={() => setShowIpModal(false)} title="IP Access Control" size="sm">
        <div style={{ padding: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Input 
              placeholder="Enter IP Address (e.g. 192.168.1.1)" 
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <Button onClick={handleAddIp} style={{ height: '56px', padding: '0 1.5rem' }}>
              <Plus size={20} />
            </Button>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '1rem' }}>
            {blockedIps.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>No IPs currently blocked</p>
              </div>
            ) : (
              blockedIps.map(ip => (
                <div key={ip} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.875rem' }}>{ip}</span>
                  <button 
                    onClick={() => handleRemoveIp(ip)}
                    style={{ 
                      padding: '0.5rem', 
                      borderRadius: '0.5rem', 
                      color: '#ef4444', 
                      backgroundColor: '#fef2f2',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FeatureAndSecurityPanel;
