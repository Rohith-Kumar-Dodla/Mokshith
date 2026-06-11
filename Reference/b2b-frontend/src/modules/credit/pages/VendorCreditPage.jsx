import { useVendorCredit } from '../hooks/useVendorCredit.js';
import LedgerTable from '../components/LedgerTable.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import { CreditCard, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import '../../admin/pages/AdminShared.css';

const VendorCreditPage = () => {
  const { account, ledger, summary, loading, error } = useVendorCredit();

  if (loading) {
    return <div className="admin-page-content py-16 text-center text-gray-500">Loading credit dashboard...</div>;
  }

  if (error) {
    return (
      <EmptyState icon={AlertCircle} title="Failed to load credit data" description={error} />
    );
  }

  const utilization = account?.utilizationPercent || 0;

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">Credit Dashboard</h1>
          <p className="page-subtitle">Monitor your credit balance, utilization, and transaction history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <CreditStatCard
          icon={Wallet}
          label="Available Credit"
          value={`₹${(account?.availableCredit || 0).toLocaleString()}`}
          color="text-emerald-600"
        />
        <CreditStatCard
          icon={TrendingUp}
          label="Utilization"
          value={`${utilization}%`}
          color={utilization > 80 ? 'text-red-600' : 'text-blue-600'}
        />
        <CreditStatCard
          icon={CreditCard}
          label="Credit Limit"
          value={`₹${(account?.creditLimit || 0).toLocaleString()}`}
          color="text-gray-900"
        />
      </div>

      <div className="admin-card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Credit Utilization</h3>
          <span className="text-sm text-gray-500">
            ₹{(account?.usedCredit || 0).toLocaleString()} of ₹{(account?.creditLimit || 0).toLocaleString()} used
          </span>
        </div>
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${utilization > 80 ? 'bg-red-500' : 'bg-blue-600'}`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="admin-card p-4 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Debits</p>
            <p className="text-xl font-black text-red-600">₹{summary.totalDebits?.toLocaleString()}</p>
          </div>
          <div className="admin-card p-4 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Credits</p>
            <p className="text-xl font-black text-emerald-600">₹{summary.totalCredits?.toLocaleString()}</p>
          </div>
          <div className="admin-card p-4 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase">Transactions</p>
            <p className="text-xl font-black text-gray-900">{summary.transactionCount}</p>
          </div>
        </div>
      )}

      <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction Ledger</h3>
      <LedgerTable ledger={ledger} />
    </div>
  );
};

const CreditStatCard = ({ icon: Icon, label, value, color }) => (
  <div className="admin-card p-6">
    <div className="flex items-center gap-3 mb-3">
      <Icon size={20} className="text-blue-600" />
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
  </div>
);

export default VendorCreditPage;
