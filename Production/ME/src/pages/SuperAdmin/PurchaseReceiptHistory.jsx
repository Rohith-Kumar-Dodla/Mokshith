import React, { useMemo } from 'react';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function PurchaseReceiptHistory({ request }) {
  const rows = useMemo(() => {
    const history = [];
    (request?.items || []).forEach((item) => {
      (item.receipts || []).forEach((receipt) => {
        history.push({
          key: `${item.productId}-${receipt._id || receipt.receivedAt}`,
          date: receipt.receivedAt,
          productName: item.productNameSnapshot,
          quantity: receipt.quantity,
          notes: receipt.notes,
        });
      });
    });
    return history.sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }, [request]);

  if (!rows.length) {
    return <p className="text-sm text-gray-500">No goods received yet.</p>;
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">Qty</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-gray-100">
              <td className="px-3 py-2">{formatDate(row.date)}</td>
              <td className="px-3 py-2">{row.productName}</td>
              <td className="px-3 py-2">{row.quantity}</td>
              <td className="px-3 py-2">{row.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PurchaseReceiptHistory;
