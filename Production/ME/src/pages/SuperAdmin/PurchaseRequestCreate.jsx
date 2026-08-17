import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import PageHeader from '../../components/superadmin/PageHeader';
import DataTable from '../../components/superadmin/DataTable';
import ProcurementSubNav from './ProcurementSubNav';
import SupplierAllocationPanel from './SupplierAllocationPanel';
import superAdminService from '../../services/superAdminService';
import { toDateInputValue } from './ProcurementDemand';

const formatMoney = (value) => {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `₹${amount.toFixed(2)}`;
};

function PurchaseRequestCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [demandDate, setDemandDate] = useState(() => searchParams.get('date') || toDateInputValue());
  const [demand, setDemand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [builderItems, setBuilderItems] = useState([]);
  const [allocationProduct, setAllocationProduct] = useState(null);
  const [priceConfirmOpen, setPriceConfirmOpen] = useState(false);

  const lockedSupplier = builderItems[0] || null;

  const loadDemand = useCallback(async (selectedDate) => {
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.getProcurementDemand({ date: selectedDate });
      setDemand(response?.data ?? response);
    } catch (err) {
      setDemand(null);
      setError(getUserFacingErrorMessage(err, 'Failed to load procurement demand'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDemand(demandDate);
  }, [demandDate, loadDemand]);

  const totalEstimatedCost = useMemo(
    () => builderItems.reduce((sum, item) => sum + (Number(item.estimatedSubtotal) || 0), 0),
    [builderItems]
  );

  const handleAddItem = async (item) => {
    if (lockedSupplier && String(item.supplierId) !== String(lockedSupplier.supplierId)) {
      throw new Error('A purchase request can only contain products from one supplier.');
    }
    setBuilderItems((current) => {
      const next = current.filter(
        (row) => !(String(row.productId) === String(item.productId)
          && String(row.supplierProductId) === String(item.supplierProductId))
      );
      return [...next, item];
    });
  };

  const removeItem = (productId) => {
    setBuilderItems((current) => current.filter((row) => String(row.productId) !== String(productId)));
  };

  const buildPayload = () => ({
    supplierId: lockedSupplier.supplierId,
    demandDate,
    notes,
    items: builderItems.map((item) => ({
      productId: item.productId,
      supplierProductId: item.supplierProductId,
      demandQuantity: item.demandQuantity,
      purchaseQuantity: item.purchaseQuantity,
    })),
  });

  const saveDraft = async () => {
    if (!builderItems.length) {
      setError('Add at least one product to the purchase request.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const response = await superAdminService.createPurchaseRequest(buildPayload());
      const payload = response?.data ?? response;
      navigate(`/super-admin/procurement/purchase-requests/${payload._id}`);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to save purchase request'));
    } finally {
      setActionLoading(false);
    }
  };

  const submitRequest = async (confirmPriceRefresh = false) => {
    if (!builderItems.length) {
      setError('Add at least one product to the purchase request.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const created = await superAdminService.createPurchaseRequest(buildPayload());
      const payload = created?.data ?? created;
      await superAdminService.submitPurchaseRequest(payload._id, { confirmPriceRefresh });
      navigate('/super-admin/procurement/purchase-requests');
    } catch (err) {
      const message = getUserFacingErrorMessage(err, 'Failed to submit purchase request');
      if (message.toLowerCase().includes('price changed')) {
        setPriceConfirmOpen(true);
      } else {
        setError(message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const demandColumns = useMemo(() => [
    { key: 'productName', label: 'Product' },
    { key: 'requiredQuantity', label: 'Required Quantity' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setAllocationProduct(row)}
          className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          Allocate Supplier
        </button>
      ),
    },
  ], []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Create Purchase Request"
        subtitle="Convert procurement demand into a supplier-specific purchase request."
      />
      <ProcurementSubNav />

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-medium text-gray-700" htmlFor="pr-demand-date">Demand Date</label>
        <input
          id="pr-demand-date"
          type="date"
          value={demandDate}
          onChange={(e) => setDemandDate(e.target.value)}
          className="px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Procurement Demand</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading procurement demand...</p>
          ) : !demand?.products?.length ? (
            <p className="text-sm text-gray-500">No procurement demand for this date.</p>
          ) : (
            <DataTable columns={demandColumns} data={demand.products} />
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Purchase Request Builder</h3>
            {lockedSupplier && (
              <span className="text-xs text-gray-600">Supplier: {lockedSupplier.supplierName}</span>
            )}
          </div>

          {!builderItems.length ? (
            <p className="text-sm text-gray-500">Allocate suppliers from demand to build this purchase request.</p>
          ) : (
            <div className="space-y-3">
              {builderItems.map((item) => (
                <div key={item.productId} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Demand {item.demandQuantity} · Purchase {item.purchaseQuantity} · {formatMoney(item.supplierPrice)} each
                      </p>
                      <p className="text-xs text-gray-600">Estimated {formatMoney(item.estimatedSubtotal)}</p>
                    </div>
                    <button type="button" onClick={() => removeItem(item.productId)} className="text-xs text-red-700">Remove</button>
                  </div>
                </div>
              ))}
              <p className="text-sm font-semibold text-gray-900">Total Estimated Cost: {formatMoney(totalEstimatedCost)}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2.5 min-h-[88px] border border-gray-300 rounded-lg text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={actionLoading || !builderItems.length}
              onClick={saveDraft}
              className="px-4 py-2.5 text-sm border rounded-lg disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              disabled={actionLoading || !builderItems.length}
              onClick={() => submitRequest(false)}
              className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {actionLoading ? 'Submitting...' : 'Submit Purchase Request'}
            </button>
            <Link to="/super-admin/procurement/purchase-requests" className="px-4 py-2.5 text-sm border rounded-lg">
              Cancel
            </Link>
          </div>
        </div>
      </div>

      <SupplierAllocationPanel
        isOpen={Boolean(allocationProduct)}
        onClose={() => setAllocationProduct(null)}
        demandDate={demandDate}
        product={allocationProduct}
        onAddItem={handleAddItem}
      />

      {priceConfirmOpen && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
          <p className="text-sm text-amber-900">Supplier price changed since allocation. Confirm the updated supplier price before submitting.</p>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => {
              setPriceConfirmOpen(false);
              submitRequest(true);
            }}
            className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Confirm Updated Price and Submit
          </button>
        </div>
      )}
    </div>
  );
}

export default PurchaseRequestCreate;
