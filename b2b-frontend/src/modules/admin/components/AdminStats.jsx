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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className={`w-12 h-12 rounded-xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              {React.cloneElement(item.icon, { size: 24 })}
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} />
              {item.growth}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{item.value}</h3>
              <ArrowUpRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
