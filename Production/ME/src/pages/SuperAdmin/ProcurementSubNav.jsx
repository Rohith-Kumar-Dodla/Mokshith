import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { label: 'Demand', path: '/super-admin/procurement/demand' },
  { label: 'Purchase Requests', path: '/super-admin/procurement/purchase-requests' },
  { label: 'Procurement Plans', path: '/super-admin/procurement/plans' },
];

function ProcurementSubNav() {
  const location = useLocation();

  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.path);
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium ${
              active
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default ProcurementSubNav;
