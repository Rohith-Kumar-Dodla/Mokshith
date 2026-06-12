import React, { useEffect, useState } from 'react';
import ProfileCard from '../../components/delivery/ProfileCard';
import { FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiShield, FiTruck, FiEdit2, FiSave, FiX, FiRefreshCw } from 'react-icons/fi';
import useDelivery from '../../hooks/useDelivery';

const EMPTY_PROFILE = {
  name: '',
  phone: '',
  email: '',
  vehicleType: 'Bike',
  vehicleNumber: '',
  drivingLicense: '',
  assignedArea: '',
  address: '',
  city: '',
  pincode: '',
  joiningDate: '—',
  accountStatus: 'active',
  emergencyContact: { name: '—', phone: '—', relation: '—' },
};

const ProfileSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="h-80 bg-gray-200 rounded-xl" />
      <div className="lg:col-span-2 space-y-4">
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    </div>
  </div>
);

const Profile = () => {
  const {
    profile: loadedProfile,
    loading,
    profileError,
    updateProfile,
    refreshProfile,
    actionLoading,
  } = useDelivery();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(EMPTY_PROFILE);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (loadedProfile) {
      setEditedProfile({ ...EMPTY_PROFILE, ...loadedProfile });
    }
  }, [loadedProfile]);

  const handleEdit = () => {
    if (!loadedProfile) return;
    setEditedProfile({ ...EMPTY_PROFILE, ...loadedProfile });
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (loadedProfile) {
      setEditedProfile({ ...EMPTY_PROFILE, ...loadedProfile });
    }
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      const updated = await updateProfile({
        name: editedProfile.name,
        email: editedProfile.email,
        mobile: editedProfile.phone,
      });
      setEditedProfile({ ...EMPTY_PROFILE, ...updated });
      setIsEditing(false);
    } catch (saveErr) {
      setSaveError(saveErr.message);
    }
  };

  const handleChange = (field, value) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <ProfileSkeleton />
      </div>
    );
  }

  if (profileError && !loadedProfile) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="text-sm text-red-700 mb-4">{profileError}</p>
          <button
            type="button"
            onClick={refreshProfile}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            <FiRefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!loadedProfile) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center">
          <p className="text-sm text-gray-600 mb-4">No profile data available.</p>
          <button
            type="button"
            onClick={refreshProfile}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <FiRefreshCw size={16} />
            Load Profile
          </button>
        </div>
      </div>
    );
  }

  const profile = loadedProfile;
  const formProfile = isEditing ? editedProfile : profile;

  return (
    <div className="space-y-4 sm:space-y-6">
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
            <FiEdit2 size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {(profileError || saveError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError || profileError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <ProfileCard profile={profile} onEdit={handleEdit} />
        </div>

        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <FiUser size={16} className="text-blue-500" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formProfile.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.name || '—'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formProfile.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium flex items-center gap-2">
                    <FiPhone size={14} className="text-gray-400" />
                    {profile.phone || '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formProfile.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-900 font-medium flex items-center gap-2">
                    <FiMail size={14} className="text-gray-400" />
                    {profile.email || '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium flex items-center gap-2">
                  <FiCalendar size={14} className="text-gray-400" />
                  {profile.joiningDate || '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <FiTruck size={16} className="text-blue-500" />
              Vehicle Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.vehicleType || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.vehicleNumber || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Driving License</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.drivingLicense || '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <FiMapPin size={16} className="text-blue-500" />
              Area Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Area</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.assignedArea || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.address || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.city || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.pincode || '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <FiShield size={16} className="text-blue-500" />
              Account Status
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className={`inline-block px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold ${
                profile.accountStatus === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {(profile.accountStatus || 'unknown').toUpperCase()}
              </span>
              <p className="text-xs sm:text-sm text-gray-600">
                {profile.accountStatus === 'active'
                  ? 'Your account is active and you can receive deliveries'
                  : 'Your account is currently inactive'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 sm:mb-6">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.emergencyContact?.name || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.emergencyContact?.phone || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.emergencyContact?.relation || '—'}</p>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <FiX size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FiSave size={16} />
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
