import React, { useState, useMemo } from 'react';
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
  X,
  Zap,
  Activity,
  Shield,
  Fuel,
  Award,
  ArrowUpRight,
  ClipboardCheck,
  Camera,
  Signature
} from 'lucide-react';

const DeliveryPage = () => {
  const { deliveries, loading, error, updateDeliveryStatus, fetchDeliveries } = useDelivery();
  const [isUpdating, setIsUpdating] = useState({});
  const [activeRoute, setActiveRoute] = useState(null);
  const [showPODModal, setShowPODModal] = useState(null);

  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];
  const activeDeliveries = useMemo(() => safeDeliveries.filter(d => d.status !== 'DELIVERED'), [safeDeliveries]);
  const activeCount = activeDeliveries.length;
  const completedToday = useMemo(() => safeDeliveries.filter(d => d.status === 'DELIVERED').length, [safeDeliveries]);
  const earningsToday = completedToday * 450; // Mock calculation

  const handleUpdateStatus = async (id, status) => {
    setIsUpdating(prev => ({ ...prev, [id]: true }));
    try {
      if (typeof updateDeliveryStatus === 'function') {
        await updateDeliveryStatus(id, status);
      } else {
        console.error("updateDeliveryStatus is not a function", updateDeliveryStatus);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCallCustomer = (phone) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleOpenMaps = (address) => {
    if (address) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
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
    <div className="p-4 md:p-8 lg:p-12 max-w-[1800px] mx-auto min-h-screen">
      {/* Top Intelligence Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Logistics Command
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Network Stable
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Operational <span className="text-blue-500">Intelligence</span>
          </h1>
          <p className="text-slate-400 font-bold mt-4 flex items-center gap-3 text-base">
            <Calendar size={18} className="text-blue-500" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={fetchDeliveries} 
            disabled={loading}
            className="h-14 px-8 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all font-black text-white flex items-center gap-4 group"
          >
            <RefreshCcw size={20} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-700 text-blue-400`} />
            <span className="text-sm">Refresh Stream</span>
          </Button>
        </div>
      </div>

      {/* Hero Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="rounded-[2rem] p-6 bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
            <Activity size={24} />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{activeCount}</h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Shipments</p>
        </div>

        <div className="rounded-[2rem] p-6 bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
            <Zap size={24} />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tighter mb-1">98.4%</h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">On-Time Rate</p>
        </div>

        <div className="rounded-[2rem] p-6 bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
            <DollarSign size={24} />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tighter mb-1">₹{earningsToday.toLocaleString()}</h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Daily Payout</p>
        </div>

        <div className="rounded-[2rem] p-6 bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] transition-all">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <Shield size={24} />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tighter mb-1">Tier 1</h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fleet Ranking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <h2 className="text-2xl font-black text-white flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Navigation size={20} className="text-white" />
            </div>
            Active Missions
          </h2>

          {activeDeliveries.length === 0 && !loading ? (
            <div className="rounded-[2.5rem] p-16 text-center bg-white/5 border border-white/10 border-dashed">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-400">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">All Routes Cleared</h3>
              <p className="text-slate-400 font-bold max-w-sm mx-auto text-base leading-relaxed uppercase tracking-wide">
                Stand by for new B2B assignments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activeDeliveries.map((delivery) => (
                <div key={delivery._id} className="rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden hover:bg-white/[0.07] transition-all group p-8">
                  <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-1.5 rounded-xl bg-white/10 text-blue-400 text-[10px] font-black tracking-widest uppercase border border-white/5">
                          REF: {delivery.orderId?._id?.slice(-6).toUpperCase() || delivery._id?.slice(-6).toUpperCase()}
                        </div>
                        <div className="px-4 py-1.5 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black tracking-widest uppercase border border-white/5">
                          {delivery.status?.replace('_', ' ')}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-2xl font-black text-white mb-2 tracking-tight">{delivery.customerName || 'Premium B2B Client'}</h4>
                        <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm font-bold">
                          <span className="flex items-center gap-2">
                            <Phone size={14} className="text-blue-500" />
                            {delivery.phone || 'N/A'}
                          </span>
                          <span className="flex items-center gap-2">
                            <Package size={14} className="text-indigo-400" />
                            {delivery.orderId?.items?.length || 0} Items
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <MapPin size={18} className="text-blue-500 mt-1 shrink-0" />
                        <p className="text-sm font-bold text-slate-300 leading-relaxed line-clamp-2">{delivery.address || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="lg:w-64 flex flex-col gap-3 justify-center">
                      <Button 
                        onClick={() => handleUpdateStatus(delivery._id, 'OUT_FOR_DELIVERY')}
                        className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                      >
                        <Zap size={16} />
                        Start Mission
                      </Button>
                      <Button 
                        onClick={() => setActiveRoute(delivery.route)}
                        className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2"
                      >
                        <MapIcon size={14} />
                        View Path
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-4 space-y-8">
          <h2 className="text-2xl font-black text-white flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            Fleet Status
          </h2>

          <div className="rounded-[2rem] p-8 bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 border border-indigo-500/20 backdrop-blur-xl">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Partner Performance</p>
            <div className="flex items-end gap-2 mb-6">
              <h3 className="text-5xl font-black text-white tracking-tighter">#04</h3>
              <span className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">In Network</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Reliability Score</span>
                <span className="text-emerald-400">9.8/10</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[98%]"></div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] p-8 bg-white/5 border border-white/10 backdrop-blur-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Live Logs</p>
            <div className="space-y-4">
              {[
                { time: '14:20', msg: 'Assigned to sector 7' },
                { time: '13:45', msg: 'Delivery completed #8821' },
                { time: '12:10', msg: 'Traffic delay Route 4' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-[10px] font-black text-slate-600 shrink-0">{log.time}</span>
                  <p className="text-xs font-bold text-slate-400">{log.msg}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] p-8 bg-blue-600 shadow-2xl shadow-blue-600/20 group relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform duration-700">
              <Phone size={100} />
            </div>
            <div className="relative z-10">
              <h4 className="text-xl font-black text-white mb-2 tracking-tight">Logistics Support</h4>
              <p className="text-blue-100 text-xs font-bold opacity-80 mb-6 uppercase tracking-widest leading-relaxed">
                24/7 Dedicated Dispatcher
              </p>
              <Button className="w-full h-12 bg-white text-blue-600 hover:bg-blue-50 font-black rounded-xl text-[10px] uppercase tracking-widest border-0 shadow-lg">
                Connect Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeRoute && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setActiveRoute(null)}></div>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setActiveRoute(null)}
              className="absolute right-6 top-6 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-xl transition-all border border-white/10"
            >
              <X size={24} />
            </button>
            <RouteMap route={activeRoute} />
          </div>
        </div>
      )}

      {/* Proof of Delivery (POD) Modal */}
      {showPODModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowPODModal(null)}></div>
          <div className="relative w-full max-w-lg bg-[#1E293B] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">POD Verification</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Digital Handover Protocol</p>
              </div>
              <button onClick={() => setShowPODModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                    <Camera size={32} />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Capture Goods</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="p-4 bg-indigo-500/20 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                    <Signature size={32} />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">E-Signature</span>
                </button>
              </div>
              
              <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-4 mb-4">
                  <Shield size={20} className="text-blue-400" />
                  <span className="text-sm font-black text-white">Compliance Check</span>
                </div>
                <p className="text-xs font-bold text-slate-400 leading-relaxed">
                  By finalizing this POD, you confirm that all logistics units have been verified by the recipient and the operation meets B2B quality standards.
                </p>
              </div>

              <Button 
                onClick={() => {
                  handleUpdateStatus(showPODModal._id, 'DELIVERED');
                  setShowPODModal(null);
                }}
                className="w-full h-16 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Confirm & Finalize Operation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPage;
