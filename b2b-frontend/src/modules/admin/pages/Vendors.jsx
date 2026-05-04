import Card from "../../../components/ui/Card";

const AdminVendorsPage = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Vendor Management</h2>
        <p style={{ color: 'var(--text-muted)' }}>Manage platform vendors and their approvals</p>
      </div>

      <Card>
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            Vendor management interface coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminVendorsPage;
