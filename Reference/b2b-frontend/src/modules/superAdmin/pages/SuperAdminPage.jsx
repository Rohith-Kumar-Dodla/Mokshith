import { useState } from "react";
import { useSuperAdmin } from "../hooks/useSuperAdmin";
import { useNavigate } from "react-router-dom";
import MetricsCards from "../components/MetricsCards.jsx";
import WelcomeHero from "../components/WelcomeHero.jsx";
import { Users, Building2, Truck, ArrowRight, Sparkles, Zap, ShieldCheck, TrendingUp, ShoppingBag } from 'lucide-react';
import { routes } from "../../../routes/routeConfig.js";

const SuperAdminPage = () => {
  const { metrics, loading, error } = useSuperAdmin();
  const navigate = useNavigate();

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-blue-200"></div>
        <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Loading Dashboard</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-600">{error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  const quickActions = [
    { 
      icon: Building2,
      label: 'Onboard Vendor', 
      description: 'Register wholesalers, distributors, and suppliers.',
      path: routes.SUPER_ADMIN_PARTNERS,
      theme: 'blue',
      buttonText: 'Onboard Vendor',
      illustration: 'store'
    },
    { 
      icon: Truck,
      label: 'Register Delivery Partner', 
      description: 'Expand logistics operations by adding delivery personnel.',
      path: routes.SUPER_ADMIN_DELIVERY_PARTNERS,
      theme: 'navy',
      buttonText: 'Register Partner',
      illustration: 'delivery'
    },
    { 
      icon: ShieldCheck,
      label: 'Create Administrator', 
      description: 'Grant platform access to new management personnel.',
      path: routes.SUPER_ADMIN_ADMINS,
      theme: 'purple',
      buttonText: 'Create Admin',
      illustration: 'admin'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Hero Section */}
      <WelcomeHero metrics={metrics} />

      {/* Metrics Cards */}
      <MetricsCards metrics={metrics} />

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Zap size={22} className="text-blue-600" />
            Quick Actions
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Perform critical operations instantly
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const getThemeClasses = (theme) => {
              switch(theme) {
                case 'blue':
                  return 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800';
                case 'navy':
                  return 'bg-gradient-to-br from-[#071A52] via-[#0B2C8F] to-[#0F3D9E]';
                case 'purple':
                  return 'bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800';
                default:
                  return 'bg-gradient-to-br from-blue-600 to-blue-700';
              }
            };
            
            const getIllustration = (theme) => {
              switch(theme) {
                case 'blue':
                  return (
                    <svg viewBox="0 0 100 80" className="w-full h-full" fill="none">
                      <rect x="10" y="20" width="80" height="50" rx="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                      <rect x="20" y="30" width="25" height="30" rx="2" fill="rgba(255,255,255,0.25)"/>
                      <rect x="50" y="35" width="15" height="25" rx="2" fill="rgba(255,255,255,0.2)"/>
                      <rect x="70" y="40" width="15" height="20" rx="2" fill="rgba(255,255,255,0.15)"/>
                      <circle cx="50" cy="15" r="8" fill="rgba(255,255,255,0.3)"/>
                    </svg>
                  );
                case 'navy':
                  return (
                    <svg viewBox="0 0 100 80" className="w-full h-full" fill="none">
                      <rect x="15" y="35" width="70" height="35" rx="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                      <circle cx="25" cy="30" r="8" fill="rgba(255,255,255,0.25)"/>
                      <circle cx="45" cy="28" r="8" fill="rgba(255,255,255,0.2)"/>
                      <circle cx="65" cy="30" r="8" fill="rgba(255,255,255,0.15)"/>
                      <rect x="20" y="45" width="60" height="15" rx="2" fill="rgba(255,255,255,0.2)"/>
                    </svg>
                  );
                case 'purple':
                  return (
                    <svg viewBox="0 0 100 80" className="w-full h-full" fill="none">
                      <circle cx="50" cy="35" r="25" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                      <path d="M 50 20 L 55 32 L 68 32 L 58 40 L 62 52 L 50 44 L 38 52 L 42 40 L 32 32 L 45 32 Z" fill="rgba(255,255,255,0.25)"/>
                      <rect x="30" y="60" width="40" height="12" rx="2" fill="rgba(255,255,255,0.2)"/>
                    </svg>
                  );
                default:
                  return null;
              }
            };
            
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`relative group overflow-hidden rounded-2xl ${getThemeClasses(action.theme)} p-6 
                  shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/35 hover:-translate-y-1 transition-all duration-300
                  text-left`}
              >
                {/* Decorative background shapes */}
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Illustration Area */}
                  <div className="mb-5 h-28 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 flex items-center justify-center overflow-hidden">
                    {getIllustration(action.theme)}
                  </div>
                  
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {action.label}
                    </h3>
                    <p className="text-sm font-medium text-white/85 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  
                  <button className="mt-5 w-full py-2.5 px-4 bg-white/20 backdrop-blur-md rounded-full 
                    font-semibold text-white text-sm border border-white/30 hover:bg-white/30 hover:border-white/50
                    transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-white/40 shadow-lg">
                    {action.buttonText}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center group">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users size={18} className="text-blue-600" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Users</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{metrics?.totalUsers?.toLocaleString() || '2,104'}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <TrendingUp size={12} className="text-green-600" />
              <span className="text-xs font-bold text-green-600">+12.5%</span>
            </div>
          </div>
          <div className="text-center group border-l border-gray-100/50 hidden md:block">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 size={18} className="text-green-600" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Vendors</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">{metrics?.totalVendors?.toLocaleString() || '1,248'}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <TrendingUp size={12} className="text-green-600" />
              <span className="text-xs font-bold text-green-600">+18.6%</span>
            </div>
          </div>
          <div className="text-center group border-l border-gray-100/50 hidden md:block">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Truck size={18} className="text-purple-600" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Partners</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{metrics?.totalDeliveryPartners?.toLocaleString() || '856'}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <TrendingUp size={12} className="text-green-600" />
              <span className="text-xs font-bold text-green-600">+12.4%</span>
            </div>
          </div>
          <div className="text-center group border-l border-gray-100/50 hidden md:block">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShoppingBag size={18} className="text-orange-600" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{metrics?.orders?.toLocaleString() || '2,935'}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <TrendingUp size={12} className="text-green-600" />
              <span className="text-xs font-bold text-green-600">+16.3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;
