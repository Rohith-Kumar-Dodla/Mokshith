import { useState } from 'react';
import { useAdminLogistics } from '../hooks/useAdminLogistics.js';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import { Truck, Clock, UserCheck, Activity, AlertCircle } from 'lucide-react';
import '../../admin/pages/AdminShared.css';

const AdminLogisticsPage = () => {
  const { queue, loading, error, refetch } = useAdminLogistics();
  const [activeTab, setActiveTab] = useState('pending');

  const tabs = [
    { id: 'pending', label: 'Pending Assignments', count: queue.pending?.length || 0, icon: Clock },
    { id: 'assigned', label: 'Assigned Deliveries', count: queue.assigned?.length || 0, icon: UserCheck },
    { id: 'all', label: 'All Active', count: queue.all?.length || 0, icon: Truck },
  ];

  const activeList = activeTab === 'pending' ? queue.pending : activeTab === 'assigned' ? queue.assigned : queue.all;

  if (loading && !queue.all?.length) {
    return <div className="admin-page-content py-16 text-center text-gray-500">Loading logistics queue...</div>;
  }

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">Logistics Queue</h1>
          <p className="page-subtitle">Monitor pending assignments and active deliveries</p>
        </div>
        <button onClick={refetch} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
          <Activity size={16} className="inline mr-2" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 text-red-600 py-8 justify-center">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {!activeList?.length ? (
        <EmptyState
          icon={Truck}
          title="No deliveries in queue"
          description="All deliveries have been assigned or completed."
        />
      ) : (
        <div className="space-y-4">
          {activeList.map((delivery) => (
            <div key={delivery._id} className="admin-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{delivery.customerName}</p>
                  <p className="text-sm text-gray-500 mt-1">{delivery.address}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Order: {delivery.orderId?._id || delivery.orderId} · {delivery.trackingNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    delivery.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    delivery.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {delivery.status?.replace(/_/g, ' ')}
                  </span>
                  {delivery.etaMinutes && (
                    <p className="text-xs text-gray-500 mt-2">ETA: {delivery.etaMinutes} min</p>
                  )}
                  {delivery.deliveryPartnerId?.name && (
                    <p className="text-xs text-gray-500 mt-1">Partner: {delivery.deliveryPartnerId.name}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLogisticsPage;
