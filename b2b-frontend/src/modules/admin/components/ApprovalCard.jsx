import React, { useState } from "react";
import Card from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import { User, Mail, Phone, MapPin, Shield, Calendar } from "lucide-react";

const ApprovalCard = ({ approval, onApprove, onReject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isPending = approval.status === "pending";

  return (
    <>
      <Card style={{ 
        marginBottom: "1.5rem", 
        padding: '1.5rem',
        width: '100%',
        maxWidth: '500px',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        borderRadius: '1.5rem',
        border: '1px solid var(--border)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
      }}>
        <div style={{ marginBottom: '1.5rem', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: '800', 
              textTransform: 'uppercase',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '0.3rem 0.75rem',
              borderRadius: '1rem',
              letterSpacing: '0.1em'
            }}>
              {approval.type}
            </span>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: '700',
              color: approval.status === 'approved' ? 'var(--success)' : 
                     approval.status === 'rejected' ? 'var(--error)' : 'var(--warning)',
              backgroundColor: approval.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 
                               approval.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              padding: '0.3rem 0.75rem',
              borderRadius: '1rem'
            }}>
              {approval.status.toUpperCase()}
            </span>
          </div>
          <h4 style={{ fontSize: '1.35rem', fontWeight: '900', marginBottom: '0.5rem', color: '#111827', letterSpacing: '-0.025em' }}>
            {approval.title}
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Requested on {new Date(approval.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <Button 
            variant="secondary"
            onClick={() => setIsModalOpen(true)}
            style={{ 
              padding: '0.6rem 1rem', 
              fontSize: '0.75rem', 
              fontWeight: '800',
              borderRadius: '0.75rem',
              width: '100%',
              backgroundColor: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            View Details
          </Button>

          {isPending && (
            <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
              <Button 
                onClick={() => onApprove(approval.id)} 
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '800',
                  borderRadius: '1rem',
                  backgroundColor: '#2563EB',
                  flex: 1,
                  maxWidth: '140px',
                  height: 'auto',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
              >
                Approve
              </Button>
              <Button 
                onClick={() => onReject(approval.id)} 
                variant="secondary"
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '800',
                  borderRadius: '1rem',
                  color: '#EF4444', 
                  borderColor: '#EF4444',
                  flex: 1,
                  maxWidth: '140px',
                  height: 'auto',
                  backgroundColor: 'white'
                }}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Registration Details"
      >
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Basic Info */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', color: '#3b82f6' }}>
                  <User size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Full Name</p>
                  <p style={{ fontWeight: '800', color: '#1e293b' }}>{approval.title}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', color: '#22c55e' }}>
                  <Mail size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Email Address</p>
                  <p style={{ fontWeight: '800', color: '#1e293b' }}>{approval.email}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem', color: '#f97316' }}>
                  <Phone size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Mobile Number</p>
                  <p style={{ fontWeight: '800', color: '#1e293b' }}>{approval.mobile || 'N/A'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f5f3ff', borderRadius: '0.5rem', color: '#8b5cf6' }}>
                  <Shield size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Assigned Role</p>
                  <p style={{ fontWeight: '800', color: '#1e293b' }}>{approval.role}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', color: '#475569' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Registration Date</p>
                  <p style={{ fontWeight: '800', color: '#1e293b' }}>
                    {new Date(approval.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Address Info */}
            {approval.addresses && approval.addresses.length > 0 && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#fdf2f8', borderRadius: '0.5rem', color: '#db2777' }}>
                    <MapPin size={18} />
                  </div>
                  <p style={{ fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address Details</p>
                </div>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {approval.addresses.map((addr, idx) => (
                    <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                      <p style={{ fontWeight: '800', color: '#334155', marginBottom: '0.25rem' }}>{addr.name}</p>
                      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{addr.addressLine}</p>
                      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>Phone: {addr.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Button onClick={() => setIsModalOpen(false)} style={{ width: '100%', borderRadius: '1rem', fontWeight: '800' }}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ApprovalCard;
