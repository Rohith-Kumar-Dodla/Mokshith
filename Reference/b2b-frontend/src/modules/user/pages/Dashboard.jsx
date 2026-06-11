import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useOrder } from '../../order/hooks/useOrder.js';
import { useCredit } from '../../credit/hooks/useCredit.js';
import { routes } from '../../../routes/routeConfig.js';
import { 
  Package, 
  CreditCard, 
  Clock, 
  TrendingUp, 
  ChevronRight, 
  ArrowUpRight,
  ShoppingBag,
  Truck,
  FileText,
  Settings
} from 'lucide-react';

const B2BDashboard = () => {
  const { user } = useAuth();
  const { orders, loading: ordersLoading } = useOrder(true);
  const { credit, loading: creditLoading } = useCredit();
  const navigate = useNavigate();

  const creditLimit = credit?.creditLimit || 0;
  const balance = credit?.availableCredit || 0;
  const usedCredit = credit?.usedCredit || 0;

  const stats = [
    { 
      label: "Total Orders", 
      value: orders?.length || 0, 
      icon: <Package size={20} />, 
      color: "blue",
      link: routes.ORDERS
    },
    { 
      label: "Credit Limit", 
      value: `₹${creditLimit.toLocaleString()}`, 
      icon: <CreditCard size={20} />, 
      color: "green",
      link: routes.CREDIT
    },
    { 
      label: "Pending Deliveries", 
      value: orders?.filter(o => o.status === 'PENDING')?.length || 0, 
      icon: <Truck size={20} />, 
      color: "orange",
      link: routes.ORDERS
    },
    { 
      label: "Available Balance", 
      value: `₹${balance.toLocaleString()}`, 
      icon: <TrendingUp size={20} />, 
      color: "purple",
      link: routes.CREDIT
    }
  ];

  const recentOrders = orders?.slice(0, 5) || [];

  const quickLinks = [
    { icon: <FileText size={20} />, label: "Invoices", path: routes.ORDERS },
    { icon: <Clock size={20} />, label: "Statements", path: routes.CREDIT },
    { icon: <Settings size={20} />, label: "Settings", path: "/settings" }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Business Dashboard</h1>
            <p className="text-gray-500 mt-2">Welcome back, {user?.name}</p>
          </div>
          <div>
            <button 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
              onClick={() => navigate(routes.PRODUCTS)}
            >
              <ShoppingBag size={18} />
              <span>New Order</span>
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
              onClick={() => navigate(stat.link)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  stat.color === 'green' ? 'bg-emerald-50 text-emerald-600' :
                  stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                  'bg-purple-50 text-purple-600'
                }`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-gray-600 transition-colors" size={20} />
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Orders */}
          <section className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <Link to={routes.ORDERS} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                View All <ArrowUpRight size={16} />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              {ordersLoading ? (
                <div className="p-12 text-center text-gray-400">Loading orders...</div>
              ) : recentOrders.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((order) => (
                      <tr 
                        key={order._id} 
                        className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`${routes.ORDERS}/${order._id}`)}
                      >
                        <td className="px-8 py-5 font-bold text-gray-900">#{order._id.substring(0, 8)}</td>
                        <td className="px-8 py-5 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-8 py-5 font-bold text-gray-900">₹{order.totalAmount?.toLocaleString()}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' :
                            order.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-16 text-center">
                  <Package size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium">No orders yet. Start shopping!</p>
                </div>
              )}
            </div>
          </section>

          {/* Side Content */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Credit Utilization</h2>
              {creditLoading ? (
                <p className="text-gray-400">Loading credit info...</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-500">Used: ₹{usedCredit.toLocaleString()}</span>
                    <span className="text-gray-900">Total: ₹{creditLimit.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                      style={{ width: `${creditLimit > 0 ? Math.min((usedCredit / creditLimit) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">
                    Maintain a healthy utilization for better credit limits and financial standing.
                  </p>
                  <button 
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all active:scale-95"
                    onClick={() => navigate(routes.CREDIT)}
                  >
                    Manage Credit
                  </button>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Links</h2>
              <div className="grid grid-cols-1 gap-4">
                {quickLinks.map((link, index) => (
                  <Link 
                    key={index} 
                    to={link.path} 
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {link.icon}
                    </div>
                    <span className="font-bold text-gray-700">{link.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default B2BDashboard;