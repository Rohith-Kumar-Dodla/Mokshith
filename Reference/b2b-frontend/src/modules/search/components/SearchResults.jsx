import { Link } from 'react-router-dom';
import { Package, Building2, ShoppingCart } from 'lucide-react';
import { routes } from '../../../routes/routeConfig.js';
import EmptyState from '../../../components/ui/EmptyState.jsx';

const SearchResults = ({ results, activeTab, loading, query }) => {
  if (loading) {
    return <div className="py-12 text-center text-gray-500">Searching...</div>;
  }

  if (!query?.trim()) {
    return (
      <EmptyState
        icon={Package}
        title="Start searching"
        description="Enter a search term to find products, vendors, or orders."
      />
    );
  }

  const showProducts = activeTab === 'all' || activeTab === 'products';
  const showVendors = activeTab === 'all' || activeTab === 'vendors';
  const showOrders = activeTab === 'all' || activeTab === 'orders';

  const hasResults =
    (showProducts && results.products?.length) ||
    (showVendors && results.vendors?.length) ||
    (showOrders && results.orders?.length);

  if (!hasResults) {
    return (
      <EmptyState
        icon={Package}
        title="No results found"
        description={`No matches for "${query}". Try a different search term.`}
      />
    );
  }

  return (
    <div className="space-y-8">
      {showProducts && results.products?.length > 0 && (
        <ResultSection title="Products" icon={Package} count={results.products.length}>
          {results.products.map((item) => (
            <Link
              key={item._id || item.id}
              to={`${routes.PRODUCTS}/${item._id || item.id}`}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">{item.categoryId?.name || item.category}</p>
              </div>
              <span className="font-bold text-blue-600">₹{item.price?.toLocaleString()}</span>
            </Link>
          ))}
        </ResultSection>
      )}

      {showVendors && results.vendors?.length > 0 && (
        <ResultSection title="Vendors" icon={Building2} count={results.vendors.length}>
          {results.vendors.map((vendor) => (
            <div
              key={vendor._id || vendor.id}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100"
            >
              <div>
                <p className="font-semibold text-gray-900">{vendor.name}</p>
                <p className="text-sm text-gray-500">{vendor.city} · {vendor.productCount} products</p>
              </div>
              <span className="text-sm font-bold text-amber-500">★ {vendor.rating}</span>
            </div>
          ))}
        </ResultSection>
      )}

      {showOrders && results.orders?.length > 0 && (
        <ResultSection title="Orders" icon={ShoppingCart} count={results.orders.length}>
          {results.orders.map((order) => (
            <Link
              key={order._id || order.id}
              to={`${routes.ORDERS}/${order._id || order.id}`}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
            >
              <div>
                <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                <p className="text-sm text-gray-500">{order.customerName}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">₹{order.totalAmount?.toLocaleString()}</p>
                <p className="text-xs text-gray-500 capitalize">{order.status?.toLowerCase()}</p>
              </div>
            </Link>
          ))}
        </ResultSection>
      )}
    </div>
  );
};

const ResultSection = ({ title, icon: Icon, count, children }) => (
  <div>
    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
      <Icon size={20} className="text-blue-600" />
      {title}
      <span className="text-sm font-normal text-gray-400">({count})</span>
    </h3>
    <div className="space-y-2">{children}</div>
  </div>
);

export default SearchResults;
