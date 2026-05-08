import React from 'react';
import { Users, ShoppingBag, Clock, IndianRupee, TrendingUp, ArrowUpRight, Sparkles, Activity } from 'lucide-react';
import './AdminStats.css';

const AdminStats = ({ stats }) => {
  if (!stats) return null;

  const statItems = [
    { 
      label: "Gross Revenue", 
      value: `₹${((stats.revenue || 0) / 100000).toFixed(1)}L`, 
      icon: <IndianRupee size={20} />, 
      color: "primary",
      trend: "+15.2%",
      subtitle: "vs. last month"
    },
    { 
      label: "Total Orders", 
      value: (stats.totalOrders || 0).toLocaleString(), 
      icon: <ShoppingBag size={20} />, 
      color: "emerald",
      trend: "+8.4%",
      subtitle: "Today's volume"
    },
    { 
      label: "Active Users", 
      value: (stats.totalUsers || 0).toLocaleString(), 
      icon: <Users size={20} />, 
      color: "indigo",
      trend: "+4.1%",
      subtitle: "Growth indexed"
    },
    { 
      label: "Pending Actions", 
      value: (stats.pendingApprovals || 0).toString(), 
      icon: <Clock size={20} />, 
      color: "amber",
      trend: "-2.5%",
      subtitle: "Critical tasks"
    }
  ];

  return (
    <div className="stats-grid">
      {statItems.map((item, index) => (
        <div key={index} className="admin-stat-card group">
          <div className="stat-card-top">
            <div className={`stat-icon-box ${item.color}`}>
              {item.icon}
            </div>
            <div className={`stat-trend-tag ${item.trend.startsWith('+') ? 'positive' : 'negative'}`}>
              <TrendingUp size={10} className={item.trend.startsWith('+') ? '' : 'rotate-180'} />
              <span>{item.trend}</span>
            </div>
          </div>
          
          <div className="stat-card-mid">
            <p className="stat-label-text">{item.label}</p>
            <h3 className="stat-value-text">{item.value}</h3>
          </div>
          
          <div className="stat-card-bottom">
            <div className="stat-bar-container">
              <div 
                className={`stat-bar-fill ${item.color}`} 
                style={{ width: '70%' }}
              >
                <div className="stat-bar-glow"></div>
              </div>
            </div>
            <span className="stat-subtitle-text">{item.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
