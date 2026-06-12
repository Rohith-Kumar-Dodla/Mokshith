import React, { useEffect, useState } from 'react';
import {
  FiBell,
  FiLock,
  FiUser,
  FiShield,
  FiMonitor,
  FiSave,
  FiLogOut,
  FiRefreshCw,
} from 'react-icons/fi';
import useSettings from '../../hooks/useSettings';
import { getPasswordRequirementsText } from '../../utils/authValidationPolicy';

const VEHICLE_TYPES = [
  { value: 'TWO_WHEELER', label: 'Two Wheeler' },
  { value: 'THREE_WHEELER', label: 'Three Wheeler' },
  { value: 'FOUR_WHEELER', label: 'Four Wheeler' },
  { value: 'HEAVY_VEHICLE', label: 'Heavy Vehicle' },
];

const inputClass =
  'w-full px-3 sm:px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

function Toast({ message, type, onClose }) {
  if (!message) return null;
  const colors = type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200';
  return (
    <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 px-4 py-3 rounded-lg border shadow-lg text-sm ${colors}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{message}</span>
        <button type="button" onClick={onClose} className="text-current opacity-70 hover:opacity-100">×</button>
      </div>
    </div>
  );
}

export default function SettingsPage({ PageHeader, role = 'vendor' }) {
  const {
    profile,
    settings,
    sessions,
    loading,
    saving,
    error,
    success,
    twoFASetup,
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
    setProfile,
    setSettings,
  } = useSettings();

  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({});
  const [settingsForm, setSettingsForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [otpCode, setOtpCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisable2FA, setShowDisable2FA] = useState(false);

  useEffect(() => {
    if (profile) setProfileForm(profile);
  }, [profile]);

  useEffect(() => {
    if (settings) setSettingsForm(settings);
  }, [settings]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'account', label: 'Account', icon: FiLock },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'preferences', label: 'Preferences', icon: FiMonitor },
  ];

  const isDelivery = role === 'delivery';
  const isVendor = role === 'vendor';

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    await saveProfile(profileForm);
    if (settingsForm.businessDetails !== undefined) {
      await saveSettings({ businessDetails: settingsForm.businessDetails });
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    await saveSettings(settingsForm);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      clearMessages();
      return;
    }
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await uploadProfilePhoto(file);
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader title="Settings" subtitle="Loading your settings..." />
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-600 animate-pulse">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account, security, and preferences." />

      <Toast message={error} type="error" onClose={clearMessages} />
      <Toast message={success} type="success" onClose={clearMessages} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-4 overflow-x-auto">
            <nav className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Profile Settings</h2>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 overflow-hidden shrink-0">
                  {profileForm.profileImage ? (
                    <img src={profileForm.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-semibold">
                      {(profileForm.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={saving} />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input className={inputClass} value={profileForm.name || ''} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input className={inputClass} value={profileForm.mobile || ''} onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className={inputClass} value={profileForm.email || ''} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required />
                </div>
                {(isVendor || role === 'admin' || role === 'super-admin') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input className={inputClass} value={profileForm.companyName || ''} onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                      <input className={inputClass} value={profileForm.gstNumber || ''} onChange={(e) => setProfileForm({ ...profileForm, gstNumber: e.target.value.toUpperCase() })} />
                    </div>
                  </>
                )}
                {isDelivery && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                      <select className={inputClass} value={profileForm.vehicleType || ''} onChange={(e) => setProfileForm({ ...profileForm, vehicleType: e.target.value })}>
                        <option value="">Select vehicle type</option>
                        {VEHICLE_TYPES.map((v) => (
                          <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                      <input className={inputClass} value={profileForm.vehicleNumber || ''} onChange={(e) => setProfileForm({ ...profileForm, vehicleNumber: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                      <input className={inputClass} value={profileForm.licenseNumber || ''} onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })} />
                    </div>
                  </>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea className={inputClass} rows={3} value={profileForm.address || ''} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                </div>
                {(isVendor || role === 'admin') && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Details</label>
                    <textarea
                      className={inputClass}
                      rows={3}
                      value={settingsForm.businessDetails || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, businessDetails: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                <FiSave size={16} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4 sm:space-y-6">
              <form onSubmit={handlePasswordSubmit} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Change Password</h2>
                <p className="text-xs sm:text-sm text-gray-500">{getPasswordRequirementsText()}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input type="password" className={inputClass} value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input type="password" className={inputClass} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input type="password" className={inputClass} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                  Update Password
                </button>
              </form>

              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Active Sessions</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Manage devices logged into your account</p>
                  </div>
                  <button type="button" onClick={logoutAllDevices} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50">
                    <FiLogOut size={16} /> Logout All Devices
                  </button>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No active sessions found.</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{session.deviceName}</p>
                          <p className="text-xs text-gray-500">
                            {[session.browser, session.os].filter(Boolean).join(' · ') || 'Browser'} · {session.ip}
                            {session.location ? ` · ${session.location}` : ''}
                          </p>
                        </div>
                        <button type="button" onClick={() => revokeSession(session.id)} disabled={saving} className="text-sm text-red-600 hover:text-red-800">
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600">
                {profile?.twoFactorEnabled ? '2FA is enabled on your account.' : 'Add an extra layer of security to your account.'}
              </p>

              {!profile?.twoFactorEnabled && !twoFASetup && (
                <button type="button" onClick={start2FASetup} disabled={saving} className="px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  Enable 2FA
                </button>
              )}

              {twoFASetup && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  {twoFASetup.qrCode && (
                    <div className="flex flex-col items-center gap-3">
                      <img src={twoFASetup.qrCode} alt="2FA QR Code" className="w-40 h-40 sm:w-48 sm:h-48" />
                      <p className="text-xs text-gray-500 break-all">Manual key: {twoFASetup.secret}</p>
                    </div>
                  )}
                  {twoFASetup.backupCodes?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Backup Codes (save these securely)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {twoFASetup.backupCodes.map((code) => (
                          <code key={code} className="px-2 py-1 bg-white border rounded text-xs font-mono">{code}</code>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP from authenticator app</label>
                    <input className={inputClass} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="6-digit code" maxLength={8} />
                  </div>
                  <button type="button" onClick={() => confirm2FASetup(otpCode)} disabled={saving || !otpCode} className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                    Verify & Enable
                  </button>
                </div>
              )}

              {profile?.twoFactorEnabled && (
                <div className="space-y-3">
                  {!showDisable2FA ? (
                    <button type="button" onClick={() => setShowDisable2FA(true)} className="px-4 py-2.5 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50">
                      Disable 2FA
                    </button>
                  ) : (
                    <div className="space-y-3 p-4 bg-red-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700">Enter password to disable 2FA</label>
                      <input type="password" className={inputClass} value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => disable2FA(disablePassword)} disabled={saving} className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm">Confirm Disable</button>
                        <button type="button" onClick={() => setShowDisable2FA(false)} className="px-4 py-2.5 border rounded-lg text-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <form onSubmit={handleSettingsSubmit} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Notification Settings</h2>
              {['email', 'sms', 'push', 'orders'].map((key) => (
                <label key={key} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700 capitalize">{key === 'orders' ? 'Order Notifications' : `${key} Notifications`}</span>
                  <input
                    type="checkbox"
                    checked={settingsForm.notifications?.[key] ?? false}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        notifications: { ...settingsForm.notifications, [key]: e.target.checked },
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                <FiSave size={16} /> Save Notifications
              </button>
            </form>
          )}

          {activeTab === 'preferences' && (
            <form onSubmit={handleSettingsSubmit} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Preferences</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select className={inputClass} value={settingsForm.preferences?.language || 'en'} onChange={(e) => setSettingsForm({ ...settingsForm, preferences: { ...settingsForm.preferences, language: e.target.value } })}>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                  <select className={inputClass} value={settingsForm.preferences?.theme || 'light'} onChange={(e) => setSettingsForm({ ...settingsForm, preferences: { ...settingsForm.preferences, theme: e.target.value } })}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dashboard Layout</label>
                  <select className={inputClass} value={settingsForm.preferences?.dashboardLayout || 'default'} onChange={(e) => setSettingsForm({ ...settingsForm, preferences: { ...settingsForm.preferences, dashboardLayout: e.target.value } })}>
                    <option value="default">Default</option>
                    <option value="compact">Compact</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                <FiSave size={16} /> Save Preferences
              </button>
            </form>
          )}

          <button type="button" onClick={loadAll} disabled={loading} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
