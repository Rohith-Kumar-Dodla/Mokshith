import { useOrder } from "../hooks/useOrder";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSystemConfig } from "../../../hooks/useSystemConfig";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import { useState, useRef, useCallback } from "react";
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
  FileText,
  Loader2
} from "lucide-react";
import { getProductImage } from "../../../utils/imageHelper.js";

const Checkout = () => {
  const { cart, placeOrder } = useOrder();
  const { user } = useAuth();
  const { isFeatureEnabled, getSetting } = useSystemConfig();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isProcessing = useRef(false);
  const checkoutKey = useRef(`chk_${user?._id || 'guest'}_${Date.now()}`);

  const codEnabled = isFeatureEnabled('enableCOD') && isFeatureEnabled('cod');
  const creditEnabled = isFeatureEnabled('creditSystem');

  const [paymentMethod, setPaymentMethod] = useState(codEnabled ? PAYMENT_METHODS.COD : PAYMENT_METHODS.ONLINE);
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

  const cutoffTime = getSetting('orderCutoffTime');

  const validateCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return false;
    }

    // 🔥 Check Cutoff Time Client-side
    if (cutoffTime && cutoffTime !== '00:00') {
      const [hours, minutes] = cutoffTime.split(':').map(Number);
      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setHours(hours, minutes, 0, 0);

      if (now > cutoffDate) {
        alert(`Orders are closed for today after ${cutoffTime}. Please try again tomorrow.`);
        return false;
      }
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

  const handlePlaceOrder = useCallback(async (e) => {
    // 🔒 Double-lock: Synchronous Ref + Local State
    if (isProcessing.current || loading) {
      console.warn("Checkout already in progress, ignoring duplicate trigger.");
      return;
    }
    
    // Prevent default if called from a form or with an event
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    if (!validateCheckout()) return;
    
    // Set both locks immediately
    isProcessing.current = true;
    setLoading(true);

    try {
      // Use a stable key for this specific attempt
      const currentKey = checkoutKey.current;

      const payload = {
        items: cart.map(item => ({
          productId: item.id || item._id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        totalAmount: total,
        paymentMethod,
        shippingAddress: address,
        idempotencyKey: currentKey
      };

      const response = await placeOrder(payload);
      const newOrder = response.data || response;
      
      if (!newOrder?._id) {
        throw new Error("Order placement did not return a valid ID");
      }

      // 🏆 Success: Navigate to payment
      // We keep isProcessing.current = true to prevent double-clicks during route transition
      navigate(routes.PAYMENT.replace(':orderId', newOrder._id));
    } catch (err) {
      console.error("Checkout Error:", err);
      
      // ⚠️ Handle 409 Conflict "In Progress" gracefully
      if (err.isConcurrencyError || err.message?.includes('Duplicate operation in progress')) {
        // If it's just a concurrent request error, we don't reset everything immediately
        // We wait a bit and check if we should allow a retry if it hasn't redirected
        setTimeout(() => {
          if (isProcessing.current) {
            setLoading(false);
            isProcessing.current = false;
          }
        }, 5000);
        return; // Don't show alert for "in progress" duplicates
      }

      // Reset locks on real errors to allow retry
      setLoading(false);
      isProcessing.current = false;
      
      // Generate a NEW key for the next attempt so it's not blocked by backend idempotency
      checkoutKey.current = `chk_${user?._id || 'guest'}_${Date.now()}`;
      
      // Only alert if it's not a duplicate error
      if (!err.message?.includes('Duplicate')) {
        alert(err.message || "Failed to place order. Please check your connection and try again.");
      }
    }
  }, [loading, validateCheckout, cart, total, paymentMethod, address, placeOrder, navigate, user?._id]);

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
    <div className="bg-slate-50 min-h-screen py-6 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Progress */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
              <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>Marketplace</span>
              <ChevronRight size={14} />
              <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate(routes.CART)}>Shopping Cart</span>
              <ChevronRight size={14} />
              <span className="text-slate-900 font-bold">Secure Checkout</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Checkout</h1>
          </div>

          {/* Professional Stepper */}
          <div className="flex items-center bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-100 ring-4 ring-emerald-50">
                <CheckCircle size={16} />
              </div>
              <div className="ml-3 mr-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Step 1</p>
                <p className="text-xs font-bold text-slate-900">Cart</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-100 mx-2"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50">
                <span className="text-xs font-bold">2</span>
              </div>
              <div className="ml-3 mr-4">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider leading-none mb-1">Step 2</p>
                <p className="text-xs font-bold text-slate-900">Details</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-100 mx-2"></div>
            <div className="flex items-center opacity-40">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                <span className="text-xs font-bold">3</span>
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Step 3</p>
                <p className="text-xs font-bold text-slate-900">Payment</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Main Content: 60% width on desktop */}
          <div className="w-full lg:w-[60%] space-y-6">
            
            {/* Shipping Address Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Shipping Information</h3>
                    <p className="text-xs text-slate-500 font-medium">Where should we deliver your order?</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Verified Address</span>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <Input 
                    label="Contact Person / Business Name"
                    name="name" 
                    value={address.name} 
                    onChange={handleAddressChange} 
                    required 
                    placeholder="Enter recipient name"
                    className="mb-0"
                  />
                  <Input 
                    label="Phone Number"
                    name="phone" 
                    placeholder="+91 XXXXX XXXXX" 
                    value={address.phone} 
                    onChange={handleAddressChange} 
                    required 
                    className="mb-0"
                  />
                  <div className="md:col-span-2">
                    <Input 
                      label="Delivery Address"
                      name="addressLine" 
                      value={address.addressLine} 
                      onChange={handleAddressChange} 
                      required 
                      placeholder="Street address, landmark, area"
                      className="mb-0"
                    />
                  </div>
                  <Input 
                    label="City"
                    name="city" 
                    value={address.city} 
                    onChange={handleAddressChange} 
                    required 
                    className="mb-0"
                  />
                  <Input 
                    label="State"
                    name="state" 
                    value={address.state} 
                    onChange={handleAddressChange} 
                    required 
                    className="mb-0"
                  />
                  <Input 
                    label="Pincode"
                    name="pincode" 
                    value={address.pincode} 
                    onChange={handleAddressChange} 
                    required 
                    className="mb-0"
                  />
                </div>
              </div>
            </div>

            {/* Order Items Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Review Order Items</h3>
                    <p className="text-xs text-slate-500 font-medium">Verify your items before confirming</p>
                  </div>
                </div>
                <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {cart.map((item, index) => (
                  <div key={item._id || item.id || index} className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors group">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <img 
                        src={getProductImage(item)} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=100&q=80";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1 truncate">{item.name}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500">Qty: <span className="text-slate-900">{item.quantity}</span></span>
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <span className="text-xs font-semibold text-slate-500">Price: <span className="text-slate-900">₹{item.price.toLocaleString()}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-xl tracking-tight">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: 40% width on desktop */}
          <div className="w-full lg:w-[40%] lg:sticky lg:top-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
              {/* Header section with accent */}
              <div className="bg-slate-900 px-10 py-10 text-white rounded-t-[2.5rem] relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight whitespace-nowrap">Order Summary</h3>
                    <p className="text-blue-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">Final Transaction Totals</p>
                  </div>
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shrink-0">
                    <FileText size={24} className="text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="p-10">
                <div className="space-y-5 mb-10">
                  <div className="flex justify-between items-center group">
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">Subtotal</span>
                    <span className="text-base font-bold text-slate-900">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">Tax (18% GST)</span>
                    <span className="text-base font-bold text-slate-900">₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Amount</p>
                      <p className="text-4xl font-black text-blue-600 tracking-tighter leading-none">₹{total.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-widest border border-blue-100/50">
                      INC. TAXES
                    </div>
                  </div>
                </div>

                <div className="mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Payment Method</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: PAYMENT_METHODS.COD, label: 'COD', icon: Truck, hidden: !codEnabled },
                      { id: PAYMENT_METHODS.CREDIT, label: 'Credit', icon: Wallet, hidden: !creditEnabled, disabled: (user?.availableCredit || 0) < total },
                      { id: PAYMENT_METHODS.RAZORPAY, label: 'Razorpay', icon: CreditCard },
                      { id: PAYMENT_METHODS.ONLINE, label: 'Online', icon: ShieldCheck },
                    ].filter(m => !m.hidden).map((method) => (
                      <button
                        key={method.id}
                        disabled={method.disabled}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`
                          flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 relative group/btn
                          ${paymentMethod === method.id 
                            ? 'border-blue-600 bg-white text-blue-600 shadow-lg shadow-blue-500/5' 
                            : 'border-transparent bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600'
                          }
                          ${method.disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer shadow-sm'}
                        `}
                      >
                        {paymentMethod === method.id && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                          </div>
                        )}
                        <method.icon size={20} strokeWidth={paymentMethod === method.id ? 2.5 : 2} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{method.label}</span>
                      </button>
                    ))}
                  </div>
                  {paymentMethod === PAYMENT_METHODS.CREDIT && (
                    <div className="mt-4 p-4 bg-white rounded-2xl border border-blue-100 flex items-center justify-between shadow-sm">
                      <span className="text-[10px] font-bold text-blue-500 uppercase">Available Credit</span>
                      <span className="text-sm font-bold text-slate-900">₹{user?.availableCredit?.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handlePlaceOrder} 
                  loading={loading}
                  fullWidth
                  className="h-16 rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span>Complete Order</span>
                    <ArrowRight size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>

                <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise Grade Security</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    Your transaction is encrypted. By confirming, you agree to our <span className="text-blue-600 cursor-pointer hover:underline font-bold">Terms of Service</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
