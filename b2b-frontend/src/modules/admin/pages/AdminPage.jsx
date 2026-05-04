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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-blue-200"></div>
        <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Initializing Admin Console</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-[#f8f9fa] min-h-screen">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 mt-2">
            Welcome back, {user?.name}. Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 transition-all">
            <Bell size={20} />
          </button>
          <Button onClick={() => navigate(routes.ADMIN_PRODUCTS)} className="h-12 px-6 rounded-xl flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Plus size={20} />
            Add Product
          </Button>
        </div>
      </header>

      {/* Stats Section */}
      <AdminStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
        {/* Quick Actions - 7 cols */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <button 
                key={index} 
                onClick={() => navigate(action.path)}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group text-left relative"
              >
                <div className={`w-12 h-12 rounded-xl bg-${action.color}-50 text-${action.color}-600 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-base">{action.label}</h3>
                <span className="text-xs text-gray-400 mt-1 block">{action.count || 'View All'}</span>
                <ArrowUpRight size={16} className="absolute top-6 right-6 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Pending Approvals - 5 cols */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
            <Link to={routes.ADMIN_APPROVALS} className="text-sm font-semibold text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {approvals?.length > 0 ? (
              approvals.slice(0, 4).map((approval, index) => (
                <div key={approval._id || index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold">
                      {approval.title?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{approval.title}</p>
                      <p className="text-xs text-gray-500">{approval.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approve(approval.id)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all">
                      Approve
                    </button>
                    <button onClick={() => reject(approval.id)} className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-all">
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList size={32} className="text-gray-200" />
                </div>
                <h3 className="font-bold text-gray-900">No Pending Approvals</h3>
                <p className="text-sm text-gray-400 mt-1">Everything is up to date</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;