import React, { useState } from 'react';
import { useDelivery } from '../hooks/useDelivery.js';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import RouteMap from '../components/RouteMap.jsx';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Package, 
  CheckCircle2, 
  Clock, 
  Navigation,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  RefreshCcw,
  Calendar,
  DollarSign,
  Map as MapIcon,
  X
} from 'lucide-react';

const DeliveryPage = () => {
  const { deliveries, loading, error, updateDeliveryStatus, fetchDeliveries } = useDelivery();
  const [isUpdating, setIsUpdating] = useState({});
  const [activeRoute, setActiveRoute] = useState(null);

  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];
  const activeDeliveries = safeDeliveries.filter(d => d.status !== 'DELIVERED');
  const completedDeliveries = safeDeliveries.filter(d => d.status === 'DELIVERED');

  const activeCount = activeDeliveries.length;
  const completedToday = completedDeliveries.length;
  const earningsToday = completedToday * 50; // Simple simulation

  const handleOpenMaps = (address) => {
    if (!address) return;
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
  };

  const handleCallCustomer = (phone) => {
    if (!phone) return;
    window.open(`tel:${phone}`, '_self');
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      setIsUpdating(prev => ({ ...prev, [id]: true }));
      await updateDeliveryStatus(id, status);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading && safeDeliveries.length === 0) {
    return (
      <div className="p-8 bg-gray-50/50 min-h-screen flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-600 animate-bounce">
          <Truck size={40} />
        </div>
        <p className="text-xl font-black text-gray-400 animate-pulse">Syncing delivery routes...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 min-h-screen">
      {/* Header Section */}
      <div className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-12 bg-blue-600 rounded-full hidden md:block"></div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">
            Delivery <span className="text-blue-600">Command</span>
          </h1>
          <p className="text-gray-500 font-bold mt-2 flex items-center gap-2">
            <Clock size={18} className="text-blue-500 animate-pulse" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button 
          onClick={fetchDeliveries} 
          disabled={loading}
          variant="secondary"
          className="h-14 px-8 rounded-2xl flex items-center justify-center gap-3 bg-white/70 backdrop-blur-xl border-2 border-white shadow-xl hover:shadow-blue-200/50 transition-all font-black group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <RefreshCcw size={20} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-700 text-blue-600`} />
          <span className="relative z-10 text-gray-700">{loading ? "Syncing..." : "Refresh Queue"}</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
        <Card className="p-8 border-2 border-white bg-white/40 backdrop-blur-2xl hover:bg-white/60 transition-all duration-500 group relative overflow-hidden shadow-xl shadow-blue-900/5">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:scale-110 transition-transform duration-700">
            <Truck size={120} />
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform duration-500">
              <Truck size={28} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">Live Queue</span>
          </div>
          <h3 className="text-5xl font-black text-gray-900 tracking-tighter mb-1">{activeCount}</h3>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Shipments</p>
        </Card>

        <Card className="p-8 border-2 border-white bg-white/40 backdrop-blur-2xl hover:bg-white/60 transition-all duration-500 group relative overflow-hidden shadow-xl shadow-emerald-900/5">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:scale-110 transition-transform duration-700">
            <CheckCircle2 size={120} />
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
              <CheckCircle2 size={28} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">Success Rate</span>
          </div>
          <h3 className="text-5xl font-black text-gray-900 tracking-tighter mb-1">{completedToday}</h3>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivered Today</p>
        </Card>

        <Card className="p-8 border-2 border-white bg-white/40 backdrop-blur-2xl hover:bg-white/60 transition-all duration-500 group relative overflow-hidden shadow-xl shadow-amber-900/5 sm:col-span-2 lg:col-span-1">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:scale-110 transition-transform duration-700">
            <DollarSign size={120} />
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-500">
              <DollarSign size={28} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">Payout</span>
          </div>
          <h3 className="text-5xl font-black text-gray-900 tracking-tighter mb-1">₹{earningsToday.toLocaleString()}</h3>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Earnings</p>
        </Card>
      </div>

      {error && (
        <Card className="mb-10 bg-rose-50/50 backdrop-blur-xl border-2 border-rose-100 p-6 rounded-[2.5rem] flex items-center gap-6 text-rose-600 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 className="font-black text-xl">System Synchronization Error</h4>
            <p className="font-bold text-sm text-rose-500/80 uppercase tracking-wide mt-1">{error}</p>
          </div>
        </Card>
      )}

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b-2 border-gray-100 pb-6">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center border border-gray-50">
              <Calendar size={24} className="text-blue-600" />
            </div>
            Active Schedule
          </h2>
          <div className="hidden sm:flex items-center gap-3">
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>

        {activeDeliveries.length === 0 && !loading ? (
          <Card className="text-center py-24 bg-white/30 backdrop-blur-xl border-4 border-dashed border-white rounded-[4rem] shadow-2xl shadow-gray-200/20">
            <div className="w-32 h-32 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-10 text-white shadow-2xl shadow-emerald-200 animate-in zoom-in duration-700">
              <CheckCircle2 size={56} />
            </div>
            <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Day's Work Done!</h3>
            <p className="text-gray-400 font-bold max-w-sm mx-auto mb-12 text-lg leading-relaxed uppercase tracking-wide">
              All routes cleared. Stand by for new assignments.
            </p>
            <Button onClick={fetchDeliveries} className="h-16 px-12 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all">
              Re-Scan Network
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {activeDeliveries.map((delivery) => (
              <Card key={delivery._id} className="group overflow-hidden bg-white/60 backdrop-blur-2xl border-2 border-white shadow-2xl shadow-gray-200/50 hover:shadow-blue-200/30 transition-all duration-700 rounded-[3rem] flex flex-col">
                <div className="p-8 border-b border-white flex flex-wrap items-center justify-between bg-white/40 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-2xl uppercase">
                      TRK-{delivery.orderId?._id?.slice(-6).toUpperCase() || delivery._id?.slice(-6).toUpperCase()}
                    </div>
                    <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                      delivery.status === 'OUT_FOR_DELIVERY' 
                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-200' 
                        : 'bg-white text-gray-600 border-gray-100'
                    }`}>
                      {delivery.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-50">
                      <Clock size={14} className="text-blue-500" />
                    </div>
                    {delivery.createdAt ? new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP'}
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10 flex-1">
                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Recipient Profile</p>
                      <h4 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{delivery.customerName || 'Premium B2B Partner'}</h4>
                      <button 
                        onClick={() => handleCallCustomer(delivery.phone)} 
                        className="flex items-center gap-4 text-gray-600 hover:text-blue-600 font-black transition-all group/call bg-white/50 p-3 pr-6 rounded-2xl border border-white hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5"
                      >
                        <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 group-hover/call:scale-110 transition-transform">
                          <Phone size={16} />
                        </div>
                        <span className="text-sm tracking-widest">{delivery.phone || '+91 98765 43210'}</span>
                      </button>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Logistics Specs</p>
                      <div className="flex items-center gap-4 text-gray-600 font-black bg-white/50 px-5 py-4 rounded-[2rem] w-full border border-white shadow-inner">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Package size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 uppercase tracking-widest leading-none mb-1">Load Size</p>
                          <span className="text-sm tracking-wide">{delivery.orderId?.items?.length || 5} Heavy Items Verified</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Target Location</p>
                      <button 
                        onClick={() => handleOpenMaps(delivery.address)} 
                        className="flex items-start gap-4 text-gray-600 hover:text-blue-600 font-black transition-all group/map bg-white/50 p-5 rounded-[2rem] border border-white hover:border-blue-100 w-full text-left"
                      >
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-inner group-hover/map:bg-blue-600 group-hover/map:text-white transition-all">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="text-sm leading-relaxed line-clamp-2 tracking-tight">{delivery.address || 'Loading destination address...'}</p>
                          <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-2 block group-hover:translate-x-1 transition-transform">Launch Navigation →</span>
                        </div>
                      </button>
                    </div>

                    <div className="pt-4 space-y-3">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Route Execution</p>
                      {delivery.status === 'ASSIGNED' && (
                        <Button 
                          onClick={() => handleUpdateStatus(delivery._id, 'OUT_FOR_DELIVERY')}
                          disabled={isUpdating[delivery._id]}
                          className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                          {isUpdating[delivery._id] ? <RefreshCcw size={18} className="animate-spin" /> : <Navigation size={18} />}
                          Initiate Transit
                        </Button>
                      )}
                      {delivery.status === 'OUT_FOR_DELIVERY' && (
                        <div className="flex flex-col gap-3">
                          <Button 
                            onClick={() => handleUpdateStatus(delivery._id, 'DELIVERED')}
                            disabled={isUpdating[delivery._id]}
                            className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                          >
                            {isUpdating[delivery._id] ? <RefreshCcw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                            Confirm Handover
                          </Button>
                          <Button 
                            variant="secondary"
                            onClick={() => setActiveRoute(delivery.route || [
                              { lat: 12.9716, lng: 77.5946, address: "Warehouse A (Origin)" },
                              { lat: 12.9800, lng: 77.6000, address: "Transit Hub B" },
                              { lat: 12.9900, lng: 77.6100, address: delivery.address || "Customer Location (Final)" }
                            ])}
                            className="w-full h-14 rounded-2xl bg-white border-2 border-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                          >
                            <MapIcon size={16} className="text-blue-500" />
                            Live Route Intelligence
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Route Intelligence Modal */}
      {activeRoute && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setActiveRoute(null)}></div>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setActiveRoute(null)}
              className="absolute right-6 top-6 z-10 p-3 bg-white/20 hover:bg-white/40 text-white rounded-2xl backdrop-blur-xl transition-all border border-white/20"
            >
              <X size={24} />
            </button>
            <RouteMap route={activeRoute} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPage;
