import React, { useState } from 'react';
import { FiUser, FiBell, FiShield, FiMapPin, FiSliders, FiSave, FiCamera } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import { getPasswordRequirementsText } from '../../utils/authValidationPolicy';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'area', label: 'Area Configuration', icon: FiMapPin },
    { id: 'preferences', label: 'Preferences', icon: FiSliders },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and application preferences"
      />

      {/* Settings Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 border-b-2 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={14} sm:size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <Card className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                  RK
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors min-h-[32px] min-w-[32px]">
                  <FiCamera size={12} sm:size={16} className="text-gray-600" />
                </button>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Rajesh Kumar</h3>
                <p className="text-xs sm:text-sm text-gray-600">Admin • Hyderabad East</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">First Name</label>
                <input
                  type="text"
                  defaultValue="Rajesh"
                  className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Last Name</label>
                <input
                  type="text"
                  defaultValue="Kumar"
                  className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="rajesh.kumar@mokshith.com"
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
            </div>

            <div className="flex justify-end">
              <button className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium">
                <FiSave size={14} sm:size={18} />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <Card className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Notification Preferences</h3>
            
            {[
              { id: 'new_vendor', label: 'New Vendor Registration', description: 'Get notified when a new vendor registers' },
              { id: 'low_stock', label: 'Low Stock Alerts', description: 'Alert when products are running low on stock' },
              { id: 'large_order', label: 'Large Order Received', description: 'Notify when orders exceed a threshold' },
              { id: 'order_delivered', label: 'Order Delivered', description: 'Notification when orders are delivered' },
              { id: 'inventory_updated', label: 'Inventory Updated', description: 'Alert when inventory is updated' },
              { id: 'delivery_assigned', label: 'Delivery Assigned', description: 'Notify when delivery is assigned' },
            ].map((notification) => (
              <div key={notification.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{notification.label}</p>
                  <p className="text-xs text-gray-600">{notification.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}

            <div className="flex justify-end">
              <button className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium">
                <FiSave size={14} sm:size={18} />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Card className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Security Settings</h3>

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
                <p className="text-gray-500 text-sm mt-1">{getPasswordRequirementsText()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Two-Factor Authentication</h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">Enable 2FA</p>
                  <p className="text-xs text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium">
                <FiSave size={14} sm:size={18} />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Area Configuration */}
      {activeTab === 'area' && (
        <Card className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Area Configuration</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Assigned Area</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">Hyderabad East</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Area Code</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">HYD-E-001</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Coverage Radius</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">25 KM</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Vendor Count</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">89</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Product Count</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">456</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Delivery Partners</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">12</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-600">Note: Area configuration is managed by Super Admin. Contact your administrator for changes.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Preferences */}
      {activeTab === 'preferences' && (
        <Card className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Application Preferences</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Language</label>
                <select className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="te">Telugu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Timezone</label>
                <select className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="IST">Indian Standard Time (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Date Format</label>
                <select className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Currency</label>
                <select className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Display Settings</h4>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Dark Mode</p>
                    <p className="text-xs text-gray-600">Switch to dark theme</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Compact View</p>
                    <p className="text-xs text-gray-600">Use compact layout for tables</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium">
                <FiSave size={14} sm:size={18} />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Settings;
