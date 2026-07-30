import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiExternalLink } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import Modal from '../../components/admin/Modal';
import StatusBadge from '../../components/vendor/StatusBadge';
import { usePendingBankTransfers } from '../../hooks/useBankTransfer';
import TableResponsive from '../../components/common/TableResponsive';
import useViewport from '../../hooks/useViewport';

const PaymentVerifications = () => {
  const { proofs, loading, error, actionLoading, approveProof, rejectProof } = usePendingBankTransfers();
  const [toast, setToast] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, proof: null, reason: '' });
  const [rejectError, setRejectError] = useState('');

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = async (proofId) => {
    const result = await approveProof(proofId);
    if (result.success) {
      showToast('success', 'Payment approved successfully');
    } else {
      showToast('error', result.message);
    }
  };

  const openRejectModal = (proof) => {
    setRejectModal({ open: true, proof, reason: '' });
    setRejectError('');
  };

  const closeRejectModal = () => {
    setRejectModal({ open: false, proof: null, reason: '' });
    setRejectError('');
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      setRejectError('Rejection reason is required');
      return;
    }

    const result = await rejectProof(rejectModal.proof.id, rejectModal.reason.trim());
    if (result.success) {
      showToast('success', 'Payment rejected');
      closeRejectModal();
    } else {
      setRejectError(result.message);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const { isMobile } = useViewport();

  return (
    <div className="space-y-4 sm:space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <PageHeader
        title="Payment Verifications"
        subtitle="Review bank transfer proofs. Any transfer amount (₹1 to ₹1L+) can be approved after manual verification."
      />

      {/* Mobile layout: show cards instead of table */}
      {isMobile && (
        <div className="space-y-3">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-600">Loading pending verifications...</div>
          ) : proofs.length === 0 ? (
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending verifications</h3>
              <p className="text-sm text-gray-600">All bank transfer payments have been reviewed.</p>
            </div>
          ) : (
            proofs.map((proof) => (
              <div key={proof.id} className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">Order: {String(proof.orderNumber).slice(-8)}</p>
                    <p className="text-xs text-gray-500">{proof.vendor}</p>
                    <p className="text-sm font-semibold mt-2">₹{proof.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={proof.status} size="sm" />
                    <p className="text-xs text-gray-500 mt-2">{new Date(proof.submittedAt).toLocaleString()}</p>
                    <div className="flex flex-col gap-2 mt-3">
                      <button onClick={() => handleApprove(proof.id)} className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg">Approve</button>
                      <button onClick={() => openRejectModal(proof)} className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg">Reject</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isMobile && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-gray-600">Loading pending verifications...</div>
          ) : proofs.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending verifications</h3>
              <p className="text-sm text-gray-600">All bank transfer payments have been reviewed.</p>
            </div>
          ) : (
            <TableResponsive>
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Order ID</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Vendor</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">UTR</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Screenshot</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Submitted</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {proofs.map((proof) => (
                    <tr key={proof.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono text-gray-900">{String(proof.orderNumber).slice(-8)}</td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-gray-900">{proof.vendor}</p>
                        {proof.vendorEmail && (
                          <p className="text-xs text-gray-500">{proof.vendorEmail}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                        ₹{proof.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-900">{proof.utrNumber}</td>
                      <td className="py-3 px-4">
                        {proof.screenshot ? (
                          <a
                            href={proof.screenshot}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            Preview
                            <FiExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(proof.submittedAt)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={proof.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(proof.id)}
                            disabled={!proof.id || actionLoading === proof.id || proof.rawStatus === 'APPROVED'}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === proof.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openRejectModal(proof)}
                            disabled={actionLoading === proof.id}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableResponsive>
          )}
        </div>
      )}

      <Modal
        isOpen={rejectModal.open}
        onClose={closeRejectModal}
        title="Reject Payment Proof"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Provide a reason for rejecting this payment proof. The vendor will be able to resubmit.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
              rows={4}
              placeholder="e.g. Invalid UTR, unclear screenshot, payment not received"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {rejectError && (
            <p className="text-sm text-red-600">{rejectError}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeRejectModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={actionLoading === rejectModal.proof?.id}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading === rejectModal.proof?.id ? 'Rejecting...' : 'Reject Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentVerifications;

