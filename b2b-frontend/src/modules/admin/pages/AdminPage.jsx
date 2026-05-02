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
  X
} from 'lucide-react';

const AdminPage = () => {
  const { approvals, stats, loading, error, approve, reject, fetchLogs } = useAdmin();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: <ShoppingCart size={24} />, label: "Orders", path: routes.ADMIN_ORDERS, color: "blue", count: stats?.totalOrders },
    { icon: <Package size={24} />, label: "Inventory", path: "/admin/inventory", color: "orange", count: "8 LOW" },
    { icon: <Users size={24} />, label: "Customers", path: routes.ADMIN_USERS, color: "indigo", count: stats?.totalUsers },
    { icon: <Building2 size={24} />, label: "Warehouses", path: "/admin/warehouses", color: "emerald", count: "4 ACTIVE" },
    { icon: <TrendingUp size={24} />, label: "Analytics", path: routes.ADMIN_ANALYTICS, color: "purple", count: "LIVE" },
    { icon: <ShieldCheck size={24} />, label: "Approvals", path: routes.ADMIN_APPROVALS, color: "amber", count: approvals?.length },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-blue-200"></div>
        <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Initializing Admin Console</p>
      </div>
    </div>
  );

  return (
    <div className="p-10 bg-[#f8f9fa] min-h-screen">
      <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">
            Control <span className="text-blue-600">Center</span>
          </h1>
          <p className="text-gray-500 font-bold mt-3 flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-400" />
            Welcome back, {user?.name}. Operational systems are stable.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="p-5 bg-white border border-gray-100 rounded-3xl text-gray-400 hover:text-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
            <Bell size={24} />
          </button>
          <Button onClick={() => navigate(routes.ADMIN_PRODUCTS)} className="shadow-2xl shadow-blue-200 h-16 px-10 text-xl rounded-[1.5rem] flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white font-black">
            <Plus size={28} strokeWidth={3} />
            Add Product
          </Button>
        </div>
      </header>

      {/* Stats Section */}
      <AdminStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Quick Actions - 7 cols */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Quick Operations</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            {quickActions.map((action, index) => (
              <button 
                key={index} 
                onClick={() => navigate(action.path)}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all group text-left relative overflow-hidden"
              >
                <div className={`w-16 h-16 rounded-2xl bg-${action.color}-50 text-${action.color}-600 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h3 className="font-black text-gray-900 text-lg block">{action.label}</h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2 block">{action.count || 'View All'}</span>
                <ArrowUpRight size={20} className="absolute top-8 right-8 text-gray-100 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Pending Approvals - 5 cols */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Verification Queue</h2>
            <Link to={routes.ADMIN_APPROVALS} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View All Queue</Link>
          </div>
          <div className="space-y-6">
            {approvals?.length > 0 ? (
              approvals.slice(0, 4).map((approval, index) => (
                <div key={approval._id || index} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-amber-500/5 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 font-black text-xl">
                      {approval.title?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-lg leading-tight">{approval.title}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">{approval.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => approve(approval.id)} className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all">
                      Approve
                    </button>
                    <button onClick={() => reject(approval.id)} className="px-6 py-2.5 border-2 border-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 hover:border-red-100 transition-all">
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border-4 border-dashed border-gray-100 rounded-[3rem] p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={40} className="text-gray-200" />
                </div>
                <h3 className="font-black text-gray-900 text-xl">Queue is Empty</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">All verifications completed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;