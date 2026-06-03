import React, { useState, useMemo } from 'react';
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
  CheckCircle2, 
  Navigation, 
  Package,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Activity,
  Shield,
  PhoneCall,
  AlertTriangle,
  ChevronRight,
  MoreVertical,
  Calendar,
  RefreshCcw,
  Star
} from 'lucide-react';

const LogisticsPage = () => {
  const navigate = useNavigate();
  const { 
    deliveryQueue, 
    history, 
    loading, 
    error, 
    acceptDelivery, 
    startDelivery, 
    markDelivered,
    fetchDeliveryQueue
  } = useLogistics();

  const [activeTab, setActiveTab] = useState('available');
  const [searchQuery, setSearchQuery] = useState('');

  const safeQueue = Array.isArray(deliveryQueue) ? deliveryQueue : [];
  const safeHistory = Array.isArray(history) ? history : [];

  const stats = useMemo(() => {
    return {
      available: safeQueue.filter(d => d.status === 'PENDING').length,
      assigned: safeQueue.filter(d => d.status === 'ACCEPTED').length,
      inTransit: safeQueue.filter(d => d.status === 'OUT_FOR_DELIVERY').length,
      deliveredToday: safeHistory.filter(d => {
        const deliveredDate = new Date(d.deliveredAt).toDateString();
        return deliveredDate === new Date().toDateString();
      }).length,
      earnings: safeHistory.length * 450 // Mock calculation
    };
  }, [safeQueue, safeHistory]);

  const filteredDeliveries = useMemo(() => {
    let list = [];
    if (activeTab === 'available') list = safeQueue.filter(d => d.status === 'PENDING');
    else if (activeTab === 'assigned') list = safeQueue.filter(d => d.status === 'ACCEPTED');
    else if (activeTab === 'transit') list = safeQueue.filter(d => d.status === 'OUT_FOR_DELIVERY');
    else if (activeTab === 'delivered') list = safeHistory;

    if (!searchQuery) return list;
    
    return list.filter(d => 
      (d.orderId?._id || d._id)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.address || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [safeQueue, safeHistory, activeTab, searchQuery]);

  const handleOpenMap = (address) => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleCall = (phone) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 md:px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Operations Control</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Delivery Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={fetchDeliveryQueue} 
              disabled={loading}
              className="h-10 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm rounded-lg flex items-center gap-2"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate(routes.DELIVERY_HISTORY)}
              className="h-10 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-lg flex items-center gap-2 shadow-sm shadow-sky-500/20"
            >
              <Clock size={16} />
              History
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Available', value: stats.available, icon: Package, color: 'sky' },
            { label: 'Assigned', value: stats.assigned, icon: ClipboardCheck, color: 'sky' },
            { label: 'In Transit', value: stats.inTransit, icon: Truck, color: 'sky' },
            { label: 'Delivered', value: stats.deliveredToday, icon: CheckCircle2, color: 'sky' },
            { label: 'Earnings', value: `₹${stats.earnings}`, icon: DollarSign, color: 'sky' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Main Operational Area */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-6">
            {/* Tabs & Search */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex p-1 bg-slate-50 rounded-lg w-fit overflow-x-auto">
                  {[
                    { id: 'available', label: 'Available', count: stats.available },
                    { id: 'assigned', label: 'Assigned', count: stats.assigned },
                    { id: 'transit', label: 'In Transit', count: stats.inTransit },
                    { id: 'delivered', label: 'Delivered', count: stats.deliveredToday },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                          ? 'bg-white text-sky-600 shadow-sm border border-slate-100' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
                
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by ID, Customer or Address..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* List */}
              <div className="p-4 md:p-6">
                {filteredDeliveries.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Package size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No Orders Found</h3>
                    <p className="text-sm text-slate-500">There are no orders in this category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredDeliveries.map((delivery) => (
                      <div key={delivery._id} className="bg-white border border-slate-200 rounded-xl p-6 hover:border-sky-200 transition-colors">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 bg-slate-100 text-[10px] font-black text-slate-600 rounded uppercase tracking-widest border border-slate-200">
                                ID: {(delivery.orderId?._id || delivery._id).slice(-8).toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                                delivery.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                                delivery.status === 'ACCEPTED' ? 'bg-sky-50 text-sky-600' :
                                'bg-emerald-50 text-emerald-600'
                              }`}>
                                {delivery.status?.replace(/_/g, ' ')}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Clock size={12} />
                                {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-lg font-black text-slate-900 mb-1">{delivery.customerName || 'Business Client'}</h4>
                              <div className="flex items-start gap-2 text-slate-500">
                                <MapPin size={16} className="mt-0.5 shrink-0 text-sky-500" />
                                <p className="text-sm font-medium leading-relaxed">{delivery.address || 'Address Details N/A'}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                                  <Package size={14} />
                                </div>
                                <span className="text-xs font-bold text-slate-700">{delivery.orderId?.items?.length || 0} Units</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                                  <DollarSign size={14} />
                                </div>
                                <span className="text-xs font-bold text-slate-900 uppercase">COD: ₹{(delivery.orderId?.totalAmount || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 md:w-48 justify-center">
                            {delivery.status === 'PENDING' && (
                              <Button 
                                onClick={() => acceptDelivery(delivery._id)}
                                className="w-full h-10 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-sm shadow-sky-500/20"
                              >
                                Accept Order
                              </Button>
                            )}
                            {delivery.status === 'ACCEPTED' && (
                              <Button 
                                onClick={() => startDelivery(delivery._id)}
                                className="w-full h-10 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-widest rounded-lg"
                              >
                                Start Delivery
                              </Button>
                            )}
                            {delivery.status === 'OUT_FOR_DELIVERY' && (
                              <Button 
                                onClick={() => markDelivered(delivery._id)}
                                className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-lg"
                              >
                                Mark Delivered
                              </Button>
                            )}
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                onClick={() => handleCall(delivery.customerPhone)}
                                className="h-10 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center"
                              >
                                <Phone size={16} />
                              </Button>
                              <Button 
                                onClick={() => handleOpenMap(delivery.address)}
                                className="h-10 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center"
                              >
                                <Navigation size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-4 space-y-6">
            {/* Performance Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-sky-500" />
                Performance Metrics
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Success Rate</span>
                  <span className="text-sm font-black text-emerald-600">98.2%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[98%]"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Avg. Time</p>
                    <p className="text-sm font-black text-slate-900">22 Mins</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-black text-slate-900">4.9</p>
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispatch Center */}
            <div className="bg-sky-500 rounded-xl p-6 text-white shadow-lg shadow-sky-500/20 group relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <PhoneCall size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-black mb-1 tracking-tight">Dispatch Support</h3>
                <p className="text-sky-100 text-xs font-bold opacity-80 mb-6 uppercase tracking-widest">24/7 Operational Hub</p>
                
                <div className="space-y-2">
                  <Button className="w-full h-11 bg-white text-sky-600 hover:bg-sky-50 font-black text-xs uppercase tracking-widest rounded-lg border-0 shadow-md">
                    Call Dispatcher
                  </Button>
                  <Button className="w-full h-11 bg-sky-600/50 hover:bg-sky-600/70 text-white font-black text-xs uppercase tracking-widest rounded-lg border border-sky-400/30">
                    Report Issue
                  </Button>
                </div>
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-rose-600 mb-2">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Safety Advisory</span>
              </div>
              <p className="text-xs font-bold text-rose-500/80 leading-relaxed">
                Heavy traffic reported on Western Express Highway. Expect delays of 15-20 minutes for Zone 4 deliveries.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
};

const ClipboardCheck = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

export default LogisticsPage;
