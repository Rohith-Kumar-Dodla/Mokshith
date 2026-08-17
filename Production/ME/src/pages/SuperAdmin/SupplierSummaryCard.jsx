import React from 'react';
import StatusBadge from '../../components/superadmin/StatusBadge';

const emptySummary = {
  productCount: 0,
  categoryCount: 0,
  pricesConfigured: 0,
  pricesNotSet: 0,
};

function SupplierSummaryCard({ supplier, onView, loading = false }) {
  const summary = supplier.catalogSummary || emptySummary;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
        <div className="h-6 bg-gray-100 rounded w-24 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onView?.(supplier)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left w-full hover:shadow-md hover:border-blue-200 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      aria-label={`View supplier ${supplier.supplierName}`}
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{supplier.supplierName}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{supplier.companyName}</p>
        </div>

        <StatusBadge status={supplier.status} />

        <div className="space-y-1.5 text-sm text-gray-700">
          <p>{summary.productCount} Supplier Product{summary.productCount === 1 ? '' : 's'}</p>
          <p>{summary.categoryCount} Supplier Categor{summary.categoryCount === 1 ? 'y' : 'ies'}</p>
          <p>{summary.pricesConfigured} Price{summary.pricesConfigured === 1 ? '' : 's'} Configured</p>
          <p className={summary.pricesNotSet > 0 ? 'text-amber-700' : ''}>
            {summary.pricesNotSet} Price{summary.pricesNotSet === 1 ? '' : 's'} Not Set
          </p>
        </div>

        <span className="inline-flex text-sm font-medium text-blue-700">
          View Supplier →
        </span>
      </div>
    </button>
  );
}

export default SupplierSummaryCard;
export { emptySummary };
