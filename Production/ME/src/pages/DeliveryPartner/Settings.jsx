import React, { useState } from 'react';
import { FiUser, FiBell, FiShield, FiTruck, FiLock, FiSmartphone, FiMail, FiCheck, FiSave } from 'react-icons/fi';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saveMessage, setSaveMessage] = useState('');

  const [profileSettings, setProfileSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    language: 'en'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newOrderAlerts: true,
    statusUpdateAlerts: true,
    earningsAlerts: true,
    systemNotifications: true,
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true
  });

  const [deliveryPreferences, setDeliveryPreferences] = useState({
    autoAcceptOrders: false,
    preferredAreas: ['Hyderabad Central'],
    workingHours: {
      start: '08:00',
      end: '20:00'
    },
    maxOrdersPerDay: 15
  });

  const handleSave = () => {
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: FiUser },
    { id: 'notifications', label: 'Notification Settings', icon: FiBell },
    { id: 'security', label: 'Security Settings', icon: FiShield },
    { id: 'delivery', label: 'Delivery Preferences', icon: FiTruck }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-sm">
          <FiCheck size={16} className="sm:size-20" />
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <nav className="space-y-1 sm:space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all text-xs sm:text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={16} className="sm:size-18" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                <FiUser size={16} className="sm:size-20 text-blue-500" />
                Profile Settings
              </h3>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-600">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileSettings.emailNotifications}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-xs text-gray-600">Receive notifications via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileSettings.smsNotifications}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Push Notifications</p>
                    <p className="text-xs text-gray-600">Receive push notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileSettings.pushNotifications}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    value={profileSettings.language}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                <FiBell size={16} className="sm:size-20 text-blue-500" />
                Notification Settings
              </h3>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">New Order Alerts</p>
                    <p className="text-xs text-gray-600">Get notified when new orders are assigned</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.newOrderAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, newOrderAlerts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Status Update Alerts</p>
                    <p className="text-xs text-gray-600">Get notified about order status changes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.statusUpdateAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, statusUpdateAlerts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Earnings Alerts</p>
                    <p className="text-xs text-gray-600">Get notified about earnings and bonuses</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.earningsAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, earningsAlerts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">System Notifications</p>
                    <p className="text-xs text-gray-600">Receive system updates and announcements</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.systemNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemNotifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 flex items-center gap-2">
                      <FiMail size={14} className="sm:size-16" />
                      Email Alerts
                    </p>
                    <p className="text-xs text-gray-600">Receive alerts via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 flex items-center gap-2">
                      <FiSmartphone size={14} className="sm:size-16" />
                      SMS Alerts
                    </p>
                    <p className="text-xs text-gray-600">Receive alerts via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsAlerts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Push Notifications</p>
                    <p className="text-xs text-gray-600">Receive push notifications on device</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                <FiShield size={16} className="sm:size-20 text-blue-500" />
                Security Settings
              </h3>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Two Factor Authentication</p>
                    <p className="text-xs text-gray-600">Add an extra layer of security</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Login Alerts</p>
                    <p className="text-xs text-gray-600">Get notified of new login attempts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.loginAlerts}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginAlerts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="border-t border-gray-200 pt-4 sm:pt-6">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <FiLock size={14} className="sm:size-18 text-blue-500" />
                    Change Password
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter current password"
                        className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button className="px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 sm:pt-6">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3 sm:mb-4">Login History</h4>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-1 sm:gap-2">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-900">Chrome on Windows</p>
                        <p className="text-xs text-gray-500">Hyderabad, India</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-gray-900">Today, 10:30 AM</p>
                        <p className="text-xs text-green-600">Current Session</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-1 sm:gap-2">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-900">Chrome on Mobile</p>
                        <p className="text-xs text-gray-500">Hyderabad, India</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-gray-900">Yesterday, 8:15 PM</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Preferences */}
          {activeTab === 'delivery' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                <FiTruck size={16} className="sm:size-20 text-blue-500" />
                Delivery Preferences
              </h3>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Auto Accept Orders</p>
                    <p className="text-xs text-gray-600">Automatically accept orders in your area</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryPreferences.autoAcceptOrders}
                      onChange={(e) => setDeliveryPreferences(prev => ({ ...prev, autoAcceptOrders: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {deliveryPreferences.preferredAreas.map((area, index) => (
                      <span key={index} className="inline-flex items-center px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm">
                        {area}
                        <button className="ml-2 text-blue-700 hover:text-blue-900 text-sm">×</button>
                      </span>
                    ))}
                    <button className="px-2 sm:px-3 py-1 border border-dashed border-gray-300 text-gray-600 rounded-full text-xs sm:text-sm hover:border-blue-500 hover:text-blue-600">
                      + Add Area
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours Start</label>
                    <input
                      type="time"
                      value={deliveryPreferences.workingHours.start}
                      onChange={(e) => setDeliveryPreferences(prev => ({ 
                        ...prev, 
                        workingHours: { ...prev.workingHours, start: e.target.value } 
                      }))}
                      className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours End</label>
                    <input
                      type="time"
                      value={deliveryPreferences.workingHours.end}
                      onChange={(e) => setDeliveryPreferences(prev => ({ 
                        ...prev, 
                        workingHours: { ...prev.workingHours, end: e.target.value } 
                      }))}
                      className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Orders Per Day</label>
                  <input
                    type="number"
                    value={deliveryPreferences.maxOrdersPerDay}
                    onChange={(e) => setDeliveryPreferences(prev => ({ ...prev, maxOrdersPerDay: parseInt(e.target.value) }))}
                    className="w-full px-3 sm:px-4 py-2.5 h-10 sm:h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    min="1"
                    max="50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <FiSave size={16} className="sm:size-18" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
