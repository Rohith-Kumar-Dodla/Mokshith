import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { useMaintenanceMode } from '../../context/MaintenanceContext';

const MaintenanceBanner = () => {
  const { maintenanceMode, maintenanceMessage, loading } = useMaintenanceMode();

  if (loading || !maintenanceMode) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-start gap-3">
        <FiAlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="text-sm whitespace-pre-line">
          <p className="font-semibold">The platform is currently under maintenance.</p>
          <p className="mt-1">
            {maintenanceMessage ||
              'Browsing is available, but changes are temporarily disabled. Please try again later.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceBanner;
