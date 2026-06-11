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
  ClipboardList,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../../routes/routeConfig";
import './AdminShared.css';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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
      case 'PENDING': return <Clock size={14} />;
      case 'CONFIRMED': return <CheckCircle2 size={14} />;
      case 'PROCESSING': return <RefreshCcw size={14} className="animate-spin-slow" />;
      case 'PACKED': return <PackageCheck size={14} />;
      case 'OUT_FOR_DELIVERY': return <Truck size={14} />;
      case 'DELIVERED': return <CheckCircle2 size={14} />;
      case 'CANCELLED': return <XCircle size={14} />;
      default: return <ClipboardList size={14} />;
    }
  };

  const filteredOrders = orders.filter(order => 
    order._id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner"></div>
      <p>Synchronizing global orders...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">Order Management</h1>
          <p className="page-subtitle">Track and fulfill platform-wide wholesale transactions</p>
        </div>
        <Button 
          variant="secondary" 
          onClick={fetchAllOrders}
          className="flex items-center gap-2 h-11"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh Data</span>
        </Button>
      </div>

      <div className="table-controls">
        <div className="table-search">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Order ID or Customer Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <Filter size={18} />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order Details</th>
                <th>Enterprise Client</th>
                <th>Inventory</th>
                <th>Financials</th>
                <th>Fulfillment Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black rounded uppercase tracking-wider">
                          #{order._id?.slice(-8).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                          <Calendar size={12} />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                          {order.userId?.name?.charAt(0) || 'B'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{order.userId?.name || 'Wholesale Partner'}</div>
                          <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">B2B CLIENT</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
                          <Package size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {order.items?.length || 0} <small className="text-slate-400 font-black">SKUs</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <div className="text-sm font-black text-slate-900">₹{order.totalAmount?.toLocaleString()}</div>
                        <div className={`text-[9px] font-black uppercase tracking-tighter ${order.paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {order.paymentStatus} • {order.paymentMethod}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        <div className="relative group/select">
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 z-10">
                            {getStatusIcon(order.status)}
                          </div>
                          <select 
                            disabled={isUpdating[order._id]}
                            className="w-full h-8 pl-8 pr-6 rounded-lg border border-slate-100 bg-white text-[10px] font-black text-slate-700 appearance-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer uppercase tracking-widest shadow-sm hover:border-slate-200"
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
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button 
                        size="small"
                        onClick={() => navigate(`${routes.ORDERS}/${order._id}`)}
                        className="h-9 px-4 rounded-lg bg-slate-900 text-white hover:bg-blue-600 transition-all"
                      >
                        <ArrowRight size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardList size={48} opacity={0.1} />
                      <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No transactions recorded</p>
                    </div>
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
