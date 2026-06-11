import React from 'react';
import { FiCheck, FiClock, FiPackage, FiTruck, FiMapPin, FiCheckCircle } from 'react-icons/fi';

const TimelineTracker = ({ currentStatus }) => {
  const steps = [
    { key: 'assigned', label: 'Order Assigned', icon: FiPackage },
    { key: 'accepted', label: 'Accepted', icon: FiCheck },
    { key: 'picked_up', label: 'Picked Up', icon: FiClock },
    { key: 'out_for_delivery', label: 'Out For Delivery', icon: FiTruck },
    { key: 'delivered', label: 'Delivered', icon: FiCheckCircle }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStatus?.toLowerCase());
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6">Delivery Timeline</h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-4 sm:space-y-6">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            const Icon = step.icon;

            return (
              <div key={step.key} className="relative flex items-start gap-3 sm:gap-4">
                {/* Icon Circle */}
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${
                  isCompleted ? 'bg-green-500 border-green-500' :
                  isCurrent ? 'bg-blue-500 border-blue-500' :
                  'bg-white border-gray-300'
                }`}>
                  <Icon 
                    size={16}
                    className={
                      isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                    }
                  />
                </div>

                {/* Content */}
                <div className="flex-1 pt-1 sm:pt-2">
                  <p className={`text-xs sm:text-sm font-medium ${
                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs sm:text-sm text-blue-600 mt-1">In Progress</p>
                  )}
                  {isCompleted && (
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
