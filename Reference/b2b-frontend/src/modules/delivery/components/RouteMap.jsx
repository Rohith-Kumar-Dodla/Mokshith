import React from 'react';
import { MapPin, Navigation, Flag } from 'lucide-react';

const RouteMap = ({ route = [] }) => {
  return (
    <div className="bg-white/40 backdrop-blur-xl border-2 border-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
          <Navigation size={20} />
        </div>
        <div>
          <h4 className="text-xl font-black text-gray-900 tracking-tight">Route Intelligence</h4>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Optimized Logistics Path</p>
        </div>
      </div>

      <div className="space-y-0">
        {route.map((point, index) => (
          <div key={index} className="relative pl-10 pb-10 last:pb-0">
            {/* Timeline Connector */}
            {index !== route.length - 1 && (
              <div className="absolute left-[15px] top-[30px] bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 to-transparent border-l-2 border-dashed border-blue-100"></div>
            )}
            
            {/* Timeline Icon */}
            <div className={`absolute left-0 top-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
              index === 0 ? 'bg-blue-600 text-white' : 
              index === route.length - 1 ? 'bg-emerald-500 text-white' : 'bg-white text-blue-500 border border-blue-100'
            }`}>
              {index === 0 ? <Navigation size={14} /> : 
               index === route.length - 1 ? <Flag size={14} /> : <MapPin size={14} />}
            </div>

            {/* Content */}
            <div className="bg-white/60 p-5 rounded-2xl border border-white hover:border-blue-100 transition-all hover:shadow-xl hover:shadow-blue-500/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  Checkpoint {index + 1}
                </span>
                <span className="text-[10px] font-black text-gray-400">
                  {index === 0 ? 'STARTING' : index === route.length - 1 ? 'DESTINATION' : 'TRANSIT'}
                </span>
              </div>
              <p className="text-sm font-black text-gray-800 tracking-tight">
                {point.address || `Coordinates: ${point.lat}, ${point.lng}`}
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                  Lat: {point.lat.toFixed(4)}
                </div>
                <div className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                  Lng: {point.lng.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {route.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <MapPin size={32} />
            </div>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No active route telemetry</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMap;