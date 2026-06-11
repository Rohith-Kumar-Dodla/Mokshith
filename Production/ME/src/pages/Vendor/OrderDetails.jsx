import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiPrinter, FiTruck, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import OrderTimeline from '../../components/vendor/OrderTimeline';
import StatusBadge from '../../components/vendor/StatusBadge';
import { vendorOrders } from '../../data';

const OrderDetails = () => {
  const { id } = useParams();
  const order = vendorOrders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h2>
        <Link to="/vendor/orders" className="text-blue-600 hover:text-blue-700">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Button */}
      <Link
        to="/vendor/orders"
        className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Page Header */}
      <PageHeader
        title={`Order ${order.id}`}
        subtitle={`Placed on ${order.orderDate}`}
        actions={
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <FiDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Download Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </button>
            <button className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <FiPrinter className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Status</h2>
              <StatusBadge status={order.status} />
            </div>
            <OrderTimeline timeline={order.timeline} />
          </div>

          {/* Order Items */}
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

          {/* Delivery Information */}
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

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">₹{order.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">₹0.00</span>
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

          {/* Payment Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Payment Information</h2>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Payment Method</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Payment Status</p>
                <StatusBadge status={order.paymentStatus} />
              </div>
            </div>
          </div>

          {/* Invoice Information */}
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
