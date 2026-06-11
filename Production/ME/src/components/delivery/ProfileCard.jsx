import React from 'react';
import { FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiShield, FiTruck } from 'react-icons/fi';

const ProfileCard = ({ profile, onEdit }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-xl sm:text-2xl">
            {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold">{profile?.name}</h2>
            <p className="text-xs sm:text-sm text-blue-100">{profile?.vehicleType} - {profile?.vehicleNumber}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        {/* Personal Information */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
            <FiUser size={14} className="sm:size-18 text-blue-500" />
            Personal Information
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <FiPhone size={14} className="sm:size-16 text-gray-400" />
              <span className="text-gray-600">{profile?.phone}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <FiMail size={14} className="sm:size-16 text-gray-400" />
              <span className="text-gray-600">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <FiCalendar size={14} className="sm:size-16 text-gray-400" />
              <span className="text-gray-600">Joined: {profile?.joiningDate}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="pt-3 sm:pt-4 border-t border-gray-100">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
            <FiTruck size={14} className="sm:size-18 text-blue-500" />
            Vehicle Information
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Vehicle Type</span>
              <span className="font-medium text-gray-900">{profile?.vehicleType}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Vehicle Number</span>
              <span className="font-medium text-gray-900">{profile?.vehicleNumber}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Driving License</span>
              <span className="font-medium text-gray-900">{profile?.drivingLicense}</span>
            </div>
          </div>
        </div>

        {/* Area Information */}
        <div className="pt-3 sm:pt-4 border-t border-gray-100">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
            <FiMapPin size={14} className="sm:size-18 text-blue-500" />
            Area Information
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Assigned Area</span>
              <span className="font-medium text-gray-900">{profile?.assignedArea}</span>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="pt-3 sm:pt-4 border-t border-gray-100">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
            <FiShield size={14} className="sm:size-18 text-blue-500" />
            Account Status
          </h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
              profile?.accountStatus === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {profile?.accountStatus?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Edit Button */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-full mt-3 sm:mt-4 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
