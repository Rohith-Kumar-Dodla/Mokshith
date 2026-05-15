import { useEffect, useState } from "react";
import { useOrder } from "../hooks/useOrder";
import { useAuth } from "../../auth/hooks/useAuth";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { useNavigate } from "react-router-dom";
import { routes } from "../../../routes/routeConfig";
import { ORDER_STATUS } from "../../../utils/constants";
import { useSocket } from "../../../context/SocketContext";
import { useNotification } from "../../../context/NotificationContext";
import { 
  Package, 
  ChevronRight, 
  FileText, 
  RefreshCcw, 
  Calendar, 
  Clock, 
  ArrowRight,
  ExternalLink,
  ShoppingBag,
  History,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { orderService } from "../services/orderService";

const OrdersPage = () => {
  const { orders, loading, error, fetchOrders, addToCart } = useOrder(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { on } = useSocket();
  const { showToast } = useNotification();
  const [actionLoading, setActionLoading] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  
  // Filtering & Sorting State
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month, year
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest, lowest

  useEffect(() => {
    // 📡 Real-time Updates: Payment Success
    const offPayment = on('payment:success', (data) => {
      showToast(`Order #${data.orderId} paid successfully!`, 'success');
      if (fetchOrders) fetchOrders();
    });

    // 🚚 Real-time Updates: Delivery Assigned
    const offDelivery = on('delivery:assigned', (data) => {
      showToast(`Delivery agent assigned for Order #${data.orderId}`, 'info');
      if (fetchOrders) fetchOrders();
    });

    return () => {
      if (offPayment) offPayment();
      if (offDelivery) offDelivery();
    };
  }, [on, showToast, fetchOrders]);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        if (loading && retryCount < 2) {
          fetchOrders();
          setRetryCount(prev => prev + 1);
        }
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [loading, retryCount, fetchOrders]);

  const handleDownloadInvoice = async (orderId) => {
    setActionLoading(prev => ({ ...prev, [orderId + '_invoice']: true }));
    try {
      await orderService.downloadInvoice(orderId);
      showToast("Invoice downloaded successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId + '_invoice']: false }));
    }
  };

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    
    order.items.forEach(item => {
      addToCart({
        ...item,
        id: item.productId || item.id || item._id
      });
    });
    
    showToast(`${order.items.length} items added to cart`, "success");
    navigate(routes.CART || '/cart');
  };

  if (loading && retryCount < 2) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 gap-8">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xl text-gray-500 font-semibold">Fetching your orders...</p>
    </div>
  );
  
  if (error || (loading && retryCount >= 2)) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center p-8">
        <div className="text-6xl mb-8">⚠️</div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Oops! Something went wrong</h2>
        <p className="text-gray-500 mb-10">{error || "We're having trouble loading your orders. Please try again."}</p>
        <div className="flex gap-4">
          <Button onClick={() => { setRetryCount(0); fetchOrders(); }} className="flex-1">Try Again</Button>
          <Button variant="secondary" onClick={() => navigate(routes.DASHBOARD || '/')} className="flex-1">Go to Dashboard</Button>
        </div>
      </Card>
    </div>
  );

  const filteredOrders = Array.isArray(orders) ? orders
    .filter(order => order.status !== ORDER_STATUS.FAILED)
    .filter(order => {
      if (timeFilter === 'all') return true;
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return orderDate >= weekAgo;
      }
      if (timeFilter === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return orderDate >= monthAgo;
      }
      if (timeFilter === 'year') {
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        return orderDate >= yearAgo;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'highest') return (b.totalAmount || 0) - (a.totalAmount || 0);
      if (sortBy === 'lowest') return (a.totalAmount || 0) - (b.totalAmount || 0);
      return 0;
    })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 py-10 flex justify-center">
      <div className="w-full max-w-7xl px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Order History</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Manage your enterprise inventory transactions</p>
          </div>
          <Button 
            onClick={() => navigate(routes.PRODUCTS)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-blue-100 transition-all uppercase active:scale-95"
          >
            <ShoppingBag size={20} />
            New Purchase
          </Button>
        </div>

        {/* Filters & Sorting Section */}
        <div className="flex flex-wrap items-center gap-4 mb-8 bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <Filter size={16} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Period:</span>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-900 uppercase tracking-tight focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <ArrowUpDown size={16} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort By:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-900 uppercase tracking-tight focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Value</option>
              <option value="lowest">Lowest Value</option>
            </select>
          </div>

          <div className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {filteredOrders.length} Transactions
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card className="text-center py-24 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
              <Package size={40} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] mb-8 text-sm">No transaction history found</p>
            <Button 
              onClick={() => navigate(routes.PRODUCTS)}
              className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-xs tracking-widest uppercase"
            >
              Start Procurement
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {filteredOrders.map((order) => (
              <Card 
                key={order._id || order.id} 
                className="bg-white border-slate-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 rounded-[2rem] overflow-hidden shadow-sm"
              >
                {/* Order Header: Professional & Robust */}
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reference ID</p>
                      <p className="text-sm font-black text-slate-900 uppercase">#{ (order._id || order.id)?.slice(-8).toUpperCase() }</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date Authenticated</p>
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                        <Calendar size={14} className="text-blue-600" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Final Valuation</p>
                      <p className="text-2xl font-black text-blue-600 tracking-tighter">
                        ₹{(order.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Preview: Clean Grid */}
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {(order.items || []).slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform flex-shrink-0">
                            <Package size={22} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity} units</p>
                          </div>
                        </div>
                        <p className="text-xs font-black text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <div className="flex items-center justify-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        + {order.items.length - 4} more items in manifest
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Standardized & Professional */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      className="flex-1 h-14 rounded-xl border-2 border-slate-100 bg-white font-black text-[10px] text-slate-600 uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98]"
                      onClick={() => navigate(`${routes.ORDERS}/${order._id || order.id}`)}
                    >
                      View Manifest
                      <ExternalLink size={16} />
                    </button>
                    <button 
                      disabled={actionLoading[(order._id || order.id) + '_invoice']}
                      className="flex-1 h-14 rounded-xl border-2 border-slate-100 bg-white font-black text-[10px] text-slate-600 uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
                      onClick={() => handleDownloadInvoice(order._id || order.id)}
                    >
                      <FileText size={16} />
                      {actionLoading[(order._id || order.id) + '_invoice'] ? 'Generating...' : 'Download Invoice'}
                    </button>
                    <button 
                      className="flex-1 h-14 rounded-xl bg-blue-600 font-black text-[10px] text-white uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                      onClick={() => handleReorder(order)}
                    >
                      <RefreshCcw size={16} />
                      Rapid Reorder
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
