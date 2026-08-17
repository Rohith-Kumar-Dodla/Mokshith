import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import PageHeader from '../../components/superadmin/PageHeader';
import StatusBadge from '../../components/superadmin/StatusBadge';
import Modal from '../../components/superadmin/Modal';
import ProcurementSubNav from './ProcurementSubNav';
import superAdminService from '../../services/superAdminService';
import { toDateInputValue } from './ProcurementDemand';

const inputClass =
  'w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

const formatMoney = (value) => {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `₹${amount.toFixed(2)}`;
};

const unwrap = (response) => response?.data ?? response;

function ProcurementPlan() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(() => searchParams.get('date') || toDateInputValue());
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qtyDraft, setQtyDraft] = useState({});
  const [supplierItem, setSupplierItem] = useState(null);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const plan = payload?.plan || null;
  const warnings = payload?.warnings || [];
  const readiness = payload?.readiness || { productsPlanned: 0, productsRequired: 0, canConfirm: false };
  const isDraft = plan?.status === 'DRAFT';
  const isConfirmed = plan?.status === 'CONFIRMED';

  const applyPayload = (response) => {
    const next = unwrap(response);
    setPayload(next);
    const nextQty = {};
    (next?.plan?.items || []).forEach((item) => {
      nextQty[String(item.productId)] = item.plannedQuantity == null ? '' : String(item.plannedQuantity);
    });
    setQtyDraft(nextQty);
  };

  const loadPlan = useCallback(async (selectedDate) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await superAdminService.getProcurementPlanByDate(selectedDate);
      applyPayload(response);
    } catch (err) {
      setPayload(null);
      setError(getUserFacingErrorMessage(err, 'Failed to load procurement plan'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan(date);
  }, [date, loadPlan]);

  const changeDate = (nextDate) => {
    setDate(nextDate);
    setSearchParams({ date: nextDate });
  };

  const createDraft = async () => {
    setActionLoading(true);
    setError('');
    try {
      const response = await superAdminService.createProcurementPlan(date);
      applyPayload(response);
      setSuccess('Draft procurement plan saved.');
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to create procurement plan'));
    } finally {
      setActionLoading(false);
    }
  };

  const patchPlan = async (body, successMessage) => {
    if (!plan?._id) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await superAdminService.updateProcurementPlan(plan._id, body);
      applyPayload(response);
      if (successMessage) setSuccess(successMessage);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to update procurement plan'));
    } finally {
      setActionLoading(false);
    }
  };

  const openSupplierPicker = async (item) => {
    setSupplierItem(item);
    setSupplierOptions([]);
    setSupplierLoading(true);
    try {
      const response = await superAdminService.getProcurementPlanSupplierOptions(plan._id, item.productId);
      const data = unwrap(response);
      setSupplierOptions(data?.suppliers || []);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to load supplier options'));
      setSupplierItem(null);
    } finally {
      setSupplierLoading(false);
    }
  };

  const selectSupplier = async (option) => {
    await patchPlan({
      items: [{
        productId: supplierItem.productId,
        supplierId: option.supplierId,
        supplierProductId: option.mappingId,
      }],
    }, 'Supplier selected.');
    setSupplierItem(null);
  };

  const saveQuantity = async (item) => {
    const plannedQuantity = Number(qtyDraft[String(item.productId)]);
    await patchPlan({
      items: [{ productId: item.productId, plannedQuantity }],
    }, 'Planned quantity saved.');
  };

  const refreshPrice = async (item) => {
    await patchPlan({
      items: [{ productId: item.productId, refreshPrice: true }],
    }, 'Supplier price snapshot refreshed.');
  };

  const confirmPlan = async () => {
    setActionLoading(true);
    setError('');
    try {
      const response = await superAdminService.confirmProcurementPlan(plan._id);
      applyPayload(response);
      setConfirmOpen(false);
      setSuccess('Procurement plan confirmed. No supplier request was sent.');
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to confirm procurement plan'));
      setConfirmOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const cancelPlan = async () => {
    setActionLoading(true);
    setError('');
    try {
      const response = await superAdminService.cancelProcurementPlan(plan._id);
      applyPayload(response);
      setSuccess('Procurement plan cancelled.');
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to cancel procurement plan'));
    } finally {
      setActionLoading(false);
    }
  };

  const warningByProduct = useMemo(() => {
    const map = {};
    warnings.forEach((warning) => {
      const key = String(warning.productId);
      if (!map[key]) map[key] = [];
      map[key].push(warning);
    });
    return map;
  }, [warnings]);

  const selectableOptions = supplierOptions.filter((row) => row.currentSupplierPrice != null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Procurement Plan"
        subtitle="Select suppliers and planned quantities. Confirmation does not send a supplier request."
        actions={(
          <Link
            to={`/super-admin/procurement/demand`}
            className="inline-flex items-center px-4 py-2.5 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Back to Demand
          </Link>
        )}
      />

      <ProcurementSubNav />

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-medium text-gray-700" htmlFor="plan-date">Date</label>
        <input
          id="plan-date"
          type="date"
          value={date}
          onChange={(e) => changeDate(e.target.value)}
          className="px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg text-sm"
          aria-label="Procurement date"
        />
        {plan && <StatusBadge status={String(plan.status || '').toLowerCase()} />}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading procurement plan...</p>
      ) : !plan ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">No active procurement plan exists for this date.</p>
          <button
            type="button"
            disabled={actionLoading}
            onClick={createDraft}
            className="px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            Create Draft Plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Products Planned</p>
              <p className="text-2xl font-semibold text-gray-900">
                {readiness.productsPlanned} / {readiness.productsRequired}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Estimated Purchase Cost</p>
              <p className="text-2xl font-semibold text-gray-900">{formatMoney(plan.totalEstimatedCost)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-2xl font-semibold text-gray-900">{plan.status}</p>
            </div>
          </div>

          {isDraft && (
            <p className="text-sm text-gray-600">
              {readiness.productsPlanned} of {readiness.productsRequired} products are ready for confirmation.
            </p>
          )}

          {(plan.items || []).map((item) => {
            const itemWarnings = warningByProduct[String(item.productId)] || [];
            return (
              <div key={String(item.productId)} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.productNameSnapshot}</h3>
                    <p className="text-sm text-gray-600">Required: {item.requiredQuantity}</p>
                  </div>
                  {isDraft && (
                    <button
                      type="button"
                      onClick={() => openSupplierPicker(item)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      {item.supplierId ? 'Change Supplier' : 'Choose Supplier'}
                    </button>
                  )}
                </div>

                {item.supplierId ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <p><span className="text-gray-500">Supplier:</span> {item.supplierNameSnapshot}</p>
                    <p><span className="text-gray-500">Price:</span> {formatMoney(item.supplierPriceSnapshot)}</p>
                    <p><span className="text-gray-500">MOQ:</span> {item.supplierMoqSnapshot}</p>
                    <p><span className="text-gray-500">Estimated:</span> {formatMoney(item.estimatedCost)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-amber-700">No eligible supplier selected.</p>
                )}

                {item.additionalQuantity > 0 && (
                  <p className="text-xs text-gray-500">
                    Required: {item.requiredQuantity} · Planned: {item.plannedQuantity} · Additional: {item.additionalQuantity}
                  </p>
                )}

                {isDraft && item.supplierId && (
                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Planned Quantity</label>
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        step="1"
                        value={qtyDraft[String(item.productId)] ?? ''}
                        onChange={(e) => setQtyDraft({ ...qtyDraft, [String(item.productId)]: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => saveQuantity(item)}
                      className="px-3 py-2.5 text-sm border rounded-lg disabled:opacity-50"
                    >
                      Save Quantity
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => refreshPrice(item)}
                      className="px-3 py-2.5 text-sm border rounded-lg disabled:opacity-50"
                    >
                      Refresh Price
                    </button>
                  </div>
                )}

                {itemWarnings.map((warning) => (
                  <p key={`${warning.type}-${warning.message}`} className="text-sm text-amber-800">{warning.message}</p>
                ))}
              </div>
            );
          })}

          {isDraft && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => patchPlan({ syncDemand: true }, 'Demand refreshed from current orders.')}
                className="px-4 py-2.5 text-sm border rounded-lg disabled:opacity-50"
              >
                Refresh Demand
              </button>
              <button
                type="button"
                disabled={actionLoading || !readiness.canConfirm}
                onClick={() => setConfirmOpen(true)}
                className="px-4 py-2.5 text-sm bg-emerald-600 text-white rounded-lg disabled:opacity-50"
              >
                Confirm Plan
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={cancelPlan}
                className="px-4 py-2.5 text-sm border border-red-200 text-red-700 rounded-lg disabled:opacity-50"
              >
                Cancel Plan
              </button>
            </div>
          )}

          {isConfirmed && (
            <p className="text-sm text-gray-600">
              Confirmed plan is read-only. No supplier request was sent.
            </p>
          )}
        </div>
      )}

      <Modal
        isOpen={Boolean(supplierItem)}
        onClose={() => setSupplierItem(null)}
        title={`Choose Supplier${supplierItem ? ` — ${supplierItem.productNameSnapshot}` : ''}`}
        size="lg"
      >
        {supplierItem && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Required: {supplierItem.requiredQuantity}</p>
            {supplierLoading ? (
              <p className="text-sm text-gray-500">Loading supplier options...</p>
            ) : selectableOptions.length === 0 ? (
              <p className="text-sm text-gray-500">No eligible suppliers with a current price.</p>
            ) : (
              selectableOptions.map((option) => (
                <div key={option.supplierId} className="border border-gray-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{option.supplierName}</p>
                    <p className="text-sm text-gray-600">
                      {formatMoney(option.currentSupplierPrice)} · MOQ {option.minimumOrderQuantity}
                    </p>
                    {option.isLowestPrice && (
                      <span className="inline-flex mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Lowest Price
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => selectSupplier(option)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Procurement Plan">
        {plan && (
          <div className="space-y-3 text-sm">
            <p>Date: {plan.procurementDate}</p>
            <p>Products: {readiness.productsPlanned} / {readiness.productsRequired}</p>
            <p>Estimated Purchase Cost: {formatMoney(plan.totalEstimatedCost)}</p>
            <p className="text-gray-600">
              This confirms the internal procurement plan. No supplier request will be sent yet.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setConfirmOpen(false)} className="px-4 py-2.5 border rounded-lg">Cancel</button>
              <button type="button" disabled={actionLoading} onClick={confirmPlan} className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg disabled:opacity-50">
                Confirm Procurement Plan
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ProcurementPlan;
