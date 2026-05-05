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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative flex flex-col items-center text-center overflow-hidden min-h-[160px] justify-center gap-4">
          <div className="flex justify-between items-center w-full px-1">
            <div className={`w-10 h-10 rounded-lg bg-white shadow-md shadow-gray-200/30 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-105 border border-gray-50 flex-shrink-0`}>
              {React.cloneElement(item.icon, { size: 18 })}
            </div>
            <div className={`flex items-center gap-1 text-[9px] font-black ${item.growth.startsWith('+') ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'} px-2 py-1 rounded-full border border-current/10 shadow-sm whitespace-nowrap`}>
              <TrendingUp size={10} className={item.growth.startsWith('+') ? '' : 'rotate-180'} />
              <span>{item.growth}</span>
            </div>
          </div>
          
          <div className="space-y-1 w-full">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">{item.label}</p>
            <div className="flex flex-col items-center gap-1">
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter leading-none">{item.value}</h3>
              <div className="w-4 h-0.5 bg-blue-500/10 rounded-full group-hover:w-8 group-hover:bg-blue-500 transition-all duration-500"></div>
            </div>
          </div>

          {/* Decorative Corner Arrow */}
          <ArrowUpRight size={14} className="absolute top-4 right-4 text-gray-100 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
          
          {/* Subtle background pattern/effect */}
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gray-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
        </div>
      ))}
    </div>
  );
};




export default AdminStats;
