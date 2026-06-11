import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiDownload, FiEye, FiPrinter, FiFilter } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import StatusBadge from '../../components/vendor/StatusBadge';
import { vendorInvoices } from '../../data';

const Invoices = () => {
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredInvoices = filterStatus === 'all'
    ? vendorInvoices
    : vendorInvoices.filter(invoice => invoice.status === filterStatus);

  const statusCounts = {
    all: vendorInvoices.length,
    paid: vendorInvoices.filter(i => i.status === 'paid').length,
    pending: vendorInvoices.filter(i => i.status === 'pending').length,
    refunded: vendorInvoices.filter(i => i.status === 'refunded').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Invoices & Billing"
        subtitle="View and download your invoices."
        actions={
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <FiFilter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              <span className="sm:hidden">Filter</span>
            </button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(statusCounts).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 sm:px-4 py-2 h-10 sm:h-12 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    <Link
                      to={`/vendor/invoices/${invoice.id}`}
                      className="font-medium text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
                    >
                      {invoice.id}
                    </Link>
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-6">
                    <Link
                      to={`/vendor/orders/${invoice.orderId}`}
                      className="font-medium text-gray-900 hover:text-blue-600 text-xs sm:text-sm"
                    >
                      {invoice.orderId}
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
                      <button
                        className="p-2 min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <FiDownload className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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

        {filteredInvoices.length === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-xs sm:text-sm text-gray-600">No invoices found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
