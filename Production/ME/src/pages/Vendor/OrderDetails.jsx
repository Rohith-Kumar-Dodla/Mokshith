import React, { useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiPrinter, FiTruck, FiMapPin, FiPhone, FiDollarSign } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import OrderTimeline from '../../components/vendor/OrderTimeline';
import StatusBadge from '../../components/vendor/StatusBadge';
import BankTransferDetails from '../../components/vendor/BankTransferDetails';
import PaymentProofForm from '../../components/vendor/PaymentProofForm';
import { useOrderDetails } from '../../hooks/useOrders';
import { useBankTransferProof } from '../../hooks/useBankTransfer';
import orderService from '../../services/orderService';

const OrderDetails = () => {
  const { id } = useParams();
  const { loading, error, order } = useOrderDetails(id);
  const isBankTransfer =
    order?.paymentMethod === 'BANK_TRANSFER' ||
    (order?.backendStatus === 'PENDING_PAYMENT' && order?.paymentStatus === 'pending');
  const {
    proof,
    bankDetails,
    orderInfo,
    loading: proofLoading,
    reload: reloadProof,
  } = useBankTransferProof(isBankTransfer ? id : null);
  const [invoiceError, setInvoiceError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleDownloadInvoice = async () => {
    if (!order?.id) return;

    setInvoiceError('');
    try {
      const response = await orderService.downloadInvoice(order.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setInvoiceError(
        getUserFacingErrorMessage(downloadError, 'Failed to download invoice')
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getBankTransferPaymentLabel = () => {
    if (proof?.rawStatus === 'APPROVED') return 'approved';
    if (proof?.rawStatus === 'REJECTED' || order?.paymentStatus === 'rejected') return 'rejected';
    if (proof?.rawStatus === 'PENDING') return 'pending_verification';
    return order?.paymentStatus || 'pending';
  };

  const canSubmitProof =
    isBankTransfer &&
    order?.backendStatus === 'PENDING_PAYMENT' &&
    (!proof || proof.rawStatus === 'REJECTED');

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-sm text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h2>
        {error && <p className="text-sm text-gray-600 mb-4">{error}</p>}
        <Link to="/vendor/orders" className="text-blue-600 hover:text-blue-700">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <Link
        to="/vendor/orders"
        className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <PageHeader
        title={`Order ${order.orderNumber}`}
        subtitle={`Placed on ${order.orderDate}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Download Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiPrinter className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        }
      />

      {invoiceError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {invoiceError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Status</h2>
              <StatusBadge status={order.status} />
            </div>
            <OrderTimeline timeline={order.timeline} />
          </div>

          {isBankTransfer && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiDollarSign className="w-5 h-5" />
                  Bank Transfer Payment
                </h2>
                {canSubmitProof && (
                  <Link
                    to={`/vendor/orders/${order.id}/payment`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Submit Payment
                  </Link>
                )}
              </div>

              {proofLoading ? (
                <p className="text-sm text-gray-600">Loading payment proof...</p>
              ) : (
                <div className="space-y-4">
                  <BankTransferDetails bankDetails={bankDetails} amount={orderInfo?.amount ?? order.amount} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Verification Status</p>
                      <StatusBadge status={getBankTransferPaymentLabel()} />
                    </div>
                    {proof?.utrNumber && (
                      <div>
                        <p className="text-gray-500">UTR Number</p>
                        <p className="font-medium text-gray-900 font-mono">{proof.utrNumber}</p>
                      </div>
                    )}
                  </div>

                  {proof?.rawStatus === 'REJECTED' && proof.rejectionReason && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <p className="font-semibold mb-1">Rejection Reason</p>
                      <p>{proof.rejectionReason}</p>
                    </div>
                  )}

                  {proof?.rawStatus === 'PENDING' && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                      Your payment proof is pending admin verification.
                    </div>
                  )}

                  {canSubmitProof && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        {proof?.rawStatus === 'REJECTED' ? 'Resubmit Payment Proof' : 'Submit Payment Proof'}
                      </h3>
                      <PaymentProofForm
                        orderId={order.id}
                        onSuccess={async () => {
                          await reloadProof();
                          showToast('success', 'Payment proof submitted successfully');
                        }}
                      />
                    </div>
                  )}

                  {proof?.screenshot && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Payment Screenshot</p>
                      <a
                        href={proof.screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View uploaded proof
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Products Ordered</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Product</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Unit Price</th>
                    <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{item.productName}</p>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">{item.quantity}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">₹{item.unitPrice.toFixed(2)}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">₹{item.subtotal.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm font-semibold text-gray-900">
                      Total
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-sm sm:text-base font-bold text-gray-900">
                      ₹{order.amount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Delivery Information</h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Delivery Address</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{order.address}</p>
                </div>
              </div>
              {order.deliveryPartner && (
                <>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <FiTruck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Delivery Partner</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{order.deliveryPartner}</p>
                    </div>
                  </div>
                  {order.deliveryPartnerPhone && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FiPhone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Contact Number</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{order.deliveryPartnerPhone}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">₹{order.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium text-green-600">FREE</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between">
                <span className="text-sm sm:text-base font-semibold text-gray-900">Total</span>
                <span className="text-lg sm:text-xl font-bold text-gray-900">₹{order.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Payment Information</h2>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Payment Method</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  {order.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : order.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Payment Status</p>
                {isBankTransfer ? (
                  <StatusBadge status={getBankTransferPaymentLabel()} />
                ) : (
                  <StatusBadge status={order.paymentStatus} />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Invoice Information</h2>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Invoice ID</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">{order.invoiceId}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Order Date</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">{order.orderDate}</p>
              </div>
              {order.deliveryDate && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Delivery Date</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{order.deliveryDate}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
