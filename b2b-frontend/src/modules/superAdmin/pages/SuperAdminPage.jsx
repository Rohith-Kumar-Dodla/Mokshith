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
    fetchDbCollection 
  } = useSuperAdmin();
  const { logout } = useAuth();
  const { showDbShell, setShowDbShell } = useOutletContext();

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert("Logs exported successfully!");
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

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">System Audit Trail</h3>
        <Button variant="secondary" size="small" onClick={handleExportLogs}>Export Logs</Button>
      </div>
      
      <AuditTable logs={auditLogs} />

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
