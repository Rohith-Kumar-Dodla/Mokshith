import { useCallback, useEffect, useState } from 'react';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';

function mapProfile(user) {
  if (!user) return null;
  const payload = user.data ?? user;
  const defaultAddress = payload.addresses?.find((address) => address.isDefault) || payload.addresses?.[0];

  return {
    id: payload._id || payload.id,
    businessName: payload.businessName || payload.name || '',
    ownerName: payload.name || '',
    email: payload.email || '',
    phone: payload.mobile || payload.phone || '',
    gstNumber: payload.gstNumber || '—',
    address: defaultAddress?.addressLine || payload.address || '—',
    area: defaultAddress?.city || '—',
    state: defaultAddress?.state || '',
    pincode: defaultAddress?.pincode || '',
    registeredDate: payload.createdAt
      ? new Date(payload.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '—',
    status: String(payload.status || 'ACTIVE').toLowerCase(),
    raw: payload,
  };
}

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export function useProfile({ autoLoad = true } = {}) {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(() => mapProfile(authUser));
  const [loading, setLoading] = useState(Boolean(autoLoad));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.getCurrentUser();
      const mapped = mapProfile(response);
      setProfile(mapped);
      return mapped;
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Failed to load profile'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      refreshProfile();
    }
  }, [autoLoad, refreshProfile]);

  const updateProfile = useCallback(
    async (formData) => {
      setSaving(true);
      setError(null);
      try {
        const response = await authService.updateProfile({
          name: formData.ownerName || formData.name,
          email: formData.email,
          mobile: formData.phone || formData.mobile,
        });
        const mapped = mapProfile(response);
        setProfile(mapped);
        setIsEditing(false);
        return mapped;
      } catch (saveError) {
        const message = getErrorMessage(saveError, 'Failed to update profile');
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [refreshProfile]
  );

  return {
    profile,
    loading,
    saving,
    error,
    isEditing,
    setIsEditing,
    refreshProfile,
    updateProfile,
  };
}

export default useProfile;
