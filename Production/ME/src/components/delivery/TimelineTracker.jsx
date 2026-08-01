import React from 'react';
import { FiCheck, FiClock, FiPackage, FiTruck, FiCheckCircle, FiCreditCard } from 'react-icons/fi';

const TimelineTracker = ({ currentStatus, isCod = false, paymentPaid = false }) => {
  const steps = [
    { key: 'assigned', label: 'Order Assigned', icon: FiPackage },
    { key: 'accepted', label: 'Accepted', icon: FiCheck },
    { key: 'picked_up', label: 'Picked Up', icon: FiClock },
    { key: 'out_for_delivery', label: 'Out For Delivery', icon: FiTruck },
    ...(isCod ? [{ key: 'payment_collected', label: 'Payment Collected', icon: FiCreditCard }] : []),
    { key: 'delivered', label: 'Delivered', icon: FiCheckCircle },
    { key: 'completed', label: 'Completed', icon: FiCheckCircle },
  ];

  const normalizedStatus = currentStatus?.toLowerCase();
  let currentStepIndex = steps.findIndex((step) => step.key === normalizedStatus);

  if (isCod && paymentPaid && normalizedStatus === 'out_for_delivery') {
    currentStepIndex = steps.findIndex((step) => step.key === 'payment_collected');
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6">Delivery Timeline</h3>

      <div className="relative">
        <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-4 sm:space-y-6">
          {steps.map((step, index) => {
            const isPaymentStep = step.key === 'payment_collected';
            const isCompleted =
              index < currentStepIndex ||
              (isPaymentStep && paymentPaid && ['delivered', 'completed', 'out_for_delivery'].includes(normalizedStatus) && index <= currentStepIndex) ||
              (isPaymentStep && paymentPaid && ['delivered', 'completed'].includes(normalizedStatus));
            const isCurrent = index === currentStepIndex && !(isPaymentStep && paymentPaid && normalizedStatus === 'out_for_delivery');
            const showCompleted = isCompleted || (isPaymentStep && paymentPaid && normalizedStatus === 'out_for_delivery');
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative flex items-start gap-3 sm:gap-4">
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${
                    showCompleted
                      ? 'bg-green-500 border-green-500'
                      : isCurrent
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                  }`}
                >
                  <Icon size={16} className={showCompleted || isCurrent ? 'text-white' : 'text-gray-400'} />
                </div>

                <div className="flex-1 pt-1 sm:pt-2">
                  <p
                    className={`text-xs sm:text-sm font-medium ${
                      showCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && !showCompleted && (
                    <p className="text-xs sm:text-sm text-blue-600 mt-1">In Progress</p>
                  )}
                  {showCompleted && (
                    <p className="text-xs sm:text-sm text-green-600 mt-1">Completed</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineTracker;
