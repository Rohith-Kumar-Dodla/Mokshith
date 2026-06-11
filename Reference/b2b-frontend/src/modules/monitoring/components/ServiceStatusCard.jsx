import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const statusConfig = {
  healthy: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  degraded: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  unhealthy: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
};

const ServiceStatusCard = ({ name, status, details }) => {
  const config = statusConfig[status] || statusConfig.healthy;
  const Icon = config.icon;

  return (
    <div className={`p-6 rounded-2xl border ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 capitalize">{name}</h3>
        <Icon size={24} className={config.color} />
      </div>
      <p className={`text-sm font-semibold capitalize ${config.color}`}>{status}</p>
      {details && (
        <div className="mt-3 space-y-1">
          {Object.entries(details).slice(0, 3).map(([key, value]) => (
            <p key={key} className="text-xs text-gray-500">
              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceStatusCard;
