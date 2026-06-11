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
  TrendingUp,
  ShieldCheck,
  Plus,
  ChevronRight,
  ArrowUpRight,
  ClipboardList,
  Sparkles,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';
import './AdminPage.css';
import './AdminShared.css';

const AdminPage = () => {
  const { approvals, stats, loading } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: <ShoppingCart size={20} />, label: "Orders", path: routes.ADMIN_ORDERS, count: stats?.totalOrders, color: 'blue' },
    { icon: <Package size={20} />, label: "Inventory", path: routes.ADMIN_INVENTORY, count: "8 LOW", color: 'amber' },
    { icon: <Users size={20} />, label: "Customers", path: routes.ADMIN_USERS, count: stats?.totalUsers, color: 'indigo' },
    { icon: <Building2 size={20} />, label: "Warehouses", path: routes.ADMIN_WAREHOUSE, count: "4 ACTIVE", color: 'emerald' },
    { icon: <TrendingUp size={20} />, label: "Analytics", path: routes.ADMIN_ANALYTICS, count: "LIVE", color: 'sky' },
    { icon: <ShieldCheck size={20} />, label: "Approvals", path: routes.ADMIN_APPROVALS, count: approvals?.length, color: 'rose' },
  ];

  if (loading) return (
    <div className="admin-page-content flex flex-col items-center justify-center py-32 gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity size={24} className="text-primary animate-pulse" />
        </div>
      </div>
      <p className="text-muted font-black uppercase tracking-widest text-[10px]">Orchestrating Dashboard...</p>
    </div>
  );

  return (
    <div className="admin-page-content animate-in fade-in duration-700">
      <header className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title flex items-center gap-3">
            Dashboard Overview
            <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">v2.0</span>
          </h1>
          <p className="page-subtitle">Welcome back, <span className="font-black text-main underline decoration-primary/30 decoration-2 underline-offset-4">{user?.name || 'Admin'}</span>. Here's what's happening today.</p>
        </div>
        <div className="header-actions">
          <Button 
            onClick={() => navigate(routes.ADMIN_PRODUCTS)} 
            className="h-14 px-8 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 uppercase"
          >
            <Plus size={20} strokeWidth={3} />
            Add Product
          </Button>
        </div>
      </header>

      {/* Stats Section */}
      <AdminStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        {/* Quick Operations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-main uppercase tracking-widest flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Quick Operations
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <div 
                key={index} 
                className="admin-card group p-5 cursor-pointer hover:border-primary/30 transition-all flex items-center gap-4"
                onClick={() => navigate(action.path)}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 bg-primary/5 text-primary group-hover:scale-110`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">{action.label}</p>
                  <p className="text-lg font-black text-main tracking-tight">{action.count || 'Manage'}</p>
                </div>
                <ArrowRight size={16} className="text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>

        {/* Verification Queue */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-main uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" />
              Verification Queue
            </h2>
            <Link to={routes.ADMIN_APPROVALS} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
              View All
            </Link>
          </div>
          
          <div className="admin-card p-2 space-y-2">
            {approvals?.length > 0 ? (
              approvals.slice(0, 5).map((approval, index) => (
                <div 
                  key={approval._id || index} 
                  className="p-4 rounded-xl hover:bg-primary/5 transition-colors group flex items-center gap-4 cursor-pointer"
                  onClick={() => navigate(routes.ADMIN_APPROVALS)}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">
                    {approval.title?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-main line-clamp-1">{approval.title}</p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest">New Registration</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-muted group-hover:text-primary group-hover:border-primary/30 transition-all">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                  <ClipboardList size={32} />
                </div>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">All verifications complete</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;