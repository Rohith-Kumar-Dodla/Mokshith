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

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Order Info</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Items</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Financials</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Lifecycle Status</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-blue-50/20 transition-colors group">
                    {/* Order Info */}
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="inline-block px-3 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                          #{order._id?.slice(-8).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <Calendar size={12} />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-blue-600 border border-gray-100 group-hover:scale-105 transition-transform">
                          <UserIcon size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black text-gray-900 truncate max-w-[150px]">{order.userId?.name || 'Anonymous Business'}</div>
                          <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">B2B Partner</div>
                        </div>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                          <Package size={16} />
                        </div>
                        <div className="text-xs font-black text-gray-700">
                          {order.items?.length || 0} <span className="text-gray-400 font-bold uppercase text-[10px]">SKUs</span>
                        </div>
                      </div>
                    </td>

                    {/* Financials */}
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="text-sm font-black text-gray-900 tracking-tight">₹{order.totalAmount?.toLocaleString()}</div>
                        <div className={`text-[9px] font-black uppercase tracking-widest ${order.paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {order.paymentStatus} • {order.paymentMethod}
                        </div>
                      </div>
                    </td>

                    {/* Lifecycle Status */}
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative w-full max-w-[180px]">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 z-10 pointer-events-none">
                            {getStatusIcon(order.status)}
                          </div>
                          <select 
                            disabled={isUpdating[order._id]}
                            className="w-full h-10 pl-10 pr-8 rounded-xl border border-gray-100 bg-white text-[10px] font-black text-gray-700 appearance-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer uppercase tracking-widest text-center shadow-sm"
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="PACKED">Packed</option>
                            <option value="OUT_FOR_DELIVERY">Shipping</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                            <ChevronRight size={14} className="rotate-90" />
                          </div>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-6 text-right">
                      <Button 
                        onClick={() => navigate(`${routes.ORDERS}/${order._id}`)}
                        className="h-10 px-6 rounded-xl bg-gray-900 text-white hover:bg-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ml-auto shadow-sm group/btn active:scale-95 transition-all"
                      >
                        Inspect
                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-24 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-gray-300">
                      <ClipboardList size={32} />
                    </div>
                    <div className="text-xl font-black text-gray-900 tracking-tight">No Active Orders</div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">The verification queue is clear</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
