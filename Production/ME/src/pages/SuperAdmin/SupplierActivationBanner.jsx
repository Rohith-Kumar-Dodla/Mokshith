import React from 'react';
import { getSupplierActivationCopy } from './supplierActivationUtils';

function SupplierActivationBanner({
  supplier,
  context = 'overview',
  onActivateSupplier,
  onApproveSupplier,
  actionLoading = false,
}) {
  const copy = getSupplierActivationCopy(supplier?.rawStatus, context);
  if (!copy) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-amber-900">
          ⚠ {copy.title}
        </p>
        <p className="text-sm text-amber-800">{copy.message}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {copy.showApprove && onApproveSupplier && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={onApproveSupplier}
            className="inline-flex items-center px-4 py-2.5 min-h-[44px] bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Approve Supplier
          </button>
        )}
        {copy.showActivate && onActivateSupplier && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={onActivateSupplier}
            className="inline-flex items-center px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Activate Supplier
          </button>
        )}
      </div>
    </div>
  );
}

export default SupplierActivationBanner;
