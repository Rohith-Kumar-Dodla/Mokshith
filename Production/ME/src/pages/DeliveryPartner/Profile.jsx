import React, { useState } from 'react';
import ProfileCard from '../../components/delivery/ProfileCard';
import { FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiShield, FiTruck, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { deliveryProfile } from '../../data/deliveryProfile';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(deliveryProfile);
  const [editedProfile, setEditedProfile] = useState(deliveryProfile);

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfile({ ...editedProfile });
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Delivery Partner Profile</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage your profile information</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FiEdit2 size={16} className="sm:size-18" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <ProfileCard profile={profile} onEdit={handleEdit} />
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <FiUser size={16} className="sm:size-18 text-blue-500" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium flex items-center gap-2">
                    <FiPhone size={14} className="sm:size-16 text-gray-400" />
                    {profile.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium flex items-center gap-2">
                    <FiMail size={14} className="sm:size-16 text-gray-400" />
                    {profile.email}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium flex items-center gap-2">
                  <FiCalendar size={14} className="sm:size-16 text-gray-400" />
                  {profile.joiningDate}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <FiTruck size={16} className="sm:size-18 text-blue-500" />
              Vehicle Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                {isEditing ? (
                  <select
                    value={editedProfile.vehicleType}
                    onChange={(e) => handleChange('vehicleType', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                  </select>
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.vehicleType}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.vehicleNumber}
                    onChange={(e) => handleChange('vehicleNumber', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.vehicleNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Driving License</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.drivingLicense}
                    onChange={(e) => handleChange('drivingLicense', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.drivingLicense}</p>
                )}
              </div>
            </div>
          </div>

          {/* Area Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <FiMapPin size={16} className="sm:size-18 text-blue-500" />
              Area Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Area</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.assignedArea}
                    onChange={(e) => handleChange('assignedArea', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.assignedArea}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.address}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.pincode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <FiShield size={16} className="sm:size-18 text-blue-500" />
              Account Status
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className={`inline-block px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold ${
                profile.accountStatus === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {profile.accountStatus.toUpperCase()}
              </span>
              <p className="text-xs sm:text-sm text-gray-600">
                {profile.accountStatus === 'active' 
                  ? 'Your account is active and you can receive deliveries' 
                  : 'Your account is currently inactive'}
              </p>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.emergencyContact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.emergencyContact.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.emergencyContact.relation}</p>
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <FiX size={16} className="sm:size-18" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <FiSave size={16} className="sm:size-18" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
