import { Activity, Users, Calendar } from 'lucide-react';

const WelcomeHero = ({ metrics }) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-8 shadow-2xl shadow-blue-500/30">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent backdrop-blur-sm"></div>

      <div className="relative z-10 space-y-6">
        {/* Welcome Message */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-blue-200 tracking-wider uppercase">
            Welcome Back 👋
          </p>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Super Admin
          </h1>
          <p className="text-base text-blue-100 font-medium leading-relaxed max-w-2xl">
            Monitor platform activity, manage operations, and track business performance from a centralized control center.
          </p>
        </div>

        {/* Status Cards - One Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:shadow-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-400/20 rounded-lg">
                <Activity size={18} className="text-green-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">System Status</p>
                <p className="text-white font-bold text-base">Healthy</p>
              </div>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:shadow-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-400/20 rounded-lg">
                <Users size={18} className="text-blue-200" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Users</p>
                <p className="text-white font-bold text-base">{metrics?.totalUsers || '2,104'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:shadow-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-400/20 rounded-lg">
                <Calendar size={18} className="text-purple-200" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Today's Date</p>
                <p className="text-white font-bold text-base">{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHero;
