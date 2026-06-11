import Drawer from '../../../components/ui/Drawer.jsx';

const severityColors = {
  INFO: 'bg-gray-100 text-gray-700',
  WARNING: 'bg-amber-100 text-amber-700',
  ERROR: 'bg-red-100 text-red-700',
  CRITICAL: 'bg-red-200 text-red-800',
};

const AuditDetailDrawer = ({ log, isOpen, onClose }) => {
  if (!log) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Audit Log Detail">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${severityColors[log.severity] || severityColors.INFO}`}>
            {log.severity || 'INFO'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            {log.action}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DetailField label="User" value={log.userId?.name || log.userEmail || 'System'} />
          <DetailField label="Email" value={log.userEmail || 'N/A'} />
          <DetailField label="Role" value={log.role || 'N/A'} />
          <DetailField label="IP Address" value={log.ip || 'N/A'} />
          <DetailField label="Entity" value={log.entity || 'N/A'} />
          <DetailField label="Entity ID" value={log.entityId || 'N/A'} />
        </div>

        <DetailField label="Details" value={log.details || 'No details available'} full />

        <DetailField
          label="Timestamp"
          value={new Date(log.createdAt || log.timestamp).toLocaleString()}
          full
        />

        {log.data && Object.keys(log.data).length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Additional Data</p>
            <pre className="bg-gray-50 p-4 rounded-xl text-sm overflow-auto border border-gray-100">
              {JSON.stringify(log.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Drawer>
  );
};

const DetailField = ({ label, value, full }) => (
  <div className={full ? 'col-span-2' : ''}>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value}</p>
  </div>
);

export default AuditDetailDrawer;
