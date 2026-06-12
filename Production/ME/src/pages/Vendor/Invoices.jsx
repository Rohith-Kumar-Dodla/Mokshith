import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiDownload, FiEye, FiPrinter } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import StatusBadge from '../../components/vendor/StatusBadge';
import invoiceService from '../../services/invoiceService';
import orderService from '../../services/orderService';
import { mapBackendPaymentStatus } from '../../utils/orderMapper';

function mapInvoice(invoice) {
  const order = invoice.orderId;
  const orderId = typeof order === 'object' ? order._id || order.id : order;
  const paymentStatus = typeof order === 'object'
    ? mapBackendPaymentStatus(order.paymentStatus)
    : 'paid';

  return {
    id: invoice.invoiceNumber || invoice._id || invoice.id,
    orderId,
    invoiceDate: invoice.createdAt
      ? new Date(invoice.createdAt).toLocaleDateString('en-IN')
      : '—',
    grandTotal: Number(invoice.totalAmount || invoice.amount || 0),
    status: paymentStatus,
    fileUrl: invoice.fileUrl,
    raw: invoice,
  };
}

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await invoiceService.getInvoices();
      const list = payload?.data ?? payload;
      setInvoices((Array.isArray(list) ? list : []).map(mapInvoice));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = useMemo(() => invoices.filter((invoice) => {
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      String(invoice.id).toLowerCase().includes(term) ||
      String(invoice.orderId).toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  }), [invoices, filterStatus, searchTerm]);

  const statusCounts = useMemo(() => ({
    all: invoices.length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    pending: invoices.filter((i) => i.status === 'pending').length,
    failed: invoices.filter((i) => i.status === 'failed').length,
  }), [invoices]);

  const handleDownload = async (invoice) => {
    if (!invoice.orderId) return;
    setDownloadingId(invoice.id);
    try {
      const response = await orderService.downloadInvoice(invoice.orderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = async (invoice) => {
    await handleDownload(invoice);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Invoices & Billing"
        subtitle="View and download your invoices."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 space-y-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by invoice or order ID..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-2">
          {Object.keys(statusCounts).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 sm:px-4 py-2 h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-sm text-gray-600">Loading invoices...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Invoice ID</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Order ID</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-center py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <span className="font-medium text-blue-600 text-xs sm:text-sm">{invoice.id}</span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <Link
                        to={`/vendor/orders/${invoice.orderId}`}
                        className="font-medium text-gray-900 hover:text-blue-600 text-xs sm:text-sm"
                      >
                        {String(invoice.orderId).slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-600 text-xs sm:text-sm">{invoice.invoiceDate}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-right font-semibold text-gray-900 text-xs sm:text-sm">
                      ₹{invoice.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                      <StatusBadge status={invoice.status} size="sm" />
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <Link
                          to={`/vendor/orders/${invoice.orderId}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDownload(invoice)}
                          disabled={downloadingId === invoice.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Download PDF"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrint(invoice)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Print"
                        >
                          <FiPrinter className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredInvoices.length === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-xs sm:text-sm text-gray-600">No invoices found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
