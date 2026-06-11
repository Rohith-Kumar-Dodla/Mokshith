import { Search, Filter } from 'lucide-react';

const SEVERITIES = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
const ACTIONS = ['USER_CREATED', 'CONFIG_UPDATED', 'LOGIN_FAILED', 'ORDER_UPDATED', 'PRODUCT_DELETED'];

const AuditFilters = ({ filters, onFilterChange }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search logs..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        />
      </div>
      <div className="flex gap-3">
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filters.severity || ''}
            onChange={(e) => onFilterChange({ severity: e.target.value || undefined })}
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            <option value="">All Severities</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <select
          value={filters.action || ''}
          onChange={(e) => onFilterChange({ action: e.target.value || undefined })}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
        >
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AuditFilters;
