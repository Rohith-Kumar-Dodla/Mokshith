import React, { useEffect, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import Modal from '../../components/superadmin/Modal';
import StatusBadge from '../../components/superadmin/StatusBadge';
import superAdminService from '../../services/superAdminService';

const inputClass =
  'w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

const formatMoney = (value) => {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `₹${amount.toFixed(2)}`;
};

function SupplierAllocationPanel({
  isOpen,
  onClose,
  demandDate,
  product,
  onAddItem,
}) {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !product?.productId) return;
    setLoading(true);
    setError('');
    setSelectedSupplier(null);
    setPurchaseQuantity('');
    superAdminService.getDemandProductSupplierAllocation(demandDate, product.productId)
      .then((response) => {
        const payload = response?.data ?? response;
        setAllocation(payload);
      })
      .catch((err) => {
        setAllocation(null);
        setError(getUserFacingErrorMessage(err, 'Failed to load supplier options'));
      })
      .finally(() => setLoading(false));
  }, [isOpen, demandDate, product?.productId]);

  const demandQuantity = allocation?.demandQuantity ?? product?.requiredQuantity ?? 0;

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setPurchaseQuantity(String(supplier.suggestedPurchaseQuantity ?? demandQuantity));
  };

  const handleAdd = async () => {
    if (!selectedSupplier) {
      setError('Select a supplier to continue.');
      return;
    }
    const qty = Number(purchaseQuantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setError('Purchase quantity must be a positive whole number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onAddItem({
        productId: product.productId,
        productName: allocation?.product?.name || product.productName,
        supplierId: selectedSupplier.supplierId,
        supplierName: selectedSupplier.supplierName,
        supplierProductId: selectedSupplier.mappingId,
        demandQuantity,
        purchaseQuantity: qty,
        supplierPrice: selectedSupplier.currentSupplierPrice,
        supplierMOQ: selectedSupplier.minimumOrderQuantity,
        estimatedSubtotal: qty * Number(selectedSupplier.currentSupplierPrice),
      });
      onClose();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Unable to add item to purchase request'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Supplier Allocation"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{allocation?.product?.name || product?.productName}</p>
          <p className="text-sm text-gray-600 mt-1">Required Demand: {demandQuantity}</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading supplier options...</p>
        ) : !allocation?.suppliers?.length ? (
          <p className="text-sm text-gray-500">No active suppliers are available for this product.</p>
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Supplier</th>
                    <th className="px-3 py-2">Supplier Purchase Price</th>
                    <th className="px-3 py-2">Supplier MOQ</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {allocation.suppliers.map((row) => (
                    <tr key={row.mappingId} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{row.supplierName}</div>
                        {row.isLowestPrice && (
                          <span className="text-xs font-semibold text-emerald-700">Lowest Price</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row.currentSupplierPrice == null ? 'Price Not Set' : formatMoney(row.currentSupplierPrice)}
                      </td>
                      <td className="px-3 py-2">{row.minimumOrderQuantity}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={String(row.availabilityStatus || 'ACTIVE').toLowerCase()} />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={row.currentSupplierPrice == null}
                          onClick={() => handleSelectSupplier(row)}
                          className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedSupplier && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Selected Supplier: {selectedSupplier.supplierName}</p>
                <p className="text-sm text-gray-700">
                  Supplier Purchase Price: {formatMoney(selectedSupplier.currentSupplierPrice)}
                </p>
                <p className="text-sm text-gray-700">Supplier MOQ: {selectedSupplier.minimumOrderQuantity}</p>
                <p className="text-sm text-gray-700">
                  Suggested Purchase Quantity: {selectedSupplier.suggestedPurchaseQuantity ?? demandQuantity}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Quantity</label>
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    step="1"
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(e.target.value)}
                  />
                </div>
                <p className="text-sm text-gray-700">
                  Estimated Cost: {formatMoney(Number(purchaseQuantity) * Number(selectedSupplier.currentSupplierPrice))}
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm border rounded-lg">Cancel</button>
          <button
            type="button"
            disabled={!selectedSupplier || saving}
            onClick={handleAdd}
            className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add to Purchase Request'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default SupplierAllocationPanel;
