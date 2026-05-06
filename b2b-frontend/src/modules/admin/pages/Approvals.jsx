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
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      <div className="text-center mb-12">
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1rem', color: '#111827', letterSpacing: '-0.025em' }}>
          Pending Approvals
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', maxWidth: '600px', mx: 'auto' }}>
          Review and manage user registration requests to maintain platform security and quality
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
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
            padding: '6rem 4rem', 
            textAlign: 'center', 
            backgroundColor: 'var(--surface)', 
            borderRadius: '2rem', 
            border: '2px dashed var(--border)',
            width: '100%',
            maxWidth: '600px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✨</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: '600' }}>
              No pending approvals at this time.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Check back later for new registration requests.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovalsPage;
