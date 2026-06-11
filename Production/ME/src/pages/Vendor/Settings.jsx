import React, { useState } from 'react';
import PageHeader from '../../components/vendor/PageHeader';
import { FiBell, FiLock, FiUser, FiMail, FiSmartphone, FiShield, FiClock } from 'react-icons/fi';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: 'Account Settings', icon: FiUser },
    { id: 'notifications', label: 'Notification Settings', icon: FiBell },
    { id: 'security', label: 'Security Settings', icon: FiLock },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences and security."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === 'account' && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Account Settings</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Business Information */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                      <input
                        type="text"
                        defaultValue="Fresh Mart Grocery"
                        className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                      <input
                        type="text"
                        defaultValue="Rajesh Kumar"
                        className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        defaultValue="+91 98765 43210"
                        className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue="freshmart@example.com"
                        className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Business Address</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        defaultValue="Shop No. 12, Main Market, Hyderabad East"
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button className="px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Notification Settings</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Order Notifications */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Order Updates</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { label: 'Order confirmed', desc: 'Get notified when your order is confirmed' },
                      { label: 'Order shipped', desc: 'Get notified when your order is shipped' },
                      { label: 'Order delivered', desc: 'Get notified when your order is delivered' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] sm:after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promotional Notifications */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Promotions & Offers</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { label: 'Special offers', desc: 'Get notified about special offers and discounts' },
                      { label: 'New products', desc: 'Get notified when new products are available' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] sm:after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invoice Notifications */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Invoice Notifications</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { label: 'Invoice generated', desc: 'Get notified when invoice is generated' },
                      { label: 'Payment reminders', desc: 'Get payment reminders for pending invoices' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] sm:after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notification Channels */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Notification Channels</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { label: 'Email alerts', icon: FiMail },
                      { label: 'SMS alerts', icon: FiSmartphone },
                      { label: 'Push notifications', icon: FiBell },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                          <span className="text-xs sm:text-sm font-medium text-gray-900">{item.label}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] sm:after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Security Settings</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Change Password */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Change Password</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button className="px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Two Factor Authentication */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Two-Factor Authentication</h3>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">Enable 2FA</p>
                        <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] sm:after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Login History */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Recent Login History</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { device: 'Chrome on Windows', location: 'Hyderabad, India', time: '2 hours ago', status: 'Current' },
                      { device: 'Firefox on Windows', location: 'Hyderabad, India', time: '1 day ago', status: 'Previous' },
                      { device: 'Chrome on Mobile', location: 'Hyderabad, India', time: '3 days ago', status: 'Previous' },
                    ].map((login, index) => (
                      <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FiClock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-900">{login.device}</p>
                            <p className="text-xs text-gray-500">{login.location} • {login.time}</p>
                          </div>
                        </div>
                        {login.status === 'Current' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Actions */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Account Actions</h3>
                  <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs sm:text-sm text-red-700 mb-2 sm:mb-3">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button className="px-3 sm:px-4 py-2.5 h-10 sm:h-12 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
