import { Building2, Truck, IndianRupee, ShoppingBag, TrendingUp, ArrowRight } from 'lucide-react';

const MetricsCards = ({ metrics }) => {
  if (!metrics) return null;

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "₹0";
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const cards = [
    {
      title: "Vendors",
      value: metrics.totalVendors?.toLocaleString() || '1,248',
      trend: "+18.6%",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
      chartColor: "#2563eb"
    },
    {
      title: "Delivery Partners",
      value: metrics.totalDeliveryPartners?.toLocaleString() || '856',
      trend: "+12.4%",
      icon: Truck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
      chartColor: "#16a34a"
    },
    {
      title: "Revenue",
      value: formatCurrency(metrics.revenue) || '₹4,82,560',
      trend: "+24.7%",
      icon: IndianRupee,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
      chartColor: "#9333ea"
    },
    {
      title: "Orders",
      value: metrics.orders?.toLocaleString() || '2,935',
      trend: "+16.3%",
      icon: ShoppingBag,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100",
      chartColor: "#ea580c"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="group bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-100/50"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 ${card.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <Icon size={24} className={card.color} />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
            
            {/* Content */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {card.value}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <div className="p-1 bg-green-50 rounded-md">
                  <TrendingUp size={12} className="text-green-600" />
                </div>
                <span className="text-sm font-bold text-green-600">
                  {card.trend}
                </span>
              </div>
            </div>

            {/* Line Chart */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <svg viewBox="0 0 100 40" className="w-full h-12" fill="none">
                <path
                  d={`M 0 ${32} Q 10 ${28}, 20 ${30} T 40 ${22} T 60 ${26} T 80 ${16} T 100 ${20}`}
                  stroke={card.chartColor}
                  strokeWidth="2.5"
                  fill="none"
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                  strokeLinecap="round"
                />
                <path
                  d={`M 0 ${32} Q 10 ${28}, 20 ${30} T 40 ${22} T 60 ${26} T 80 ${16} T 100 ${20} L 100 40 L 0 40 Z`}
                  stroke="none"
                  fill={card.chartColor}
                  className="opacity-10 group-hover:opacity-15 transition-opacity"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsCards;
