import React from 'react';
import { Users, ShoppingBag, Clock, IndianRupee, TrendingUp, ArrowUpRight } from 'lucide-react';

const AdminStats = ({ stats }) => {
  if (!stats) return null;

  const statItems = [
    { 
      label: "TOTAL CUSTOMERS", 
      value: stats.totalUsers || 0, 
      icon: <Users size={22} />, 
      color: "blue",
      growth: "+12%"
    },
    { 
      label: "ORDERS TODAY", 
      value: stats.totalOrders || 0, 
      icon: <ShoppingBag size={22} />, 
      color: "emerald",
      growth: "+8%"
    },
    { 
      label: "PENDING VERIFICATION", 
      value: stats.pendingApprovals || 0, 
      icon: <Clock size={22} />, 
      color: "amber",
      growth: "-2%"
    },
    { 
      label: "MONTHLY REVENUE", 
      value: `₹${(stats.revenue / 100000).toFixed(1)}L`, 
      icon: <IndianRupee size={22} />, 
      color: "indigo",
      growth: "+15%"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group relative flex flex-col items-center text-center overflow-hidden min-h-[220px] justify-between">
          <div className="flex justify-between items-center w-full mb-4 relative z-10 px-1">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white shadow-lg shadow-gray-200/50 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110 border border-gray-50 flex-shrink-0`}>
              {React.cloneElement(item.icon, { size: 20 })}
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-black ${item.growth.startsWith('+') ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'} px-3 py-1.5 rounded-full border border-current/10 shadow-sm whitespace-nowrap`}>
              <TrendingUp size={12} className={item.growth.startsWith('+') ? '' : 'rotate-180'} />
              <span>{item.growth}</span>
            </div>
          </div>
          
          <div className="space-y-2 md:space-y-3 w-full relative z-10 pb-2">
            <p className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{item.label}</p>
            <div className="flex flex-col items-center gap-2">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter leading-none">{item.value}</h3>
              <div className="w-6 md:w-8 h-1 bg-blue-500/20 rounded-full mt-1 group-hover:w-10 md:group-hover:w-12 group-hover:bg-blue-500 transition-all duration-500"></div>
            </div>
          </div>

          {/* Decorative Corner Arrow */}
          <ArrowUpRight size={18} className="absolute top-6 right-6 text-gray-100 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
          
          {/* Subtle background pattern/effect */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
        </div>
      ))}
    </div>
  );
};




export default AdminStats;
