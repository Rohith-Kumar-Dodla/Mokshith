import React, { useState } from "react";
import Card from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import { User, Mail, Phone, MapPin, Shield, Calendar, ExternalLink, Check, X, Clock } from "lucide-react";

const ApprovalCard = ({ approval, onApprove, onReject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isPending = approval.status === "pending";

  const getStatusBadgeClass = (status) => {
    switch(status.toLowerCase()) {
      case 'approved': return 'active';
      case 'rejected': return 'inactive';
      default: return 'pending';
    }
  };

  return (
    <>
      <div className="admin-card flex flex-col h-full">
        <div className="p-6 flex-1">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full">
              {approval.type}
            </span>
            <span className={`status-badge ${getStatusBadgeClass(approval.status)}`}>
              {approval.status === 'pending' && <Clock size={12} />}
              {approval.status === 'approved' && <Check size={12} />}
              {approval.status === 'rejected' && <X size={12} />}
              {approval.status.toUpperCase()}
            </span>
          </div>

          <h4 className="text-xl font-black text-main mb-2 tracking-tight line-clamp-1">
            {approval.title}
          </h4>
          
          <div className="flex items-center gap-2 text-muted text-sm mb-6">
            <Calendar size={14} />
            <span>{new Date(approval.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm font-medium text-main">
              <Mail size={16} className="text-primary" />
              <span className="truncate">{approval.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-main">
              <Shield size={16} className="text-primary" />
              <span>Role: {approval.role}</span>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 border-t border-border/50 bg-gray-50/50">
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="w-full justify-center gap-2 font-bold text-xs uppercase tracking-wider h-11"
            >
              <ExternalLink size={14} />
              Review Details
            </Button>

            {isPending && (
              <div className="flex gap-3">
                <Button 
                  onClick={() => onApprove(approval.id)} 
                  className="flex-1 bg-primary hover:bg-primary-hover text-white font-black h-11"
                >
                  Approve
                </Button>
                <Button 
                  onClick={() => onReject(approval.id)} 
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-black h-11"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Registration Request Details"
      >
        <div className="p-6">
          <div className="space-y-6">
            {/* Request Status Header */}
            <div className="bg-primary/5 rounded-2xl p-4 flex items-center justify-between border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-black text-main tracking-tight">{approval.title}</h3>
                  <p className="text-xs text-muted font-bold uppercase tracking-wider">{approval.role}</p>
                </div>
              </div>
              <span className={`status-badge ${getStatusBadgeClass(approval.status)}`}>
                {approval.status.toUpperCase()}
              </span>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-border/50">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Email Address</p>
                <p className="font-bold text-main">{approval.email}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-border/50">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Mobile Number</p>
                <p className="font-bold text-main">{approval.mobile || 'Not Provided'}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-border/50">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Registration Date</p>
                <p className="font-bold text-main">
                  {new Date(approval.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-border/50">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Request Type</p>
                <p className="font-bold text-main capitalize">{approval.type}</p>
              </div>
            </div>

            {/* Address Info */}
            {approval.addresses && approval.addresses.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-main uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  Address Details
                </h4>
                <div className="space-y-3">
                  {approval.addresses.map((addr, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border bg-white shadow-sm">
                      <p className="text-sm font-bold text-main leading-relaxed">
                        {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                      </p>
                      <p className="text-xs text-muted font-medium mt-1 uppercase tracking-wider">{addr.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons in Modal if pending */}
            {isPending && (
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button 
                  onClick={() => { onApprove(approval.id); setIsModalOpen(false); }} 
                  className="flex-1 bg-primary hover:bg-primary-hover text-white font-black h-12"
                >
                  Approve Request
                </Button>
                <Button 
                  onClick={() => { onReject(approval.id); setIsModalOpen(false); }} 
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-black h-12"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ApprovalCard;
