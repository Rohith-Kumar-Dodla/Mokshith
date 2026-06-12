import React from 'react';

const BankTransferDetails = ({ bankDetails, amount, loading }) => {
  if (loading) {
    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        Loading bank details...
      </div>
    );
  }

  if (!bankDetails) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-blue-900">Bank Transfer Details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-blue-600">Account Name</p>
          <p className="font-medium text-blue-900">{bankDetails.accountName}</p>
        </div>
        <div>
          <p className="text-blue-600">Bank Name</p>
          <p className="font-medium text-blue-900">{bankDetails.bankName}</p>
        </div>
        <div>
          <p className="text-blue-600">Account Number</p>
          <p className="font-medium text-blue-900 font-mono">{bankDetails.accountNumber}</p>
        </div>
        <div>
          <p className="text-blue-600">IFSC Code</p>
          <p className="font-medium text-blue-900 font-mono">{bankDetails.ifsc}</p>
        </div>
      </div>
      {amount != null && (
        <div className="pt-2 border-t border-blue-200">
          <p className="text-blue-600 text-sm">Amount Payable</p>
          <p className="text-lg font-bold text-blue-900">₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      )}
      <p className="text-xs text-blue-700">
        Transfer via bank transfer (any amount from ₹1 to ₹1,00,000+ is accepted). Upload your UTR number and payment screenshot for admin verification.
      </p>
    </div>
  );
};

export default BankTransferDetails;
