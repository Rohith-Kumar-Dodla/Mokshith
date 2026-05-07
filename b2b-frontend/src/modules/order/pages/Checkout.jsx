import { useOrder } from "../hooks/useOrder";
import { useAuth } from "../../auth/hooks/useAuth";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../../routes/routeConfig";
import { PAYMENT_METHODS } from "../../../utils/constants";
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  Package, 
  ShieldCheck, 
  ArrowRight,
  Info,
  ChevronRight,
  Wallet,
  CheckCircle,
  FileText
} from "lucide-react";
import { getProductImage } from "../../../utils/imageHelper.js";

const Checkout = () => {
  const { cart, placeOrder } = useOrder();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.COD);
  const [address, setAddress] = useState({
    name: user?.name || "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: ""
  });

  const subtotal = cart.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + tax;

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress({ ...address, [name]: value });
  };

  const validateCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return false;
    }

    const requiredFields = ['name', 'phone', 'addressLine', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(f => !address[f]?.trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill in all shipping details: ${missingFields.join(', ')}`);
      return false;
    }

    const moqViolations = cart.filter(item => {
      const minQty = item.minOrderQty || item.moq || 1;
      return item.quantity < minQty;
    });

    if (moqViolations.length > 0) {
      const names = moqViolations.map(item => item.name).join(', ');
      alert(`Minimum Order Quantity not met for: ${names}. Please adjust in cart.`);
      return false;
    }

    if (paymentMethod === PAYMENT_METHODS.CREDIT) {
      if (!user?.availableCredit || user.availableCredit < total) {
        alert("Insufficient credit balance. Please choose another payment method.");
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateCheckout()) return;
    
    setLoading(true);
    try {
      const payload = {
        items: cart.map(item => ({
          productId: item.id || item._id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        totalAmount: total,
        paymentMethod,
        shippingAddress: address
      };

      const response = await placeOrder(payload);
      const newOrder = response.data || response;
      
      navigate(routes.PAYMENT.replace(':orderId', newOrder._id));
    } catch (err) {
      console.error("Checkout Error:", err);
      alert(err.message || "Failed to place order. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300 shadow-inner">
          <Package size={48} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Your cart is empty</h2>
        <p className="text-gray-500 font-bold mb-8">Add some products to get started!</p>
        <Button 
          onClick={() => navigate(routes.PRODUCTS)}
          className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-100 transition-all transform hover:-translate-y-1"
        >
          Back to Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen py-8 md:py-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs - Modern Style */}
        <div className="flex items-center gap-3 mb-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2">
          <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>Home</span>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate(routes.CART)}>Cart</span>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="text-blue-600">Checkout</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 pb-8 border-b-2 border-slate-100">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
              Finalize <span className="text-blue-600">Checkout</span>
            </h1>
            <p className="text-slate-500 font-bold flex items-center gap-3 text-base md:text-lg">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <ShieldCheck size={20} className="text-emerald-600" />
              </div>
              Secure Enterprise Wholesale Transaction
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm shadow-xl shadow-emerald-100 ring-4 ring-emerald-50">
                <CheckCircle size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cart</span>
            </div>
            <div className="w-16 h-[3px] bg-emerald-500 mb-6 rounded-full opacity-30"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm shadow-xl shadow-blue-100 ring-4 ring-blue-50 font-black">
                2
              </div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Checkout</span>
            </div>
            <div className="w-16 h-[3px] bg-slate-200 mb-6 rounded-full"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center text-sm font-black">
                3
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12">
          {/* LEFT COLUMN - 68% */}
          <div className="lg:w-[68%] space-y-12">
            <Card className="p-8 md:p-12 rounded-[2.5rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white border border-slate-50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-6 mb-12">
                <div className="p-5 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100/50 shadow-inner">
                  <MapPin size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Shipping Details</h3>
                  <p className="text-xs font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">Business Logistics Information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business / Contact Name</p>
                  <Input 
                    name="name" 
                    value={address.name} 
                    onChange={handleAddressChange} 
                    required 
                    placeholder="Enter full legal business name"
                    className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 text-slate-900 font-bold px-6 placeholder:font-medium placeholder:text-slate-300"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</p>
                  <Input 
                    name="phone" 
                    placeholder="+91 XXXXX XXXXX" 
                    value={address.phone} 
                    onChange={handleAddressChange} 
                    required 
                    className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 text-slate-900 font-bold px-6 placeholder:font-medium placeholder:text-slate-300"
                  />
                </div>
              </div>
              
              <div className="mb-8 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Address Line</p>
                <Input 
                  name="addressLine" 
                  value={address.addressLine} 
                  onChange={handleAddressChange} 
                  required 
                  placeholder="Street, Area, Landmark"
                  className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 text-slate-900 font-bold px-6 placeholder:font-medium placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</p>
                  <Input 
                    name="city" 
                    value={address.city} 
                    onChange={handleAddressChange} 
                    required 
                    className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 text-slate-900 font-bold px-6"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</p>
                  <Input 
                    name="state" 
                    value={address.state} 
                    onChange={handleAddressChange} 
                    required 
                    className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 text-slate-900 font-bold px-6"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pincode</p>
                  <Input 
                    name="pincode" 
                    value={address.pincode} 
                    onChange={handleAddressChange} 
                    required 
                    className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 text-slate-900 font-bold px-6"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-8 md:p-12 rounded-[2.5rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white border border-slate-50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-6 mb-12">
                <div className="p-5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100/50 shadow-inner">
                  <Package size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Order Items</h3>
                  <p className="text-xs font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">Wholesale Inventory Selection</p>
                </div>
              </div>

              <div className="space-y-6">
                {cart.map((item, index) => (
                  <div key={item._id || item.id || index} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group/item">
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 bg-white rounded-[1.5rem] flex items-center justify-center text-slate-300 border border-slate-100 overflow-hidden shadow-sm flex-shrink-0 group-hover/item:border-blue-100 transition-colors">
                        <img 
                          src={getProductImage(item)} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=100&q=80";
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="font-black text-slate-900 text-xl leading-tight group-hover/item:text-blue-600 transition-colors">{item.name}</p>
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-1.5 bg-white rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border border-slate-100 shadow-sm">
                            Quantity: {item.quantity} units
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-black text-slate-900 text-2xl tracking-tighter">₹{(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">₹{item.price}/unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN - 32% */}
          <div className="lg:w-[32%]">
            <Card className="p-8 md:p-10 rounded-[2.5rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.06)] bg-white border border-slate-50 lg:sticky lg:top-12">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">Order Summary</h3>
              </div>
              
              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Gross Subtotal</span>
                  <span className="text-xl font-bold text-slate-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tax (18% GST)</span>
                  <span className="text-xl font-bold text-slate-900">₹{tax.toLocaleString()}</span>
                </div>
                <div className="pt-8 border-t-2 border-slate-100 flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Amount</span>
                    <p className="text-4xl font-black text-blue-600 tracking-tighter leading-none">₹{total.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 px-3 py-1.5 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">
                    INC. TAXES
                  </div>
                </div>
              </div>
              
              <div className="mb-10 bg-slate-50/80 p-8 rounded-[2.5rem] border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</p>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Wallet size={12} className="text-blue-600" />
                    <span className="text-[11px] font-black text-slate-700">₹{user?.availableCredit?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: PAYMENT_METHODS.COD, label: 'COD', icon: Truck },
                    { id: PAYMENT_METHODS.CREDIT, label: 'Credit', icon: Wallet, disabled: (user?.availableCredit || 0) < total },
                    { id: PAYMENT_METHODS.RAZORPAY, label: 'Razorpay', icon: CreditCard },
                    { id: PAYMENT_METHODS.ONLINE, label: 'Online', icon: ShieldCheck },
                  ].map((method) => (
                    <button
                      key={method.id}
                      disabled={method.disabled}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`
                        flex flex-col items-center justify-center h-28 rounded-[1.5rem] border-2 transition-all gap-3 relative overflow-hidden
                        ${paymentMethod === method.id 
                          ? 'border-blue-600 bg-white text-blue-600 shadow-xl shadow-blue-500/10 scale-[1.02]' 
                          : 'border-white bg-white/60 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                        }
                        ${method.disabled ? 'opacity-30 cursor-not-allowed grayscale bg-slate-100' : 'cursor-pointer'}
                      `}
                    >
                      {paymentMethod === method.id && (
                        <div className="absolute top-0 right-0 p-1.5 bg-blue-600 rounded-bl-xl">
                          <CheckCircle size={10} className="text-white" />
                        </div>
                      )}
                      <method.icon size={24} strokeWidth={paymentMethod === method.id ? 2.5 : 2} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder} 
                className="w-full h-20 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl shadow-[0_20px_40px_rgba(37,99,235,0.25)] transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-4 uppercase tracking-[0.2em] group"
                loading={loading}
                disabled={loading}
              >
                Place Secure Order
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
              
              <div className="mt-8 p-6 bg-emerald-50/40 rounded-2xl flex items-start gap-4 border border-emerald-100/50">
                <ShieldCheck size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-bold text-emerald-800 leading-relaxed uppercase tracking-tight">
                  Your transaction is protected by enterprise-grade security and wholesale buyer protection policies.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
