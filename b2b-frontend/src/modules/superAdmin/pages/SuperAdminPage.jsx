import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useSuperAdmin } from "../hooks/useSuperAdmin";
import { useAuth } from "../../auth/hooks/useAuth";
import AuditTable from "../components/AuditTable";
import SystemConfigForm from "../components/SystemConfigForm";
import MetricsCards from "../components/MetricsCards";
import AdminManagement from "../components/AdminManagement";
import CategoryControl from "../components/CategoryControl";
import FeatureAndSecurityPanel from "../components/FeatureAndSecurityPanel";
import DbShell from "../components/DbShell";
import Button from "../../../components/ui/Button";
import { LogOut } from 'lucide-react';

const SuperAdminPage = () => {
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
    exportAuditLogs
  } = useSuperAdmin();
  const { logout } = useAuth();
  const { showDbShell, setShowDbShell } = useOutletContext();

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

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">Global Management</h2>
        <p className="text-gray-500 mt-1">Enterprise control center for Mokshith B2B platform</p>
      </div>

      <MetricsCards metrics={metrics} />

      <SystemConfigForm config={config} onSave={updateConfig} />

      <FeatureAndSecurityPanel config={config} onSave={updateConfig} />

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

export default SuperAdminPage;
