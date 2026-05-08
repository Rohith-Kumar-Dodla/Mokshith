import React from "react";
import { Building2, Sparkles, Plus, Search, Filter, LayoutGrid } from "lucide-react";
import Button from "../../../components/ui/Button";
import "./AdminShared.css";

const AdminVendorsPage = () => {
  return (
    <div className="admin-page-content animate-in fade-in duration-700">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">Vendor Ecosystem</h1>
          <p className="page-subtitle">Onboard and manage strategic supply partners and vendor approvals</p>
        </div>
        <div className="header-actions">
          <Button 
            className="h-14 px-8 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 uppercase"
          >
            <Plus size={18} />
            Onboard Vendor
          </Button>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="p-6 border-b border-border bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="table-search max-w-md w-full">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by vendor name or GSTIN..." 
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="status-badge active">
              <Building2 size={14} />
              <span>0 Active Vendors</span>
            </div>
          </div>
        </div>

        <div className="p-20 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-8 border-2 border-dashed border-primary/20">
            <Sparkles size={48} className="text-primary/20" />
          </div>
          <h3 className="text-2xl font-black text-main mb-2 tracking-tight">Vendor Module in Development</h3>
          <p className="text-muted font-medium max-w-md mx-auto mb-10 uppercase tracking-widest text-[10px] leading-relaxed">
            The multi-vendor orchestration engine is currently being optimized for high-volume wholesale transactions.
          </p>
          <div className="flex gap-4">
            <div className="px-6 py-3 bg-gray-50 rounded-xl border border-border flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-main uppercase tracking-widest">Database Ready</span>
            </div>
            <div className="px-6 py-3 bg-gray-50 rounded-xl border border-border flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-main uppercase tracking-widest">UI Layer: Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVendorsPage;
