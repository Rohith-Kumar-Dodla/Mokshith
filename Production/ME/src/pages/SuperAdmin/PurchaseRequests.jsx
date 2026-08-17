import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import PageHeader from '../../components/superadmin/PageHeader';
import SearchBar from '../../components/superadmin/SearchBar';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import ProcurementSubNav from './ProcurementSubNav';
import PurchaseRequestAcknowledgeModal from './PurchaseRequestAcknowledgeModal';
import PurchaseReceiptModal from './PurchaseReceiptModal';
import PurchaseReceiptHistory from './PurchaseReceiptHistory';
import superAdminService from '../../services/superAdminService';

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Partially Fulfilled', value: 'PARTIALLY_FULFILLED' },
  { label: 'Fulfilled', value: 'FULFILLED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const RECEIVABLE_STATUSES = ['ACKNOWLEDGED', 'PARTIALLY_FULFILLED'];
const CANCELLABLE_STATUSES = ['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED'];

const formatMoney = (value) => {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `₹${amount.toFixed(2)}`;
};

const formatStatusLabel = (status) => String(status || '').replace(/_/g, ' ').toLowerCase();

function PurchaseRequestDetails({ requestId, onClose, onChanged }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [ackOpen, setAckOpen] = useState(false);
  const [receiptItem, setReceiptItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.getPurchaseRequest(requestId);
      setRequest(response?.data ?? response);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to load purchase request'));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action) => {
    setActionLoading(true);
    setError('');
    try {
      if (action === 'submit') {
        await superAdminService.submitPurchaseRequest(requestId, {});
      } else {
        await superAdminService.cancelPurchaseRequest(requestId);
      }
      await load();
      onChanged?.();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Action failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledge = async (payload) => {
    setActionLoading(true);
    try {
      await superAdminService.acknowledgePurchaseRequest(requestId, payload);
      setAckOpen(false);
      await load();
      onChanged?.();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = async (payload) => {
    setActionLoading(true);
    try {
      await superAdminService.receivePurchaseRequest(requestId, payload);
      setReceiptItem(null);
      await load();
      onChanged?.();
    } finally {
      setActionLoading(false);
    }
  };

  const receivableItems = useMemo(
    () => (request?.items || []).filter((item) => Number(item.remainingQuantity) > 0),
    [request]
  );

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading purchase request...</p>;
  if (!request) return <p className="text-sm text-red-700 p-4">{error || 'Purchase request not found.'}</p>;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{request.purchaseRequestNumber}</h3>
          <p className="text-sm text-gray-600">{request.supplierNameSnapshot}</p>
        </div>
        <StatusBadge status={formatStatusLabel(request.status)} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div><span className="text-gray-500">Demand Date:</span> {request.demandDate}</div>
        <div><span className="text-gray-500">Total:</span> {formatMoney(request.totalEstimatedCost)}</div>
        {request.expectedDeliveryDate && (
          <div><span className="text-gray-500">Expected Delivery:</span> {request.expectedDeliveryDate}</div>
        )}
        {request.acknowledgedAt && (
          <div><span className="text-gray-500">Acknowledged:</span> {new Date(request.acknowledgedAt).toLocaleDateString('en-IN')}</div>
        )}
      </div>

      {request.supplierResponseNotes && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          <span className="font-medium">Supplier Response:</span> {request.supplierResponseNotes}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Demand</th>
              <th className="px-3 py-2">Purchase</th>
              <th className="px-3 py-2">Confirmed</th>
              <th className="px-3 py-2">Received</th>
              <th className="px-3 py-2">Remaining</th>
              <th className="px-3 py-2">Supplier Price</th>
              <th className="px-3 py-2">Supplier MOQ</th>
              <th className="px-3 py-2">Estimated</th>
            </tr>
          </thead>
          <tbody>
            {(request.items || []).map((item) => (
              <tr key={`${item.productId}-${item.supplierProductId}`} className="border-t border-gray-100">
                <td className="px-3 py-2">{item.productNameSnapshot}</td>
                <td className="px-3 py-2">{item.demandQuantity}</td>
                <td className="px-3 py-2">{item.purchaseQuantity}</td>
                <td className="px-3 py-2">{item.confirmedQuantity ?? '—'}</td>
                <td className="px-3 py-2">{item.receivedQuantity ?? 0}</td>
                <td className="px-3 py-2">{item.remainingQuantity ?? '—'}</td>
                <td className="px-3 py-2">{formatMoney(item.supplierPriceSnapshot)}</td>
                <td className="px-3 py-2">{item.supplierMOQSnapshot}</td>
                <td className="px-3 py-2">{formatMoney(item.estimatedSubtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {request.notes && <p className="text-sm text-gray-700">Notes: {request.notes}</p>}

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Receiving History</h4>
        <PurchaseReceiptHistory request={request} />
      </div>

      <div className="flex flex-wrap gap-2">
        {request.status === 'DRAFT' && (
          <>
            <button type="button" disabled={actionLoading} onClick={() => runAction('submit')} className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
              Submit Purchase Request
            </button>
            <button type="button" disabled={actionLoading} onClick={() => runAction('cancel')} className="px-4 py-2.5 text-sm border rounded-lg disabled:opacity-50">
              Cancel
            </button>
          </>
        )}
        {request.status === 'SUBMITTED' && (
          <>
            <button type="button" disabled={actionLoading} onClick={() => setAckOpen(true)} className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
              Acknowledge Request
            </button>
            <button type="button" disabled={actionLoading} onClick={() => runAction('cancel')} className="px-4 py-2.5 text-sm border rounded-lg disabled:opacity-50">
              Cancel Purchase Request
            </button>
          </>
        )}
        {RECEIVABLE_STATUSES.includes(request.status) && receivableItems.length > 0 && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => setReceiptItem(receivableItems[0])}
            className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Record Goods Received
          </button>
        )}
        {RECEIVABLE_STATUSES.includes(request.status) && receivableItems.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {receivableItems.slice(1).map((item) => (
              <button
                key={item.productId}
                type="button"
                disabled={actionLoading}
                onClick={() => setReceiptItem(item)}
                className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50"
              >
                Receive {item.productNameSnapshot}
              </button>
            ))}
          </div>
        )}
        {CANCELLABLE_STATUSES.includes(request.status) && request.status !== 'DRAFT' && request.status !== 'SUBMITTED' && (
          <button type="button" disabled={actionLoading} onClick={() => runAction('cancel')} className="px-4 py-2.5 text-sm border rounded-lg disabled:opacity-50">
            Cancel Purchase Request
          </button>
        )}
        <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm border rounded-lg">Close</button>
      </div>

      <PurchaseRequestAcknowledgeModal
        isOpen={ackOpen}
        onClose={() => setAckOpen(false)}
        request={request}
        onSubmit={handleAcknowledge}
        loading={actionLoading}
      />

      <PurchaseReceiptModal
        isOpen={Boolean(receiptItem)}
        onClose={() => setReceiptItem(null)}
        item={receiptItem}
        onSubmit={handleReceive}
        loading={actionLoading}
      />
    </div>
  );
}

function PurchaseRequests() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.listPurchaseRequests({
        search: searchTerm || undefined,
        status: statusFilter,
      });
      const payload = response?.data ?? response;
      setRows(payload?.purchaseRequests || []);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to load purchase requests'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const columns = useMemo(() => [
    { key: 'purchaseRequestNumber', label: 'PR Number' },
    { key: 'supplierNameSnapshot', label: 'Supplier' },
    {
      key: 'items',
      label: 'Items',
      render: (value) => (value || []).length,
    },
    {
      key: 'totalEstimatedCost',
      label: 'Cost',
      render: (value) => formatMoney(value),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={formatStatusLabel(value)} />,
    },
    {
      key: 'demandDate',
      label: 'Demand Date',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Link
          to={`/super-admin/procurement/purchase-requests/${row._id}`}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          View
        </Link>
      ),
    },
  ], []);

  if (id) {
    return (
      <div className="space-y-4">
        <PageHeader title="Purchase Request Details" subtitle="Review supplier-specific procurement request." />
        <ProcurementSubNav />
        <div className="bg-white border border-gray-200 rounded-xl">
          <PurchaseRequestDetails
            requestId={id}
            onClose={() => window.history.back()}
            onChanged={loadRows}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Purchase Requests"
        subtitle="Supplier-specific procurement requests created from demand."
        actions={(
          <Link
            to="/super-admin/procurement/purchase-requests/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <FiPlus size={16} />
            Create Purchase Request
          </Link>
        )}
      />
      <ProcurementSubNav />

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <SearchBar placeholder="Search PR number..." value={searchTerm} onSearch={setSearchTerm} />
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={statusFilter}
          onSelect={setStatusFilter}
          onClear={() => setStatusFilter('all')}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading purchase requests...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No purchase requests found.</p>
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </div>
    </div>
  );
}

export default PurchaseRequests;
export { PurchaseRequestDetails, formatMoney };
