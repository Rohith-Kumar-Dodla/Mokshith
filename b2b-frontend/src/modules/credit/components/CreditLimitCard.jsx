import Card from "../../../components/ui/Card.jsx";

const CreditLimitCard = ({ credit }) => {
  if (!credit) return (
    <Card style={{ marginBottom: '2rem', padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading credit data...</p>
    </Card>
  );

  const formatValue = (val) => {
    const num = Number(val);
    return isNaN(num) ? "0" : num.toLocaleString('en-IN');
  };

  return (
    <Card style={{ 
      marginBottom: '3rem', 
      padding: '2.5rem',
      borderRadius: '2.5rem',
      border: '1px solid var(--border)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
    }}>
      <div className="flex items-center justify-between mb-10">
        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#111827', letterSpacing: '-0.025em' }}>Credit Overview</h3>
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100">
          BUSINESS ACCOUNT
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
        <div className="space-y-2">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', uppercase: 'true', tracking: '0.1em' }}>CREDIT LIMIT</p>
          <p style={{ fontSize: '2.25rem', fontWeight: '900', color: '#111827' }}>₹{formatValue(credit.creditLimit)}</p>
        </div>
        <div className="space-y-2">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', uppercase: 'true', tracking: '0.1em' }}>UTILIZED</p>
          <p style={{ fontSize: '2.25rem', fontWeight: '900', color: '#E11D48' }}>₹{formatValue(credit.usedCredit)}</p>
        </div>
        <div className="space-y-2">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', uppercase: 'true', tracking: '0.1em' }}>AVAILABLE</p>
          <p style={{ fontSize: '2.25rem', fontWeight: '900', color: '#059669' }}>₹{formatValue(credit.availableCredit)}</p>
        </div>
        <div className="space-y-2">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', uppercase: 'true', tracking: '0.1em' }}>STATUS</p>
          <div className="flex items-center gap-2 pt-1">
            <div className={`w-3 h-3 rounded-full ${credit.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <p style={{ fontSize: '1.5rem', fontWeight: '900', color: credit.status === 'ACTIVE' ? '#059669' : '#E11D48' }}>
              {credit.status || 'INACTIVE'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CreditLimitCard;
