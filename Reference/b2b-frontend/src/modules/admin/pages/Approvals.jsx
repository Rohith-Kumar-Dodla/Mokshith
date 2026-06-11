import { useAdmin } from "../hooks/useAdmin";
import ApprovalCard from "../components/ApprovalCard";
import Button from "../../../components/ui/Button";
import { CheckCircle, XCircle, Loader2, Sparkles, UserCheck } from "lucide-react";
import "./AdminShared.css";

const AdminApprovalsPage = () => {
  const { approvals, loading, error, approve, reject } = useAdmin();

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-muted font-bold animate-pulse">Fetching pending requests...</p>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center bg-red-50 rounded-2xl border border-red-100 m-8">
      <XCircle className="mx-auto text-red-500 mb-4" size={48} />
      <p className="text-red-600 font-bold text-lg mb-4">{error}</p>
      <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white px-8">Retry</Button>
    </div>
  );

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">Pending Approvals</h1>
          <p className="page-subtitle">Review and manage registration requests for platform security</p>
        </div>
        <div className="header-actions">
          <div className="status-badge active">
            <UserCheck size={14} />
            <span>{approvals.length} Requests</span>
          </div>
        </div>
      </div>

      <div className="approvals-grid">
        {approvals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvals.map((a) => (
              <ApprovalCard 
                key={a.id} 
                approval={a} 
                onApprove={approve} 
                onReject={reject}
              />
            ))}
          </div>
        ) : (
          <div className="admin-card" style={{ 
            padding: '6rem 4rem', 
            textAlign: 'center', 
            border: '2px dashed var(--border-color)',
            background: 'transparent'
          }}>
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="text-primary" size={40} />
            </div>
            <h3 className="text-2xl font-black text-main mb-2">All Caught Up!</h3>
            <p className="text-muted font-medium max-w-sm mx-auto">
              No pending approvals at this time. New registration requests will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovalsPage;
