import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiBox, FiTruck, FiDollarSign, FiClock, FiCheckCircle, FiHeart, FiTag, FiDownload, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import AnalyticsCard from '../../components/vendor/AnalyticsCard';
import OrderCard from '../../components/vendor/OrderCard';
import ProductCard from '../../components/vendor/ProductCard';
import useProducts from '../../hooks/useProducts';
import useOrders from '../../hooks/useOrders';
import useWishlist from '../../hooks/useWishlist';
import useVendorAnalytics from '../../hooks/useVendorAnalytics';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useProducts();
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { itemCount: wishlistCount } = useWishlist();
  const { analytics, loading: analyticsLoading, error: analyticsError } = useVendorAnalytics();

  const loading = ordersLoading || analyticsLoading;
  const error = ordersError || analyticsError;
  const summary = analytics.summary;
  const recentOrders = orders.slice(0, 4);
  const recommendedProducts = products.slice(0, 4);

  const quickActions = [
    { icon: FiBox, label: 'Browse Products', path: '/vendor/products', color: 'blue' },
    { icon: FiShoppingBag, label: 'View Cart', path: '/vendor/cart', color: 'green' },
    { icon: FiTruck, label: 'Track Orders', path: '/vendor/orders', color: 'blue' },
    { icon: FiDownload, label: 'Download Invoices', path: '/vendor/invoices', color: 'purple' },
    { icon: FiTag, label: 'View Products', path: '/vendor/products', color: 'orange' },
    { icon: FiRefreshCw, label: 'Reorder Products', path: '/vendor/orders', color: 'blue' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Vendor Dashboard"
        subtitle="Manage purchases, track orders, and grow your business efficiently."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <AnalyticsCard
              title="Total Orders"
              value={summary.totalOrders}
              icon={<FiShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="blue"
            />
            <AnalyticsCard
              title="Delivered Orders"
              value={orders.filter((order) => order.status === 'delivered').length}
              icon={<FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="green"
            />
            <AnalyticsCard
              title="Total Spending"
              value={`₹${summary.totalSpending.toLocaleString('en-IN')}`}
              icon={<FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="green"
            />
            <AnalyticsCard
              title="This Month Spending"
              value={`₹${summary.thisMonthSpending.toLocaleString('en-IN')}`}
              icon={<FiTrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="blue"
            />
            <AnalyticsCard
              title="Wishlist Products"
              value={wishlistCount}
              icon={<FiHeart className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="red"
            />
            <AnalyticsCard
              title="Available Credit"
              value={`₹${summary.availableCredit.toLocaleString('en-IN')}`}
              icon={<FiTag className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="orange"
            />
            <AnalyticsCard
              title="Pending Orders"
              value={orders.filter((order) => order.status === 'pending').length}
              icon={<FiClock className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="yellow"
            />
            <AnalyticsCard
              title="Processing Orders"
              value={orders.filter((order) => order.status === 'processing').length}
              icon={<FiClock className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="yellow"
            />
          </div>

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

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link to="/vendor/orders" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={(selectedOrder) => navigate(`/vendor/orders/${selectedOrder.id}`)}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-500 col-span-full">No recent orders yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recommended Products</h2>
              <Link to="/vendor/products" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </Link>
            </div>
            {productsLoading ? (
              <p className="text-sm text-gray-500">Loading products...</p>
            ) : recommendedProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No products available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {recommendedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          {analytics.topCategories.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Top Categories</h2>
              <div className="space-y-3">
                {analytics.topCategories.slice(0, 3).map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{category.category}</span>
                      <span className="text-sm font-medium text-gray-900">₹{category.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${category.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VendorDashboard;
