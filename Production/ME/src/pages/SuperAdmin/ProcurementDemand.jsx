import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import PageHeader from '../../components/superadmin/PageHeader';
import DataTable from '../../components/superadmin/DataTable';
import ProcurementSubNav from './ProcurementSubNav';
import superAdminService from '../../services/superAdminService';

const pad = (value) => String(value).padStart(2, '0');

export const toDateInputValue = (date = new Date()) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
);

function ProcurementDemand() {
  const [date, setDate] = useState(() => toDateInputValue());
  const [demand, setDemand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    loadDemand(date);
  }, [date, loadDemand]);

  const columns = useMemo(() => [
    { key: 'productName', label: 'Product' },
    { key: 'requiredQuantity', label: 'Required Quantity' },
    { key: 'orderCount', label: 'Orders' },
  ], []);

  const products = demand?.products || [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Procurement Demand"
        subtitle="Live required quantities from existing customer orders. This does not create a purchase plan."
        actions={date ? (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/super-admin/procurement/purchase-requests/new?date=${date}`}
              className="inline-flex items-center px-4 py-2.5 min-h-[44px] bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              Create Purchase Request
            </Link>
            <Link
              to={`/super-admin/procurement/plans?date=${date}`}
              className="inline-flex items-center px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Plan Procurement
            </Link>
          </div>
        ) : null}
      />

      <ProcurementSubNav />

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-medium text-gray-700" htmlFor="procurement-date">
          Date
        </label>
        <input
          id="procurement-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Procurement date"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading procurement demand...</p>
      ) : demand ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Today's Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{demand.orderCount ?? 0}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Products Required</p>
              <p className="text-2xl font-semibold text-gray-900">{demand.productCount ?? 0}</p>
            </div>
          </div>

          {products.length === 0 ? (
            <p className="text-sm text-gray-500">No procurement demand for this date.</p>
          ) : (
            <DataTable columns={columns} data={products} />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default ProcurementDemand;
