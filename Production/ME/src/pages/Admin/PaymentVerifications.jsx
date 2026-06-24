import React from 'react';
import PageHeader from '../../components/admin/PageHeader';

const PaymentVerifications = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Payment Verifications (Restricted)"
        subtitle="This page is restricted. Financial verifications are available only to Super Admins."
      />

      <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
        Access to payment verifications (bank transfer approvals/rejections and payment amounts) has been moved to the Super Admin portal. If you require access, please contact a Super Admin.
      </div>
    </div>
  );
};

export default PaymentVerifications;
