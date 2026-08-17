import React, { useEffect, useState } from 'react';
import Modal from '../../components/superadmin/Modal';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';

function PurchaseRequestAcknowledgeModal({
  isOpen,
  onClose,
  request,
  onSubmit,
  loading = false,
}) {
  const [items, setItems] = useState([]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [supplierResponseNotes, setSupplierResponseNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !request) return;
    setItems(
      (request.items || []).map((item) => ({
        productId: item.productId,
        productNameSnapshot: item.productNameSnapshot,
        purchaseQuantity: item.purchaseQuantity,
        confirmedQuantity: String(item.purchaseQuantity ?? ''),
      }))
    );
    setExpectedDeliveryDate(request.expectedDeliveryDate || '');
    setSupplierResponseNotes('');
    setError('');
  }, [isOpen, request]);

  const handleItemChange = (productId, value) => {
    setItems((prev) => prev.map((row) => (
      String(row.productId) === String(productId)
        ? { ...row, confirmedQuantity: value }
        : row
    )));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    for (const item of items) {
      const qty = Number(item.confirmedQuantity);
      if (!Number.isInteger(qty) || qty < 1) {
        setError(`Confirmed quantity for ${item.productNameSnapshot} must be a positive whole number.`);
        return;
      }
      if (qty > Number(item.purchaseQuantity)) {
        setError(`Confirmed quantity for ${item.productNameSnapshot} cannot exceed purchase quantity.`);
        return;
      }
    }

    try {
      await onSubmit({
        items: items.map((item) => ({
          productId: item.productId,
          confirmedQuantity: Number(item.confirmedQuantity),
        })),
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        supplierResponseNotes,
      });
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to record supplier response'));
    }
  };

  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Acknowledge Supplier Response" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-900">{request.purchaseRequestNumber}</p>
          <p>{request.supplierNameSnapshot}</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-3">
          {items.map((item) => {
            const confirmed = Number(item.confirmedQuantity || 0);
            const shortfall = Math.max(0, Number(item.purchaseQuantity) - confirmed);
            return (
              <div key={item.productId} className="rounded-lg border border-gray-200 p-3 space-y-2">
                <p className="font-medium text-gray-900">{item.productNameSnapshot}</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <span>Requested: {item.purchaseQuantity}</span>
                  {shortfall > 0 && <span className="text-amber-700">Shortfall: {shortfall}</span>}
                </div>
                <label className="block text-sm">
                  <span className="text-gray-700">Confirmed Quantity</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.confirmedQuantity}
                    onChange={(e) => handleItemChange(item.productId, e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    disabled={loading}
                  />
                </label>
              </div>
            );
          })}
        </div>

        <label className="block text-sm">
          <span className="text-gray-700">Expected Delivery Date</span>
          <input
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            disabled={loading}
          />
        </label>

        <label className="block text-sm">
          <span className="text-gray-700">Supplier Notes</span>
          <textarea
            rows={3}
            value={supplierResponseNotes}
            onChange={(e) => setSupplierResponseNotes(e.target.value)}
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
            disabled={loading}
            className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Confirm Supplier Response'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default PurchaseRequestAcknowledgeModal;
