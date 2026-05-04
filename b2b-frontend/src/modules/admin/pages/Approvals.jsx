import { useAdmin } from "../hooks/useAdmin";
import ApprovalCard from "../components/ApprovalCard";
import Button from "../../../components/ui/Button";

const AdminApprovalsPage = () => {
  const { approvals, loading, error, approve, reject } = useAdmin();

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center">
      <p className="text-red-500">{error}</p>
      <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Pending Approvals</h2>
        <p style={{ color: 'var(--text-muted)' }}>Review and manage user registration requests</p>
      </div>

      <div>
        {approvals.length > 0 ? (
          approvals.map((a) => (
            <ApprovalCard 
              key={a.id} 
              approval={a} 
              onApprove={approve} 
              onReject={reject}
            />
          ))
        ) : (
          <div style={{ 
            padding: '4rem', 
            textAlign: 'center', 
            backgroundColor: 'var(--surface)', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px dashed var(--border)' 
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>
              No pending approvals at this time. Check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovalsPage;
