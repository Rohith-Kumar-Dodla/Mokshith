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
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
              <ClipboardList size={32} />
            </div>
            Order <span className="text-blue-600">Management</span>
          </h1>
          <p className="text-gray-500 font-bold mt-4 text-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Monitor and fulfill business transactions across the platform
          </p>
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
              className="p-10 rounded-[3rem] border-none shadow-sm bg-white border border-gray-50 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 group relative overflow-hidden"
            >
              {/* Status Ribbon (Top Right) */}
              <div className="absolute top-0 right-0 p-8 flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Created At</span>
                  <div className="flex items-center gap-2 text-xs font-black text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <Calendar size={14} className="text-blue-500" />
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* Section 1: Business Identity (3 cols) */}
                <div className="xl:col-span-3 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100 whitespace-nowrap">
                      #{order._id?.slice(-8).toUpperCase()}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  
                  <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 group-hover:bg-white group-hover:border-blue-100 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-gray-50">
                        <UserIcon size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-black text-gray-900 leading-none truncate">{order.userId?.name || 'Anonymous Business'}</p>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">B2B Partner</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 flex items-center gap-2 truncate">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                        {order.userId?.email}
                      </p>
                      <p className="text-xs font-bold text-gray-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                        {order.userId?.phone || 'No Contact Info'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Order Contents (4 cols) */}
                <div className="xl:col-span-4 bg-gray-50/30 p-8 rounded-[2.5rem] border border-gray-100/50 relative group-hover:bg-white group-hover:border-blue-100 transition-all duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                      <Package size={16} className="text-blue-500" />
                      Manifest Items
                    </p>
                    <span className="text-[10px] font-black bg-white text-gray-900 px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                      {order.items?.length || 0} SKU
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {Array.isArray(order.items) && order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-white border border-gray-50 group-hover:border-blue-50 shadow-sm transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-black">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-black text-gray-700 truncate">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl whitespace-nowrap border border-blue-100">
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="flex items-center justify-center gap-2 py-3 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                          + {order.items.length - 3} additional inventory items
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Financials (2 cols) */}
                <div className="xl:col-span-2 space-y-6">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <CreditCard size={16} className="text-blue-500" />
                    Financial Info
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Grand Total</span>
                      <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{order.totalAmount?.toLocaleString()}</p>
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 group-hover:bg-white transition-all">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Method</span>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{order.paymentMethod}</span>
                      </div>
                      <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
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

                {/* Section 4: Lifecycle Controls (3 cols) */}
                <div className="xl:col-span-3 flex flex-col justify-end gap-4">
                  <div className="space-y-3">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3 mb-2">
                      <RefreshCcw size={14} className="text-blue-500" />
                      Status Lifecycle
                    </p>
                    
                    <div className="relative group/select">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 z-10 bg-white p-1 rounded-lg shadow-sm border border-blue-50">
                        {getStatusIcon(order.status)}
                      </div>
                      <select 
                        disabled={isUpdating[order._id]}
                        className="w-full h-14 pl-14 pr-10 rounded-2xl border-2 border-gray-100 bg-white text-xs font-black text-gray-700 appearance-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer disabled:opacity-50 shadow-sm uppercase tracking-widest"
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
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover/select:text-blue-500 transition-colors">
                        <ChevronRight size={20} className="rotate-90" />
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate(`${routes.ORDERS}/${order._id}`)}
                      className="w-full h-14 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm group/btn"
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
