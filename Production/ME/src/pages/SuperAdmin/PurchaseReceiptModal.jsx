import React, { useEffect, useState } from 'react';
import Modal from '../../components/superadmin/Modal';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';

function PurchaseReceiptModal({
  isOpen,
  onClose,
  item,
  onSubmit,
  loading = false,
}) {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !item) return;
    const remaining = Number(item.remainingQuantity ?? 0);
    setQuantity(remaining > 0 ? String(remaining) : '');
    setNotes('');
    setError('');
  }, [isOpen, item]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const qty = Number(quantity);
    const remaining = Number(item.remainingQuantity ?? 0);

    if (!Number.isInteger(qty) || qty < 1) {
      setError('Receive quantity must be a positive whole number.');
      return;
    }
    if (qty > remaining) {
      setError(`Receive quantity cannot exceed remaining quantity of ${remaining}.`);
      return;
    }

    try {
      await onSubmit({
        productId: item.productId,
        quantity: qty,
        notes,
      });
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to record goods received'));
    }
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Goods Received" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm space-y-1">
          <p className="font-medium text-gray-900">{item.productNameSnapshot}</p>
          <p className="text-gray-600">Purchase Quantity: {item.purchaseQuantity}</p>
          <p className="text-gray-600">Confirmed Quantity: {item.confirmedQuantity ?? '—'}</p>
          <p className="text-gray-600">Already Received: {item.receivedQuantity ?? 0}</p>
          <p className="text-gray-900 font-medium">Remaining: {item.remainingQuantity ?? 0}</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <label className="block text-sm">
          <span className="text-gray-700">Receive Quantity</span>
          <input
            type="number"
            min="1"
            step="1"
            max={item.remainingQuantity ?? undefined}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            disabled={loading || !item.remainingQuantity}
          />
        </label>

        <label className="block text-sm">
          <span className="text-gray-700">Notes</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            disabled={loading}
          />
        </label>

        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2.5 text-sm border rounded-lg">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !item.remainingQuantity}
            className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Recording...' : 'Record Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default PurchaseReceiptModal;
