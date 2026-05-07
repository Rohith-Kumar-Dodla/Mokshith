import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

const FeatureAndSecurityPanel = ({ config, onSave }) => {
  const defaultFlags = {
    creditSystem: true,
    cod: true,
    notifications: true,
    reviews: true,
    recommendations: true,
    dynamicPricing: false
  };

  const featureFlags = config?.featureFlags || defaultFlags;

  const handleToggleFeature = (feature) => {
    const newFlags = { ...featureFlags, [feature]: !featureFlags[feature] };
    onSave({ featureFlags: newFlags });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
      <Card style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '900', 
          marginBottom: '2rem', 
          textAlign: 'center',
          color: '#111827',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Feature Flags
        </h3>
        <div style={{ display: 'grid', gap: '1.25rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          {Object.entries(featureFlags).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'capitalize', color: '#374151' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '22px' }}>
                <input 
                  type="checkbox" 
                  checked={value} 
                  onChange={() => handleToggleFeature(key)}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: value ? 'var(--primary)' : '#cbd5e1', 
                  transition: '.4s', borderRadius: '22px',
                  boxShadow: value ? '0 4px 6px -1px rgba(14, 165, 233, 0.2)' : 'none'
                }}>
                  <span style={{ 
                    position: 'absolute', height: '18px', width: '18px', 
                    left: value ? '24px' : '2px', bottom: '2px', 
                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}></span>
                </span>
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '900', 
          marginBottom: '2rem', 
          textAlign: 'center',
          color: '#111827',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Security Panel
        </h3>
        <div style={{ marginBottom: '2rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Recent Login Attempts</p>
          <div style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>• user1@example.com - <span style={{ color: 'var(--success)', fontWeight: '800' }}>SUCCESS</span> (2 mins ago)</p>
            <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>• unknown@hacker.com - <span style={{ color: 'var(--error)', fontWeight: '800' }}>FAILED</span> (15 mins ago)</p>
            <p style={{ fontWeight: '500' }}>• admin@mokshith.com - <span style={{ color: 'var(--success)', fontWeight: '800' }}>SUCCESS</span> (1 hour ago)</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <Button size="small" variant="secondary" style={{ flex: 1, borderRadius: '0.75rem', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px' }}>Block IP List</Button>
          <Button size="small" variant="secondary" style={{ flex: 1, borderRadius: '0.75rem', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px' }}>View Logs</Button>
        </div>
      </Card>
    </div>
  );
};

export default FeatureAndSecurityPanel;
