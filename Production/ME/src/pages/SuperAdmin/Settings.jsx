import React, { useState } from 'react';
import { FiUser, FiBell, FiShield, FiMoon, FiSun, FiDownload, FiCalendar, FiMapPin } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'theme', label: 'Theme', icon: FiMoon },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account settings and preferences."
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[48px] ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} sm:size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'profile' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-gray-100">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl sm:text-3xl font-bold flex-shrink-0">
                  SA
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Super Admin</h3>
                  <p className="text-sm sm:text-base text-gray-500">superadmin@mokshith.com</p>
                  <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                    Change Profile Picture
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Super Admin"
                    className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="superadmin@mokshith.com"
                    className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Phone</label>
                  <input
                    type="tel"
                    defaultValue="+91 98765 43210"
                    className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Role</label>
                  <input
                    type="text"
                    defaultValue="Super Admin"
                    disabled
                    className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button className="px-4 sm:px-6 py-2.5 h-12 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button className="px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Email Notifications</h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    'New vendor registrations',
                    'Admin additions',
                    'Order completions',
                    'System alerts',
                    'Daily reports'
                  ].map((item, index) => (
                    <label key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <span className="text-sm sm:text-base text-gray-700">{item}</span>
                      <input type="checkbox" defaultChecked={index < 3} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">SMS Notifications</h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    'Critical system alerts',
                    'Security notifications',
                    'Urgent vendor approvals'
                  ].map((item, index) => (
                    <label key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <span className="text-sm sm:text-base text-gray-700">{item}</span>
                      <input type="checkbox" defaultChecked={index === 0} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Push Notifications</h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    'Real-time order updates',
                    'Delivery partner status',
                    'Revenue milestones'
                  ].map((item, index) => (
                    <label key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <span className="text-sm sm:text-base text-gray-700">{item}</span>
                      <input type="checkbox" defaultChecked={index < 2} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button className="px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Change Password</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                <label className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="text-sm sm:text-base text-gray-700 font-medium">Enable 2FA</span>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                </label>
              </div>

              <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Login History</h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { device: 'Chrome on Windows', location: 'Hyderabad, India', time: '2 minutes ago', status: 'active' },
                    { device: 'Firefox on Mac', location: 'Hyderabad, India', time: '2 days ago', status: 'active' },
                    { device: 'Chrome on Mobile', location: 'Secunderabad, India', time: '1 week ago', status: 'expired' },
                  ].map((login, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <FiMapPin className="text-blue-600" size={18} sm:size={20} />
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-medium text-gray-900">{login.device}</p>
                          <p className="text-xs sm:text-sm text-gray-500">{login.location}</p>
                        </div>
                      </div>
                      <div className="text-right sm:text-left w-full sm:w-auto">
                        <p className="text-xs sm:text-sm text-gray-600">{login.time}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${login.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {login.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button className="px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Update Security Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Appearance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <label className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2 border-blue-500">
                    <FiSun className="text-yellow-500" size={24} sm:size={32} />
                    <div>
                      <p className="text-sm sm:text-base font-medium text-gray-900">Light Mode</p>
                      <p className="text-xs sm:text-sm text-gray-500">Clean and bright interface</p>
                    </div>
                    <input type="radio" name="theme" defaultChecked className="ml-auto" />
                  </label>
                  <label className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2 border-transparent">
                    <FiMoon className="text-blue-500" size={24} sm:size={32} />
                    <div>
                      <p className="text-sm sm:text-base font-medium text-gray-900">Dark Mode</p>
                      <p className="text-xs sm:text-sm text-gray-500">Easy on the eyes</p>
                    </div>
                    <input type="radio" name="theme" className="ml-auto" />
                  </label>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reports</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { title: 'Sales Report', icon: FiDownload, color: 'blue' },
                    { title: 'Vendor Report', icon: FiDownload, color: 'green' },
                    { title: 'Admin Report', icon: FiDownload, color: 'purple' },
                    { title: 'Delivery Report', icon: FiDownload, color: 'orange' },
                    { title: 'Revenue Report', icon: FiDownload, color: 'teal' },
                    { title: 'Custom Report', icon: FiCalendar, color: 'red' },
                  ].map((report, index) => (
                    <button
                      key={index}
                      className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors min-h-[48px]"
                    >
                      <report.icon className={`text-${report.color}-600`} size={18} sm:size={20} />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{report.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button className="px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
