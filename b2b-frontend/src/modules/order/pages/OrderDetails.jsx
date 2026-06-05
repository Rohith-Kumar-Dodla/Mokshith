import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "../hooks/useOrder";
import { orderService } from "../services/orderService";
import { useNotification } from "../../../context/NotificationContext";
import { routes } from "../../../routes/routeConfig";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { getProductImage } from "../../../utils/imageHelper.js";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CreditCard, 
  Calendar, 
  FileText,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Printer,
  XCircle,
  HelpCircle,
  Download,
  Phone
} from "lucide-react";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const data = await orderService.getOrderById(id);
        setOrder(data);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrderDetails();
  }, [id]);

  const handleDownloadInvoice = async () => {
    try {
      setDownloading(true);
      await orderService.downloadInvoice(id);
      showToast("Invoice downloaded successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Retrieving Order...</p>
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full text-center p-10 rounded-3xl border-none shadow-xl bg-white">
        <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
          <XCircle size={40} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h3>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          {error || "The requested order manifest could not be retrieved from the server."}
        </p>
        <Button onClick={() => navigate(-1)} className="w-full h-14 rounded-xl bg-blue-600 font-bold text-white">Return to Orders</Button>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 flex justify-center">
      <div className="w-full max-w-7xl px-4 md:px-8">
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <button 
              onClick={() => navigate(routes.ORDERS)}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest transition-colors mb-1"
            >
              <ArrowLeft size={16} /> Back to Order History
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order #{order._id.slice(-8).toUpperCase()}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Authenticated: {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="h-12 px-6 rounded-xl flex items-center gap-2 border-2 border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 uppercase tracking-widest transition-all"
            >
              <Download size={18} />
              {downloading ? 'Processing...' : 'Invoice'}
            </Button>
            <Button 
              className="h-12 px-6 rounded-xl flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all"
              onClick={() => window.print()}
            >
              <Printer size={18} />
              Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Main Content Area: 70% width */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Items Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Package size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Inventory Payload</h3>
                </div>
                <div className="px-4 py-1.5 bg-white rounded-lg text-xs font-black text-slate-600 uppercase tracking-widest border border-slate-200 shadow-sm">
                  {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-6 min-w-0">
                      <div className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm group-hover:scale-105 transition-transform duration-500">
                        <img 
                          src={getProductImage(item)} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=100&q=80";
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-2xl leading-tight mb-2 truncate uppercase tracking-tight">{item.name}</p>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <span className="text-sm font-black text-slate-500 uppercase tracking-widest">
                            Quantity: <span className="text-slate-900">{item.quantity} units</span>
                          </span>
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden md:block"></span>
                          <span className="text-sm font-black text-slate-500 uppercase tracking-widest">
                            Rate: <span className="text-slate-900">₹{(item.price || 0).toLocaleString()}</span>
                          </span>
                          {item.discountPercent > 0 && (
                            <>
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden md:block"></span>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {item.discountPercent}% Bulk Discount
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Value</p>
                      <p className="font-black text-slate-900 text-3xl tracking-tighter">₹{((item.finalPrice || item.price) * item.quantity).toLocaleString()}</p>
                      {item.discountAmount > 0 && (
                        <p className="text-[10px] font-bold text-slate-400 line-through">₹{(item.price * item.quantity).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Breakdown - Ultra Visible */}
              <div className="p-8 bg-slate-900 text-white">
                <div className="flex flex-col md:flex-row justify-between gap-10 items-center md:items-end">
                  <div className="w-full md:w-auto space-y-4">
                    <div className="flex justify-between md:justify-start md:gap-12 items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] min-w-[150px]">Net Valuation</span>
                      <span className="text-xl font-bold text-white">₹{(order.totalAmount / 1.18).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between md:justify-start md:gap-12 items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] min-w-[150px]">Corporate GST (18%)</span>
                      <span className="text-xl font-bold text-white">₹{(order.totalAmount - (order.totalAmount / 1.18)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto pt-8 md:pt-0 border-t md:border-t-0 border-white/10 flex flex-row md:flex-col justify-between items-center md:items-end gap-4">
                    <div className="text-left md:text-right">
                      <span className="text-xs font-black text-blue-400 uppercase tracking-[0.3em]">Grand Total Value</span>
                      <p className="text-6xl font-black text-white tracking-tighter leading-none mt-2">₹{order.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-500/10">
                      Payment Settled
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Tracking - High Density */}
            {order.shipmentId && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
                      <Truck size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Logistics Manifest</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Manifest ID: #{order.shipmentId.slice(-12).toUpperCase()}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(`${routes.SHIPMENT_TRACKING.replace(':id', order.shipmentId)}`)}
                    className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-3"
                  >
                    Live Tracking <ExternalLink size={18} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area: 30% width */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Delivery Destination Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <MapPin size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Destination Details</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Recipient Entity</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">{order.shippingAddress?.fullName || 'Business Partner'}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Delivery Coordinates</p>
                  <div className="text-slate-700 font-bold text-sm leading-relaxed space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p>{order.shippingAddress?.addressLine1}</p>
                    {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p className="text-slate-900 font-black text-base mt-2">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Communications</p>
                  <div className="flex items-center gap-2 text-blue-600 font-black text-sm px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                    <Phone size={16} />
                    <span>{order.shippingAddress?.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settlement Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <CreditCard size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Settlement Summary</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Method</p>
                    <p className="text-base font-black text-slate-900 uppercase tracking-tight">{order.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <div className={`text-xs font-black px-4 py-1.5 rounded-lg uppercase tracking-widest border ${
                      order.paymentStatus === 'PAID' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {order.paymentStatus}
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Verified Value</span>
                    <ShieldCheck size={20} className="text-blue-500" />
                  </div>
                  <p className="text-4xl font-black text-white tracking-tighter leading-none">₹{order.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Support Terminal - Ultra Compact */}
            <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl">
                    <HelpCircle size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-widest leading-tight">Support Terminal</h3>
                </div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                  Active manifest assistance. Command center is online 24/7.
                </p>
                <Button 
                  onClick={() => navigate(routes.HELP)}
                  className="w-full h-14 bg-white text-slate-900 hover:bg-blue-600 hover:text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-xl"
                >
                  Open Support Ticket
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
