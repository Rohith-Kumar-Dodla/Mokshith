import React, { useEffect, useState } from 'react';
import { FiEdit2, FiSave, FiX } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import AnalyticsCard from '../../components/vendor/AnalyticsCard';
import useProfile from '../../hooks/useProfile';
import useVendorAnalytics from '../../hooks/useVendorAnalytics';

const Profile = () => {
  const { profile, loading, saving, error, isEditing, setIsEditing, updateProfile } = useProfile();
  const { analytics, loading: analyticsLoading, error: analyticsError } = useVendorAnalytics();
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        ownerName: profile.ownerName || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const summary = analytics.summary;
  const topCategories = analytics.topCategories;
  const frequentlyOrdered = analytics.frequentlyOrderedProducts;
  const monthlySpending = analytics.monthlySpending;
  const maxMonthlyAmount = Math.max(...monthlySpending.map((month) => month.amount), 1);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
    } catch {
      // Error surfaced via hook state.
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader title="Profile" subtitle="Manage your business information and view purchase analytics." />
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your business information and view purchase analytics."
      />

      {(error || analyticsError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || analyticsError}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Business Information</h2>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <FiEdit2 size={16} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <FiX size={16} />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <FiSave size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">{profile?.businessName || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            ) : (
              <p className="text-gray-900 font-medium text-xs sm:text-sm">{profile?.ownerName || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            ) : (
              <p className="text-gray-900 font-medium text-xs sm:text-sm">{profile?.phone || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            ) : (
              <p className="text-gray-900 font-medium text-xs sm:text-sm">{profile?.email || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">{profile?.gstNumber || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">{profile?.address || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">{profile?.area || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">{profile?.registeredDate || '—'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Purchase Analytics</h2>

        {analyticsLoading ? (
          <p className="text-sm text-gray-500">Loading analytics...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <AnalyticsCard title="Total Orders" value={summary.totalOrders} color="blue" />
            </div>

            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Monthly Spending</h3>
              {monthlySpending.length === 0 ? (
                <p className="text-sm text-gray-500">No spending data yet.</p>
              ) : (
                <div className="flex items-end gap-1 sm:gap-2 h-24 sm:h-32">
                  {monthlySpending.map((month) => (
                    <div key={month.month} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${(month.amount / maxMonthlyAmount) * 100}%`, minHeight: month.amount > 0 ? '8px' : '0' }}
                      />
                      <span className="text-xs text-gray-600 mt-1 sm:mt-2">{month.month}</span>
                      <span className="text-xs text-gray-500">₹{(month.amount / 1000).toFixed(1)}k</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Top Categories</h3>
              {topCategories.length === 0 ? (
                <p className="text-sm text-gray-500">No category data available yet.</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {topCategories.map((category) => (
                    <div key={category.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs sm:text-sm text-gray-700">{category.category}</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900">₹{category.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                        <div className="bg-blue-500 h-1.5 sm:h-2 rounded-full" style={{ width: `${category.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Frequently Ordered Products</h3>
              {frequentlyOrdered.length === 0 ? (
                <p className="text-sm text-gray-500">No product order history yet.</p>
              ) : (
                <div className="space-y-2">
                  {frequentlyOrdered.map((product, index) => (
                    <div key={product.productName} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{product.productName}</p>
                        <p className="text-xs text-gray-500">
                          {product.orderCount} orders • {product.totalQuantity} units total
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">#{index + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Status</h2>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${profile?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize">{profile?.status || 'unknown'}</span>
          <span className="text-xs sm:text-sm text-gray-500">• Account status from backend</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
