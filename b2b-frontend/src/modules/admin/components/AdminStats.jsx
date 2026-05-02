import React from 'react';
import { Users, ShoppingBag, Clock, IndianRupee, TrendingUp, ArrowUpRight } from 'lucide-react';

const AdminStats = ({ stats }) => {
  if (!stats) return null;

  const statItems = [
    { 
      label: "Total Customers", 
      value: stats.totalUsers, 
      icon: <Users size={24} />, 
      color: "blue",
      growth: "+12%"
    },
    { 
      label: "Orders Today", 
      value: stats.totalOrders, 
      icon: <ShoppingBag size={24} />, 
      color: "emerald",
      growth: "+8%"
    },
    { 
      label: "Pending Verification", 
      value: stats.pendingApprovals, 
      icon: <Clock size={24} />, 
      color: "amber",
      growth: "-2%"
    },
    { 
      label: "Monthly Revenue", 
      value: `₹${(stats.revenue / 100000).toFixed(1)}L`, 
      icon: <IndianRupee size={24} />, 
      color: "indigo",
      growth: "+15%"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
          <div className="flex justify-between items-start mb-8">
            <div className={`w-14 h-14 rounded-2xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              {React.cloneElement(item.icon, { size: 24 })}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">
              <TrendingUp size={10} />
              {item.growth}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{item.label}</p>
            <div className="flex items-center gap-2">
              <h3 className="text-4xl font-black text-gray-900 tracking-tight">{item.value}</h3>
              <ArrowUpRight size={16} className="text-gray-200 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
