import { useState } from "react";
import { useAuditLogs } from "../hooks/useAuditLogs.js";
import AuditTable from "../components/AuditTable.jsx";
import AuditFilters from "../components/AuditFilters.jsx";
import AuditDetailDrawer from "../components/AuditDetailDrawer.jsx";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { FileText, Download, AlertCircle } from "lucide-react";

const AuditPage = () => {
  const {
    logs,
    loading,
    error,
    filters,
    selectedLog,
    setSelectedLog,
    updateFilters,
    exportLogs,
    viewLogDetail,
  } = useAuditLogs();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleExportLogs = async () => {
    try {
      const blob = await exportLogs();
      const url = window.URL.createObjectURL(blob);
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

  const handleRowClick = async (log) => {
    await viewLogDetail(log._id || log.id);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Audit Trail</h2>
            <p className="text-gray-500 text-sm mt-1">Monitor platform activity and security events</p>
          </div>
          <Button variant="secondary" size="small" onClick={handleExportLogs}>
            <Download size={16} className="mr-2" />
            Export Logs
          </Button>
        </div>

        <AuditFilters filters={filters} onFilterChange={updateFilters} />

        {loading && (
          <div className="py-12 text-center text-gray-500">Loading audit logs...</div>
        )}

        {error && (
          <div className="py-8 flex items-center justify-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No audit logs found"
            description="Try adjusting your filters or check back later."
          />
        )}

        {!loading && !error && logs.length > 0 && (
          <AuditTable logs={logs} onRowClick={handleRowClick} />
        )}
      </div>

      <AuditDetailDrawer
        log={selectedLog}
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedLog(null); }}
      />
    </div>
  );
};

export default AuditPage;
