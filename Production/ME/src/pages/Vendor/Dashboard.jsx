import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiBox, FiTruck, FiDollarSign, FiClock, FiCheckCircle, FiHeart, FiTag, FiDownload, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import AnalyticsCard from '../../components/vendor/AnalyticsCard';
import OrderCard from '../../components/vendor/OrderCard';
import ProductCard from '../../components/vendor/ProductCard';
import { vendorAnalytics, vendorOrders, vendorProducts, vendorOffers } from '../../data';

const VendorDashboard = () => {
  const summary = vendorAnalytics.summary;
  const recentOrders = vendorOrders.slice(0, 4);
  const recommendedProducts = vendorProducts.slice(0, 4);
  const specialOffers = vendorOffers.filter(offer => offer.status === 'active').slice(0, 3);

  const quickActions = [
    { icon: FiBox, label: 'Browse Products', path: '/vendor/products', color: 'blue' },
    { icon: FiShoppingBag, label: 'View Cart', path: '/vendor/cart', color: 'green' },
    { icon: FiTruck, label: 'Track Orders', path: '/vendor/orders', color: 'blue' },
    { icon: FiDownload, label: 'Download Invoices', path: '/vendor/invoices', color: 'purple' },
    { icon: FiTag, label: 'View Offers', path: '/vendor/products', color: 'orange' },
    { icon: FiRefreshCw, label: 'Reorder Products', path: '/vendor/orders', color: 'blue' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Vendor Dashboard"
        subtitle="Manage purchases, track orders, and grow your business efficiently."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AnalyticsCard
          title="Total Orders"
          value={summary.totalOrders}
          change="+12%"
          icon={<FiShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="blue"
          trend={12}
        />
        <AnalyticsCard
          title="Pending Orders"
          value={summary.pendingOrders}
          icon={<FiClock className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="yellow"
        />
        <AnalyticsCard
          title="Delivered Orders"
          value={summary.deliveredOrders}
          icon={<FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="green"
          trend={8}
        />
        <AnalyticsCard
          title="Total Spending"
          value={`₹${summary.totalSpending.toLocaleString()}`}
          change="+18%"
          icon={<FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="green"
          trend={18}
        />
        <AnalyticsCard
          title="This Month Spending"
          value={`₹${summary.thisMonthSpending.toLocaleString()}`}
          change="+17%"
          icon={<FiTrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="blue"
          trend={17}
        />
        <AnalyticsCard
          title="Wishlist Products"
          value={summary.wishlistProducts}
          icon={<FiHeart className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="red"
        />
        <AnalyticsCard
          title="Reward Points"
          value={summary.rewardPoints}
          change="+250"
          icon={<FiTag className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="orange"
        />
        <AnalyticsCard
          title="Processing Orders"
          value={summary.processingOrders}
          icon={<FiClock className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className={`p-2 sm:p-3 rounded-lg bg-${action.color}-500 text-white mb-2 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/vendor/orders" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {recentOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>

      {/* Recommended Products */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recommended Products</h2>
          <Link to="/vendor/products" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {recommendedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Special Offers */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Special Offers</h2>
          <Link to="/vendor/products" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Offers
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {specialOffers.map((offer) => (
            <div key={offer.id} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="px-2 sm:px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium">
                  {offer.discountPercentage}% OFF
                </span>
                <span className="text-xs text-blue-100">
                  Valid until {new Date(offer.validTo).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{offer.title}</h3>
              <p className="text-xs sm:text-sm text-blue-100 mb-2 sm:mb-3">{offer.description}</p>
              <div className="text-xs text-blue-200">
                Min order: ₹{offer.minOrderValue.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
