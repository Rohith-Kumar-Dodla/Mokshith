import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDelivery } from '../hooks/useDelivery.js';
import { routes } from '../../../routes/routeConfig.js';
import Button from '../../../components/ui/Button.jsx';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Package, 
  CheckCircle2, 
  Clock, 
  Search,
  Filter,
  Calendar,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  MoreVertical,
  Download,
  ExternalLink,
  RefreshCcw,
  LayoutGrid,
  List
} from 'lucide-react';

const DeliveryHistoryPage = () => {
  const navigate = useNavigate();
  const { 
    deliveries, 
    loading, 
    fetchDeliveries
  } = useDelivery();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // grid or list

  const history = useMemo(() => deliveries?.completed || [], [deliveries]);

  const filteredHistory = useMemo(() => {
    let list = [...history];

    // Search filter
    if (searchQuery) {
      list = list.filter(d => 
        (d.orderId?._id || d._id)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.address || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      list = list.filter(d => {
        const dDate = new Date(d.deliveredAt).toDateString();
        if (dateFilter === 'today') return dDate === today.toDateString();
        if (dateFilter === 'yesterday') return dDate === yesterday.toDateString();
        return true;
      });
    }

    return list;
  }, [history, searchQuery, dateFilter]);

  const earningsSummary = useMemo(() => {
    return filteredHistory.length * 450;
  }, [filteredHistory]);

  if (loading && history.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <RefreshCcw size={40} className="text-sky-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Retrieving Logistics History...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 md:px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(routes.DELIVERY_DASHBOARD)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Delivery History</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archive & Settlement Records</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-sky-50 px-4 py-2 rounded-lg border border-sky-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-sky-600 shadow-sm">
                <DollarSign size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest leading-none mb-1">Total Earnings</p>
                <p className="text-sm font-black text-slate-900 leading-none">₹{earningsSummary.toLocaleString()}</p>
              </div>
            </div>
            <Button className="h-10 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-lg flex items-center gap-2 px-4">
              <Download size={16} />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, Customer, or Destination..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-200">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setDateFilter(filter.id)}
                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                      dateFilter === filter.id 
                        ? 'bg-white text-sky-600 shadow-sm border border-slate-100' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block"></div>

              <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-200">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}
                >
                  <List size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredHistory.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Clock size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Records Found</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">Adjust your search or filters to find specific delivery records.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Delivery Info</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer & Destination</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Metrics</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                              ID: {(d.orderId?._id || d._id).slice(-8).toUpperCase()}
                            </p>
                            <p className="text-xs font-bold text-slate-700">
                              {new Date(d.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-xs">
                          <p className="text-sm font-black text-slate-900 mb-1">{d.customerName || 'B2B Partner'}</p>
                          <p className="text-xs font-medium text-slate-500 line-clamp-1 truncate">{d.address}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Package size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-700">{d.orderId?.items?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-700">24m</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex flex-col items-end">
                          <p className="text-sm font-black text-slate-900 mb-1">₹{(d.orderId?.totalAmount || 0).toLocaleString()}</p>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-100">
                            PAID
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredHistory.map((d) => (
              <div key={d._id} className="bg-white rounded-xl border border-slate-200 p-6 hover:border-sky-200 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-slate-100 text-[10px] font-black text-slate-500 rounded uppercase tracking-widest border border-slate-200">
                      ID: {(d.orderId?._id || d._id).slice(-8).toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded uppercase tracking-widest border border-emerald-100">
                      DELIVERED
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-900">
                    <MoreVertical size={18} />
                  </button>
                </div>
                
                <h4 className="text-lg font-black text-slate-900 mb-1">{d.customerName || 'B2B Partner'}</h4>
                <div className="flex items-start gap-2 text-slate-500 mb-6">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-sky-500" />
                  <p className="text-xs font-medium leading-relaxed line-clamp-2">{d.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completion</p>
                    <p className="text-xs font-black text-slate-900">
                      {new Date(d.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Earnings</p>
                    <p className="text-sm font-black text-sky-600">₹450.00</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
};

export default DeliveryHistoryPage;
