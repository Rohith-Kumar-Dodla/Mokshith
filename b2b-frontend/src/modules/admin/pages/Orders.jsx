import { useEffect, useState, useCallback } from "react";
import { useOrder } from "../../order/hooks/useOrder";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import OrderStatusBadge from "../../order/components/OrderStatusBadge";
import { orderService } from "../../order/services/orderService";
import { 
  Package, 
  Search, 
  Filter, 
  RefreshCcw, 
  Calendar, 
  User as UserIcon, 
  CreditCard, 
  ArrowRight,
  ChevronRight,
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  ClipboardList
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../../routes/routeConfig";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const navigate = useNavigate();

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrders();
      const data = response.data || response;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (isUpdating[orderId]) return;
    
    try {
      setIsUpdating(prev => ({ ...prev, [orderId]: true }));
      await orderService.updateOrderStatus(orderId, newStatus);
      await fetchAllOrders();
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setIsUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} />;
      case 'CONFIRMED': return <CheckCircle2 size={16} />;
      case 'PROCESSING': return <RefreshCcw size={16} className="animate-spin-slow" />;
      case 'PACKED': return <PackageCheck size={16} />;
      case 'OUT_FOR_DELIVERY': return <Truck size={16} />;
      case 'DELIVERED': return <CheckCircle2 size={16} />;
      case 'CANCELLED': return <XCircle size={16} />;
      default: return <ClipboardList size={16} />;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-10 py-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-4">
        <div>
          <div className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
              <ClipboardList size={32} />
            </div>
            Order <span className="text-blue-600">Management</span>
          </div>
          <div className="text-gray-500 font-bold mt-4 text-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Monitor and fulfill business transactions across the platform
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="secondary" 
            onClick={fetchAllOrders}
            className="h-16 px-8 rounded-2xl flex items-center gap-3 font-black border-2 border-gray-100 hover:bg-white hover:border-blue-100 hover:text-blue-600 shadow-sm transition-all active:scale-95"
          >
            <RefreshCcw size={22} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            Refresh List
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-100 bg-red-50/50 p-6 rounded-[2rem] shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4 text-red-600 font-black">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle size={24} />
            </div>
            {error}
          </div>
        </Card>
      )}

      <div className="grid gap-8">
        {orders.length > 0 ? (
          orders.map((order) => (
            <Card 
              key={order._id} 
              className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white border border-gray-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group relative overflow-hidden"
            >
              {/* Status Ribbon (Top Right) */}
              <div className="absolute top-0 right-0 p-6 flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Received On</span>
                  <div className="flex items-center gap-2 text-xs font-black text-gray-700 bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 backdrop-blur-sm">
                    <Calendar size={14} className="text-blue-500" />
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Section 1: Business Identity (3 cols) */}
                <div className="xl:col-span-3 space-y-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="px-4 py-1.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 border border-blue-500">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        ID: {order._id?.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-[2rem] border border-gray-100 group-hover:border-blue-100 transition-all duration-500 shadow-sm">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-blue-600 border border-gray-100 group-hover:scale-105 transition-transform">
                        <UserIcon size={28} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl font-black text-gray-900 leading-tight truncate">{order.userId?.name || 'Anonymous Business'}</p>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Certified Partner</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-500">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <Search size={14} className="text-gray-400" />
                        </div>
                        <p className="text-xs font-bold truncate">{order.userId?.email}</p>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <RefreshCcw size={14} className="text-gray-400" />
                        </div>
                        <p className="text-xs font-bold">{order.userId?.phone || 'No Contact Info'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Order Contents (4 cols) - Improved manifest items UI */}
                <div className="xl:col-span-4 bg-gray-50/40 p-8 rounded-[2.5rem] border border-gray-100 group-hover:bg-white group-hover:border-blue-100 transition-all duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Manifest Items</div>
                        <div className="text-xs font-black text-gray-900">{order.items?.length || 0} Products Included</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {Array.isArray(order.items) && order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-white border border-gray-100 group-hover:border-blue-50 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-black border border-blue-100">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-black text-gray-800 block truncate">{item.name}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU-{item._id?.slice(-4).toUpperCase() || 'PROD'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</span>
                          <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 whitespace-nowrap">
                            × {item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <button 
                        onClick={() => navigate(`${routes.ORDERS}/${order._id}`)}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white/50 hover:bg-white rounded-2xl border border-dashed border-gray-200 hover:border-blue-300 transition-all group/more"
                      >
                        <p className="text-[10px] font-black text-gray-400 group-hover:text-blue-600 uppercase tracking-[0.2em]">
                          + {order.items.length - 3} more inventory items
                        </p>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 3: Financials (2 cols) */}
                <div className="xl:col-span-2 space-y-8">
                  <div>
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
                      <CreditCard size={16} className="text-blue-500" />
                      Financial Info
                    </div>
                    
                    <div className="space-y-6">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Grand Total</span>
                        <div className="text-4xl font-black text-gray-900 tracking-tighter flex items-baseline gap-1">
                          <span className="text-xl">₹</span>
                          {order.totalAmount?.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Method</span>
                          <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg">{order.paymentMethod}</span>
                        </div>
                        <div className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm ${
                          order.paymentStatus === 'PAID' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                            : 'bg-rose-50 border-rose-100 text-rose-600'
                        }`}>
                          <span className="text-[10px] font-black uppercase">Status</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{order.paymentStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Lifecycle Controls (3 cols) */}
                <div className="xl:col-span-3 flex flex-col justify-end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <RefreshCcw size={14} className="text-blue-500" />
                        Status Lifecycle
                      </div>
                    </div>
                    
                    <div className="relative group/select">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600 z-10 bg-white p-1.5 rounded-xl shadow-sm border border-blue-50 pointer-events-none">
                        {getStatusIcon(order.status)}
                      </div>
                      <select 
                        disabled={isUpdating[order._id]}
                        className="w-full h-16 pl-16 pr-10 rounded-[1.25rem] border-2 border-gray-100 bg-white text-xs font-black text-gray-700 appearance-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer disabled:opacity-50 shadow-sm uppercase tracking-widest text-center"
                        style={{ textAlignLast: 'center' }}
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                      >
                        <option value="PENDING">Pending Approval</option>
                        <option value="CONFIRMED">Confirm Order</option>
                        <option value="PROCESSING">Start Processing</option>
                        <option value="PACKED">Ready for Pickup</option>
                        <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="DELIVERED">Mark Delivered</option>
                        <option value="CANCELLED">Cancel Order</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover/select:text-blue-500 transition-colors">
                        <ChevronRight size={20} className="rotate-90" />
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate(`${routes.ORDERS}/${order._id}`)}
                      className="w-full h-16 rounded-[1.25rem] bg-blue-600 text-white hover:bg-blue-700 font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-200 border-none group/btn"
                    >
                      Inspect Details
                      <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-50 rounded-full opacity-0 group-hover:opacity-50 transition-all duration-700 pointer-events-none scale-0 group-hover:scale-100"></div>
            </Card>
          ))

        ) : (
          <div className="mt-20">
            <Card className="text-center py-24 border-2 border-dashed border-gray-200 bg-white/50 rounded-[3rem]">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <ClipboardList size={64} className="text-gray-300" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">No Active Orders</h2>
              <p className="text-gray-500 font-bold max-w-sm mx-auto text-lg leading-relaxed">
                We couldn't find any orders matching your criteria. Try refreshing the list or check back later.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
