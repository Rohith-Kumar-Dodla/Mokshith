import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "../hooks/useOrder";
import { orderService } from "../services/orderService";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CreditCard, 
  Calendar, 
  FileText,
  MapPin,
  Clock,
  ExternalLink
} from "lucide-react";
import { useNotification } from "../../../context/NotificationContext";
import { routes } from "../../../routes/routeConfig";

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
    <div className="min-h-screen flex items-center justify-center bg-[#fbfcfd]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-blue-200"></div>
        <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Loading Order Dossier</p>
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fbfcfd]">
      <Card className="max-w-md w-full text-center p-12 rounded-[3rem] shadow-2xl border-none">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500">
          <XCircle size={48} />
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Order Not Found</h3>
        <p className="text-gray-500 font-bold mb-10 leading-relaxed uppercase text-xs tracking-widest">{error || "The requested order manifest could not be retrieved from the server."}</p>
        <Button onClick={() => navigate(-1)} className="w-full h-16 rounded-2xl bg-blue-600 font-black uppercase tracking-widest text-sm">Return to Command</Button>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbfcfd] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-gray-400 hover:text-blue-600 font-black uppercase tracking-widest text-xs mb-10 transition-all group"
        >
          <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:border-blue-100 transition-all">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          Back to Terminal
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-12">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none">
                Order <span className="text-blue-600">#{order._id.slice(-8).toUpperCase()}</span>
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-3 text-gray-500 font-bold">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <Calendar size={18} />
              </div>
              <p className="text-sm">
                Authenticated on {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="h-16 px-10 rounded-[1.5rem] flex items-center gap-4 border-2 border-gray-100 bg-white hover:border-blue-600 hover:text-blue-600 font-black uppercase tracking-widest text-xs shadow-sm transition-all active:scale-95"
          >
            <FileText size={22} />
            {downloading ? 'Processing...' : 'Download Invoice'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            {/* Items Card */}
            <Card className="overflow-hidden border-none shadow-sm rounded-[3rem] bg-white">
              <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                    <Package size={24} />
                  </div>
                  Inventory Payload
                </h3>
                <span className="text-xs font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-full border border-blue-100 uppercase tracking-widest">
                  {order.items.length} Units
                </span>
              </div>
              <div className="p-4">
                {order.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-6 m-2 flex items-center justify-between rounded-[2rem] hover:bg-gray-50/50 transition-all border border-transparent hover:border-gray-100 group"
                  >
                    <div className="flex items-center gap-6 min-w-0">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                        <Package size={32} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-black text-gray-900 leading-tight truncate mb-1">{item.name}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</span>
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                            × {item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subtotal</p>
                      <p className="text-xl font-black text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-10 bg-gray-50/50 border-t border-gray-100">
                <div className="max-w-md ml-auto space-y-4">
                  <div className="flex justify-between items-center text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                    <span>Base Valuation</span>
                    <span className="text-gray-900">₹{(order.totalAmount / 1.18).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                    <span>Service Tax (18%)</span>
                    <span className="text-gray-900">₹{(order.totalAmount - (order.totalAmount / 1.18)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-2xl font-black text-gray-900 pt-6 border-t border-gray-200">
                    <span className="uppercase text-sm tracking-[0.3em]">Total Value</span>
                    <span className="text-blue-600 tracking-tighter">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tracking Info (If available) */}
            {order.shipmentId && (
              <Card className="p-10 border-none shadow-sm rounded-[3rem] bg-white group overflow-hidden relative">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                    <Truck size={24} />
                  </div>
                  Logistics Tracking
                </h3>
                <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100 relative z-10">
                  <div className="flex items-center gap-6 mb-6 md:mb-0">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                      <Clock size={32} className="animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Carrier Network ID</p>
                      <p className="text-xl font-black text-emerald-900 tracking-tight">#{order.shipmentId.slice(-12).toUpperCase()}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="h-14 px-8 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white font-black uppercase tracking-widest text-[10px] border border-emerald-100 rounded-2xl shadow-sm transition-all flex items-center gap-3"
                    onClick={() => navigate(`${routes.SHIPMENT_TRACKING.replace(':id', order.shipmentId)}`)}
                  >
                    Track Manifest <ExternalLink size={18} />
                  </Button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full opacity-50 scale-0 group-hover:scale-100 transition-all duration-700 pointer-events-none"></div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-4 space-y-10">
            {/* Delivery Address */}
            <Card className="p-10 border-none shadow-sm rounded-[3rem] bg-white">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <MapPin size={24} />
                </div>
                Destination
              </h3>
              <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 space-y-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Recipient</p>
                  <p className="text-lg font-black text-gray-900 tracking-tight leading-none">{order.shippingAddress?.fullName || 'Business Partner'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Location Coordinates</p>
                  <div className="text-gray-600 font-bold text-sm leading-relaxed space-y-1">
                    <p>{order.shippingAddress?.addressLine1}</p>
                    {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p className="text-gray-900">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Comms Channel</p>
                  <p className="text-sm font-black text-blue-600">📞 {order.shippingAddress?.phone}</p>
                </div>
              </div>
            </Card>

            {/* Payment Info */}
            <Card className="p-10 border-none shadow-sm rounded-[3rem] bg-white">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <CreditCard size={24} />
                </div>
                Settlement
              </h3>
              <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 flex-shrink-0">
                  <CreditCard size={32} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{order.paymentMethod}</p>
                  <p className={`text-lg font-black uppercase tracking-tighter ${
                    order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {order.paymentStatus}
                  </p>
                </div>
              </div>
            </Card>

            {/* Help/Support */}
            <Card className="p-10 border-none shadow-2xl rounded-[3rem] bg-gray-900 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-xl font-black mb-4 uppercase tracking-widest">Support Terminal</h3>
                <p className="text-gray-400 font-bold text-sm leading-relaxed mb-8 uppercase tracking-wider">
                  Need assistance with this manifest? Our command center is active 24/7.
                </p>
                <Button 
                  onClick={() => navigate(routes.HELP)}
                  className="w-full h-14 bg-white text-gray-900 hover:bg-blue-600 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl"
                >
                  Open Ticket
                </Button>
              </div>
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-600 rounded-full opacity-10 group-hover:scale-150 transition-all duration-700"></div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};


export default OrderDetails;
