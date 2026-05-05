import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { routes } from "../../../routes/routeConfig";
import AdminStats from "../components/AdminStats";
import Button from "../../../components/ui/Button";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Building2, 
  Bell, 
  Plus,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  DollarSign,
  CheckCircle2,
  ClipboardList
} from 'lucide-react';

const AdminPage = () => {
  const { approvals, stats, loading, error, approve, reject, fetchLogs } = useAdmin();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: <ShoppingCart size={24} />, label: "Orders", path: routes.ADMIN_ORDERS, color: "blue", count: stats?.totalOrders },
    { icon: <Package size={24} />, label: "Inventory", path: routes.ADMIN_INVENTORY, color: "orange", count: "8 LOW" },
    { icon: <Users size={24} />, label: "Customers", path: routes.ADMIN_USERS, color: "indigo", count: stats?.totalUsers },
    { icon: <Building2 size={24} />, label: "Warehouses", path: routes.ADMIN_WAREHOUSE, color: "emerald", count: "4 ACTIVE" },
    { icon: <TrendingUp size={24} />, label: "Analytics", path: routes.ADMIN_ANALYTICS, color: "purple", count: "LIVE" },
    { icon: <ShieldCheck size={24} />, label: "Approvals", path: routes.ADMIN_APPROVALS, color: "amber", count: approvals?.length },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-blue-200"></div>
        <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Initializing Admin Console</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 py-4">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none">
              Control <span className="text-blue-600">Center</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-bold">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg text-blue-600 border border-blue-500/20 flex items-center justify-center shadow-inner">
              <ShieldCheck size={18} />
            </div>
            <p className="text-sm md:text-base">
              Welcome back, <span className="text-gray-900 font-black">{user?.name}</span>. Operational systems are stable.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="w-14 h-14 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center group">
            <Bell size={24} className="group-hover:rotate-12 transition-transform" />
          </button>
          <Button 
            onClick={() => navigate(routes.ADMIN_PRODUCTS)} 
            className="h-14 px-8 rounded-2xl flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/40 group active:scale-95 transition-all"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            Add Product
          </Button>
        </div>
      </header>

      {/* Stats Section */}
      <AdminStats stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
        {/* Quick Operations - 7 cols */}
        <div className="xl:col-span-7">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest">
              Quick Operations
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <button 
                key={index} 
                onClick={() => navigate(action.path)}
                className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all group text-left relative overflow-hidden flex flex-col items-center text-center"
              >
                <div className={`w-12 h-12 rounded-xl bg-white shadow-lg shadow-gray-200/40 text-blue-600 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform border border-gray-50`}>
                  {React.cloneElement(action.icon, { size: 22 })}
                </div>
                <h3 className="font-black text-gray-900 text-lg tracking-tight mb-1">{action.label}</h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{action.count || 'View All'}</span>
                <ArrowUpRight size={16} className="absolute top-6 right-6 text-gray-100 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>

        {/* Verification Queue - 5 cols */}
        <div className="xl:col-span-5">
          <div className="flex items-center justify-between mb-10 px-4">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest">
              Verification Queue
            </h2>
            <Link to={routes.ADMIN_APPROVALS} className="text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-[0.25em] border-b-2 border-blue-500/20 hover:border-blue-500 transition-all">View All Queue</Link>
          </div>
          <div className="space-y-4 px-4">
            {approvals?.length > 0 ? (
              approvals.slice(0, 4).map((approval, index) => (
                <div key={approval._id || index} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm flex items-center justify-between hover:shadow-2xl hover:shadow-blue-500/5 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/5 rounded-xl flex items-center justify-center text-amber-600 font-black text-xl border border-amber-500/10 shadow-inner">
                      {approval.title?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-base tracking-tight leading-none mb-1">{approval.title}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registration</p>
                    </div>
                  </div>
                  <ArrowUpRight size={20} className="text-gray-200 group-hover:text-blue-500 transition-colors mr-2" />
                </div>
              ))
            ) : (
              <div className="bg-white border-4 border-dashed border-gray-50 rounded-[4rem] p-20 text-center shadow-inner">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <ClipboardList size={40} className="text-gray-200" />
                </div>
                <h3 className="font-black text-gray-900 text-2xl tracking-tight">Queue Cleared</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-3">All verifications complete</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;