import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import BankTransferDetails from '../../components/vendor/BankTransferDetails';
import PaymentProofForm from '../../components/vendor/PaymentProofForm';
import StatusBadge from '../../components/vendor/StatusBadge';
import { useBankTransferProof } from '../../hooks/useBankTransfer';

const BankTransferPayment = () => {
  const { id: orderId } = useParams();
  const location = useLocation();
  const orderFromState = location.state?.order;
  const [toast, setToast] = useState(null);
  const { proof, bankDetails, orderInfo, loading, error, reload } = useBankTransferProof(orderId);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  };

  const amount = orderInfo?.amount ?? orderFromState?.amount ?? proof?.amount;
  const canSubmit =
    !proof ||
    proof.rawStatus === 'REJECTED' ||
    (proof.rawStatus === 'PENDING' && orderInfo?.paymentStatus === 'REJECTED');

  const isPendingVerification = proof?.rawStatus === 'PENDING';
  const isApproved = proof?.rawStatus === 'APPROVED';
  const isRejected = proof?.rawStatus === 'REJECTED';

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-sm text-gray-600">Loading payment details...</p>
      </div>
    );
  }

  if (error && !orderInfo) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load payment page</h2>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Link to="/vendor/orders" className="text-blue-600 hover:text-blue-700">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <Link
        to={`/vendor/orders/${orderId}`}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Order Details
      </Link>

      <PageHeader
        title="Submit Bank Transfer Payment"
        subtitle="Complete your bank transfer and upload payment proof. Any transfer amount is accepted."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Order ID</p>
                <p className="font-medium text-gray-900 font-mono">{orderId}</p>
              </div>
              <div>
                <p className="text-gray-500">Amount Payable</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {orderInfo?.paymentStatus && (
                <div>
                  <p className="text-gray-500 mb-1">Payment Status</p>
                  <StatusBadge status={orderInfo.paymentStatus === 'REJECTED' ? 'rejected' : orderInfo.paymentStatus.toLowerCase()} />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <BankTransferDetails bankDetails={bankDetails} amount={amount} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          {isApproved && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Approved</h3>
              <p className="text-sm text-gray-600">
                Your bank transfer has been verified. Your order is being processed.
              </p>
            </div>
          )}

          {isPendingVerification && !isRejected && (
            <div className="space-y-4">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">Pending Verification</h3>
                <p className="text-sm text-yellow-800">
                  Your payment proof has been submitted and is awaiting admin verification.
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500">Submitted UTR</p>
                  <p className="font-medium text-gray-900 font-mono">{proof.utrNumber}</p>
                </div>
                {proof.screenshot && (
                  <div>
                    <p className="text-gray-500 mb-1">Screenshot</p>
                    <a
                      href={proof.screenshot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      View uploaded proof
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {(canSubmit || isRejected) && !isApproved && (
            <div className="space-y-4">
              {isRejected && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Payment Rejected</h3>
                  <p className="text-sm text-red-800 mb-2">
                    {proof.rejectionReason || 'Your payment proof was rejected. Please resubmit.'}
                  </p>
                  <p className="text-xs text-red-700">You can submit updated payment proof below.</p>
                </div>
              )}

              {!isPendingVerification && (
                <>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {isRejected ? 'Resubmit Payment Proof' : 'Upload Payment Proof'}
                  </h2>
                  <PaymentProofForm
                    orderId={orderId}
                    onSuccess={async () => {
                      await reload();
                      showToast('success', 'Payment proof submitted successfully');
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankTransferPayment;
