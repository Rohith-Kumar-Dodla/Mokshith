import Card from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";

const ApprovalCard = ({ approval, onApprove, onReject }) => {
  const isPending = approval.status === "pending";

  return (
    <Card style={{ 
      marginBottom: "1.5rem", 
      padding: '2.5rem',
      width: '100%',
      maxWidth: '650px',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      textAlign: 'center',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
      borderRadius: '2rem',
      border: '1px solid var(--border)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    }}>
      <div style={{ marginBottom: '2rem', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: '800', 
            textTransform: 'uppercase',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '0.4rem 1rem',
            borderRadius: '2rem',
            letterSpacing: '0.1em'
          }}>
            {approval.type}
          </span>
          <span style={{ 
            fontSize: '0.875rem', 
            fontWeight: '700',
            color: approval.status === 'approved' ? 'var(--success)' : 
                   approval.status === 'rejected' ? 'var(--error)' : 'var(--warning)',
            backgroundColor: approval.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 
                             approval.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            padding: '0.4rem 1rem',
            borderRadius: '2rem'
          }}>
            {approval.status.toUpperCase()}
          </span>
        </div>
        <h4 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.75rem', color: '#111827', letterSpacing: '-0.025em' }}>
          {approval.title}
        </h4>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>
          Requested on {new Date(approval.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      </div>

      {isPending && (
        <div style={{ display: 'flex', gap: '1.25rem', width: '100%', justifyContent: 'center' }}>
          <Button 
            onClick={() => onApprove(approval.id)} 
            style={{ 
              padding: '1rem 2rem', 
              fontSize: '1rem', 
              fontWeight: '800',
              borderRadius: '1.25rem',
              backgroundColor: '#2563EB',
              flex: 1,
              maxWidth: '200px',
              height: 'auto',
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
            }}
          >
            Approve
          </Button>
          <Button 
            onClick={() => onReject(approval.id)} 
            variant="secondary"
            style={{ 
              padding: '1rem 2rem', 
              fontSize: '1rem', 
              fontWeight: '800',
              borderRadius: '1.25rem',
              color: '#EF4444', 
              borderColor: '#EF4444',
              flex: 1,
              maxWidth: '200px',
              height: 'auto',
              backgroundColor: 'white'
            }}
          >
            Reject
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ApprovalCard;
