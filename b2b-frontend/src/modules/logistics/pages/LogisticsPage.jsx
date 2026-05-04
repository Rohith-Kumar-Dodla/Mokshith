import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogistics } from '../hooks/useLogistics.js';
import { routes } from '../../../routes/routeConfig.js';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle, 
  Navigation, 
  Package,
  ArrowRight,
  History,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const statuses = {
    'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    'ACCEPTED': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Accepted' },
    'OUT_FOR_DELIVERY': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Out for Delivery' },
    'DELIVERED': { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
    'CANCELLED': { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
  };
  const { bg, text, label } = statuses[status] || statuses['PENDING'];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

const LogisticsPage = () => {
  const navigate = useNavigate();
  const { 
    deliveryQueue, 
    history, 
    loading, 
    error, 
    acceptDelivery, 
    startDelivery, 
    markDelivered 
  } = useLogistics();

  const safeQueue = Array.isArray(deliveryQueue) ? deliveryQueue : [];

  const handleOpenMap = (address) => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  if (loading && !safeQueue.length) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Logistics <span className="text-blue-500">Dashboard</span></h1>
          <p className="text-slate-400 font-medium mt-1">Real-time delivery management system</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate(routes.DELIVERY_HISTORY)} className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-12 px-6 rounded-xl font-bold flex items-center gap-2">
            <History size={18} />
            History
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20">
            <Truck size={18} />
            Tasks
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-400">
          <AlertCircle size={20} />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Main Column */}
        <div className="xl:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                <Clock size={20} />
              </div>
              Active Delivery Queue
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Updates</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {safeQueue.length === 0 ? (
              <div className="bg-white/5 border border-white/10 border-dashed rounded-[2.5rem] py-20 px-10 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                  <Truck size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No active deliveries</h3>
                <p className="text-slate-400 text-sm font-medium">Your delivery queue is currently empty.</p>
              </div>
            ) : (
              safeQueue.map((delivery) => (
                <div key={delivery._id} className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden hover:bg-white/[0.07] transition-all group">
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-widest border border-white/5">
                            #{delivery.orderId?.slice(-6).toUpperCase()}
                          </div>
                          <StatusBadge status={delivery.status} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Destination</p>
                            <p className="text-sm font-bold text-slate-300 leading-relaxed">
                              {typeof delivery.shippingAddress === 'object' 
                                ? `${delivery.shippingAddress.street || ''} ${delivery.shippingAddress.city || ''}, ${delivery.shippingAddress.state || ''}`.trim() || 'N/A'
                                : delivery.shippingAddress || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                            <Phone size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Customer Phone</p>
                            <p className="text-sm font-bold text-slate-300">{delivery.customerPhone || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 justify-center md:min-w-[200px]">
                      <Button 
                        variant="secondary" 
                        className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold flex items-center justify-center gap-2"
                        onClick={() => handleOpenMap(delivery.shippingAddress)}
                      >
                        <Navigation size={18} />
                        Navigation
                      </Button>
                      
                      {delivery.status === 'PENDING' && (
                        <Button 
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20"
                          onClick={() => acceptDelivery(delivery._id)}
                        >
                          Accept
                        </Button>
                      )}
                      
                      {delivery.status === 'ACCEPTED' && (
                        <Button 
                          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                          onClick={() => startDelivery(delivery._id)}
                        >
                          Start Trip
                        </Button>
                      )}
                      
                      {delivery.status === 'OUT_FOR_DELIVERY' && (
                        <Button 
                          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20"
                          onClick={() => markDelivered(delivery._id)}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="xl:col-span-4 space-y-8">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-500">
              <CheckCircle size={20} />
            </div>
            Recent History
          </h2>
          
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-6">
            <div className="space-y-4">
              {(() => {
                const safeHistory = Array.isArray(history) ? history : [];
                if (safeHistory.length === 0) {
                  return (
                    <div className="py-10 text-center">
                      <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">No history found</p>
                    </div>
                  );
                }
                return (
                  <>
                    {safeHistory.slice(0, 5).map((item) => (
                      <div key={item._id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">Order #{item.orderId?.slice(-6).toUpperCase()}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{new Date(item.deliveredAt).toLocaleDateString()}</p>
                        </div>
                        <ArrowRight size={16} className="text-slate-600" />
                      </div>
                    ))}
                    {safeHistory.length > 5 && (
                      <Button variant="secondary" className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold text-xs uppercase tracking-widest mt-2">
                        View Full History
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bg-blue-600 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform duration-700">
              <Phone size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight mb-2">Dispatcher Support</h3>
              <p className="text-blue-100 text-sm font-bold opacity-80 mb-6 leading-relaxed">
                Need assistance with a delivery? Our support team is active 24/7.
              </p>
              <Button className="w-full h-12 bg-white text-blue-600 hover:bg-blue-50 border-0 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">
                Call Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsPage;