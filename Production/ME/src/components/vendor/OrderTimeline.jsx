import React from 'react';
import { FiCheck, FiClock, FiPackage, FiTruck, FiHome } from 'react-icons/fi';

const OrderTimeline = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  const getStepIcon = (status) => {
    switch (status) {
      case 'Order Placed':
        return <FiCheck className="w-5 h-5" />;
      case 'Order Confirmed':
        return <FiCheck className="w-5 h-5" />;
      case 'Packed':
        return <FiPackage className="w-5 h-5" />;
      case 'Dispatched':
        return <FiTruck className="w-5 h-5" />;
      case 'Out for Delivery':
        return <FiTruck className="w-5 h-5" />;
      case 'Delivered':
        return <FiHome className="w-5 h-5" />;
      default:
        return <FiClock className="w-5 h-5" />;
    }
  };

  const currentStepIndex = timeline.findIndex(step => !step.completed);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Order Timeline</h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200">
          <div
            className="absolute top-0 left-0 w-full bg-blue-600 transition-all duration-500"
            style={{
              height: `${currentStepIndex === -1 ? 100 : (currentStepIndex / timeline.length) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {timeline.map((step, index) => (
            <div key={index} className="relative flex items-start gap-4">
              {/* Step Icon */}
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  step.completed
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : index === currentStepIndex
                    ? 'bg-white border-blue-600 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {step.completed ? (
                  <FiCheck className="w-4 h-4" />
                ) : (
                  getStepIcon(step.status)
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.status}
                  </h4>
                  {step.date && (
                    <span className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-600'}`}>
                      {step.date}
                    </span>
                  )}
                </div>
                {index === currentStepIndex && !step.completed && (
                  <p className="text-sm text-blue-600 font-medium">In Progress</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;
