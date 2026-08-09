import { useCallback, useEffect, useState } from 'react';
import { getUserFacingErrorMessage } from '../utils/apiResponse';
import authService from '../services/authService';
import settingsService from '../services/settingsService';
import { mapUserVendorAddress, buildVendorAddressPayload } from '../utils/vendorAddress';


function mapProfileForm(user) {
  const payload = user?.data ?? user ?? {};
  return {
    name: payload.name || '',
    email: payload.email || '',
    mobile: payload.mobile || payload.phone || '',
    companyName: payload.companyName || payload.businessName || '',
    businessName: payload.businessName || payload.companyName || '',
    gstNumber: payload.gstNumber || '',
    address: payload.businessAddress || payload.address || '',
    ownerName: payload.ownerName || payload.name || '',
    vendorAddress: mapUserVendorAddress(payload),
    profileImage: payload.profileImage || '',
    upiId: payload.upiId || '',
    qrImage: payload.qrImage || '',
    qrImagePublicId: payload.qrImagePublicId || '',
    twoFactorEnabled: Boolean(payload.twoFactorEnabled),
    vehicleType: payload.vehicleType || '',
    vehicleNumber: payload.vehicleNumber || '',
    licenseNumber: payload.licenseNumber || '',
    serviceArea: payload.serviceArea || '',
  };
}

function mapSettingsForm(settings) {
  const payload = settings?.data ?? settings ?? {};
  return {
    notifications: {
      email: payload.notifications?.email ?? true,
      sms: payload.notifications?.sms ?? true,
      push: payload.notifications?.push ?? true,
      orders: payload.notifications?.orders ?? true,
    },
    preferences: {
      language: payload.preferences?.language || 'en',
      theme: payload.preferences?.theme || 'light',
      dashboardLayout: payload.preferences?.dashboardLayout || 'default',
    },
    businessDetails: payload.businessDetails || '',
  };
}

function mapSession(session) {
  if (!session) return null;
  const deviceInfo =
    session.deviceInfo && typeof session.deviceInfo === 'object' ? session.deviceInfo : {};

  return {
    id: session._id || session.id,
    deviceName: session.deviceName || deviceInfo.deviceName || 'Unknown device',
    browser: session.browser || deviceInfo.browser || deviceInfo.userAgent || 'Browser',
    os: session.os || deviceInfo.os || '',
    ip: session.ip || session.ipAddress || '—',
    location: session.location || '',
    lastActive: session.lastUsedAt || session.lastActive || session.createdAt || null,
  };
}

export function useSettings({ autoLoad = true } = {}) {
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [twoFASetup, setTwoFASetup] = useState(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, settingsRes, sessionsRes] = await Promise.all([
        authService.getCurrentUser(),
        settingsService.getSettings(),
        authService.getSessions().catch(() => ({ data: [] })),
      ]);

      const profileData = profileRes?.data ?? profileRes;
      const settingsData = settingsRes?.data ?? settingsRes;
      const sessionsData = sessionsRes?.data ?? sessionsRes ?? [];

      setProfile(mapProfileForm(profileData));
      setSettings(mapSettingsForm(settingsData));
      const sessionsList = Array.isArray(sessionsData) ? sessionsData : sessionsData?.sessions || [];
      setSessions(sessionsList.map(mapSession).filter(Boolean));
      return { profile: profileData, settings: settingsData };
    } catch (loadError) {
      setError(getUserFacingErrorMessage(loadError, 'Failed to load settings'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadAll();
  }, [autoLoad, loadAll]);

  const saveProfile = useCallback(async (formData) => {
    setSaving(true);
    clearMessages();
    try {
      const response = await authService.updateProfile({
        name: formData.name || formData.ownerName,
        email: formData.email,
        mobile: formData.mobile,
        companyName: formData.companyName || formData.businessName,
        businessName: formData.businessName || formData.companyName,
        gstNumber: formData.gstNumber,
        ownerName: formData.ownerName,
        vendorAddress: buildVendorAddressPayload(formData.vendorAddress || {}),
        upiId: formData.upiId || '',
        qrImage: formData.qrImage || '',
        qrImagePublicId: formData.qrImagePublicId || '',
        vehicleType: formData.vehicleType || undefined,
        vehicleNumber: formData.vehicleNumber || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        serviceArea: formData.serviceArea || undefined,
      });
      const updated = mapProfileForm(response?.data ?? response);
      setProfile(updated);
      setSuccess('Profile updated successfully');
      return updated;
    } catch (saveError) {
      const message = getUserFacingErrorMessage(saveError, 'Failed to update profile');
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [clearMessages]);

  const uploadProfilePhoto = useCallback(async (file) => {
    setSaving(true);
    clearMessages();
    try {
      const response = await authService.uploadProfileImage(file);
      const updated = mapProfileForm(response?.data ?? response);
      setProfile(updated);
      setSuccess('Profile photo updated');
      return updated;
    } catch (uploadError) {
      const message = getUserFacingErrorMessage(uploadError, 'Failed to upload photo');
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [clearMessages]);

  const saveSettings = useCallback(async (formData) => {
    setSaving(true);
    clearMessages();
    try {
      const response = await settingsService.updateSettings(formData);
      const updated = mapSettingsForm(response?.data ?? response);
      setSettings(updated);
      setSuccess('Settings saved successfully');
      return updated;
    } catch (saveError) {
      const message = getUserFacingErrorMessage(saveError, 'Failed to save settings');
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [clearMessages]);

  const changePassword = useCallback(async ({ oldPassword, newPassword }) => {
    setSaving(true);
    clearMessages();
    try {
      await authService.changePassword({ oldPassword, newPassword });
      setSuccess('Password changed successfully. Please sign in again.');
      return true;
    } catch (saveError) {
      const message = getUserFacingErrorMessage(saveError, 'Failed to change password');
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [clearMessages]);

  const logoutAllDevices = useCallback(async () => {
    setSaving(true);
    clearMessages();
    try {
      await authService.logoutAllDevices();
      setSessions([]);
      setSuccess('Logged out from all other devices');
    } catch (logoutError) {
      setError(getUserFacingErrorMessage(logoutError, 'Failed to logout other devices'));
    } finally {
      setSaving(false);
    }
  }, [clearMessages]);

  const revokeSession = useCallback(async (tokenId) => {
    setSaving(true);
    clearMessages();
    try {
      await authService.revokeSession(tokenId);
      setSessions((prev) => prev.filter((s) => s.id !== tokenId));
      setSuccess('Session revoked');
    } catch (revokeError) {
      setError(getUserFacingErrorMessage(revokeError, 'Failed to revoke session'));
    } finally {
      setSaving(false);
    }
  }, [clearMessages]);

  const start2FASetup = useCallback(async () => {
    setSaving(true);
    clearMessages();
    try {
      const response = await authService.enable2FA();
      const payload = response?.data ?? response;
      setTwoFASetup(payload);
      return payload;
    } catch (setupError) {
      const message = getUserFacingErrorMessage(setupError, 'Failed to start 2FA setup');
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [clearMessages]);

  const confirm2FASetup = useCallback(async (code) => {
    setSaving(true);
    clearMessages();
    try {
      await authService.verify2FASetup(code);
      setTwoFASetup(null);
      setProfile((prev) => ({ ...prev, twoFactorEnabled: true }));
      setSuccess('Two-factor authentication enabled');
    } catch (verifyError) {
      setError(getUserFacingErrorMessage(verifyError, 'Invalid verification code'));
      throw verifyError;
    } finally {
      setSaving(false);
    }
  }, [clearMessages]);

  const disable2FA = useCallback(async (password) => {
    setSaving(true);
    clearMessages();
    try {
      await authService.disable2FA(password);
      setProfile((prev) => ({ ...prev, twoFactorEnabled: false }));
      setTwoFASetup(null);
      setSuccess('Two-factor authentication disabled');
    } catch (disableError) {
      setError(getUserFacingErrorMessage(disableError, 'Failed to disable 2FA'));
      throw disableError;
    } finally {
      setSaving(false);
    }
  }, [clearMessages]);

  return {
    profile,
    settings,
    sessions,
    loading,
    saving,
    error,
    success,
    twoFASetup,
    setProfile,
    setSettings,
    clearMessages,
    loadAll,
    saveProfile,
    uploadProfilePhoto,
    saveSettings,
    changePassword,
    logoutAllDevices,
    revokeSession,
    start2FASetup,
    confirm2FASetup,
    disable2FA,
  };
}

export default useSettings;
