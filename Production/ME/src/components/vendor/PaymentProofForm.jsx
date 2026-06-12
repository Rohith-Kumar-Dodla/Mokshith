import React, { useState } from 'react';
import { FiUpload, FiFileText } from 'react-icons/fi';
import paymentService from '../../services/paymentService';

const PaymentProofForm = ({ orderId, onSuccess, disabled = false, submitLabel = 'Submit Payment Proof' }) => {
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!utrNumber.trim()) {
      setError('UTR number is required');
      return;
    }

    if (!screenshot) {
      setError('Payment screenshot is required');
      return;
    }

    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('utrNumber', utrNumber.trim());
    formData.append('screenshot', screenshot);

    setSubmitting(true);
    try {
      await paymentService.uploadBankTransferProof(formData);
      setUtrNumber('');
      setScreenshot(null);
      if (onSuccess) await onSuccess();
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
        submitError.message ||
        'Failed to submit payment proof'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">UTR Number</label>
        <input
          type="text"
          value={utrNumber}
          onChange={(e) => setUtrNumber(e.target.value)}
          disabled={disabled || submitting}
          placeholder="Enter bank transfer UTR / reference number"
          className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Screenshot</label>
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
            {screenshot ? (
              <>
                <FiFileText className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-sm text-gray-700 truncate max-w-full">{screenshot.name}</p>
              </>
            ) : (
              <>
                <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload screenshot (jpg, png, pdf — max 5MB)</p>
              </>
            )}
          </div>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            className="hidden"
            disabled={disabled || submitting}
            onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={disabled || submitting}
        className="w-full py-2.5 h-12 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : submitLabel}
      </button>
    </form>
  );
};

export default PaymentProofForm;
