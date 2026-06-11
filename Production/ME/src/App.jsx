import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Super Admin Pages
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import Platform from './pages/SuperAdmin/Platform';
import AdminPerformance from './pages/SuperAdmin/AdminPerformance';
import Vendors from './pages/SuperAdmin/Vendors';
import DeliveryPartners from './pages/SuperAdmin/DeliveryPartners';
import Orders from './pages/SuperAdmin/Orders';
import Analytics from './pages/SuperAdmin/Analytics';
import Settings from './pages/SuperAdmin/Settings';

// Other Role Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import Products from './pages/Admin/Products';
import Categories from './pages/Admin/Categories';
import Inventory from './pages/Admin/Inventory';
import AdminVendors from './pages/Admin/Vendors';
import AdminOrders from './pages/Admin/Orders';
import DeliveryAssignment from './pages/Admin/DeliveryAssignment';
import Reports from './pages/Admin/Reports';
import AdminAnalytics from './pages/Admin/Analytics';
import AdminSettings from './pages/Admin/Settings';

// Vendor Pages
import VendorLayout from './layouts/VendorLayout';
import VendorDashboard from './pages/Vendor/Dashboard';
import VendorProducts from './pages/Vendor/Products';
import ProductDetails from './pages/Vendor/ProductDetails';
import VendorCategories from './pages/Vendor/Categories';
import VendorCart from './pages/Vendor/Cart';
import VendorCheckout from './pages/Vendor/Checkout';
import VendorOrderSuccess from './pages/Vendor/OrderSuccess';
import VendorOrders from './pages/Vendor/Orders';
import VendorOrderDetails from './pages/Vendor/OrderDetails';
import VendorInvoices from './pages/Vendor/Invoices';
import VendorWishlist from './pages/Vendor/Wishlist';
import VendorProfile from './pages/Vendor/Profile';
import VendorSettings from './pages/Vendor/Settings';

// Delivery Partner Pages
import DeliveryLayout from './layouts/DeliveryLayout';
import DeliveryDashboard from './pages/DeliveryPartner/Dashboard';
import AssignedOrders from './pages/DeliveryPartner/AssignedOrders';
import OrderDetails from './pages/DeliveryPartner/OrderDetails';
import DeliveryHistory from './pages/DeliveryPartner/History';
import DeliveryEarnings from './pages/DeliveryPartner/Earnings';
import DeliveryPerformance from './pages/DeliveryPartner/Performance';
import DeliveryProfile from './pages/DeliveryPartner/Profile';
import DeliverySettings from './pages/DeliveryPartner/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes - Super Admin */}
          <Route
            path="/super-admin/*"
            element={
              <ProtectedRoute requiredRole="super-admin">
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="platform" element={<Platform />} />
            <Route path="admin-performance" element={<AdminPerformance />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="delivery-partners" element={<DeliveryPartners />} />
            <Route path="orders" element={<Orders />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Protected Routes - Admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="delivery-assignment" element={<DeliveryAssignment />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Protected Routes - Vendor */}
          <Route
            path="/vendor/*"
            element={
              <ProtectedRoute requiredRole="vendor">
                <VendorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/vendor/dashboard" replace />} />
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="categories" element={<VendorCategories />} />
            <Route path="cart" element={<VendorCart />} />
            <Route path="checkout" element={<VendorCheckout />} />
            <Route path="order-success" element={<VendorOrderSuccess />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="orders/:id" element={<VendorOrderDetails />} />
            <Route path="invoices" element={<VendorInvoices />} />
            <Route path="invoices/:id" element={<VendorInvoices />} />
            <Route path="wishlist" element={<VendorWishlist />} />
            <Route path="profile" element={<VendorProfile />} />
            <Route path="settings" element={<VendorSettings />} />
          </Route>

          {/* Protected Routes - Delivery Partner */}
          <Route
            path="/delivery/*"
            element={
              <ProtectedRoute requiredRole="delivery">
                <DeliveryLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/delivery/dashboard" replace />} />
            <Route path="dashboard" element={<DeliveryDashboard />} />
            <Route path="assigned-orders" element={<AssignedOrders />} />
            <Route path="order-details/:id" element={<OrderDetails />} />
            <Route path="history" element={<DeliveryHistory />} />
            <Route path="earnings" element={<DeliveryEarnings />} />
            <Route path="performance" element={<DeliveryPerformance />} />
            <Route path="profile" element={<DeliveryProfile />} />
            <Route path="settings" element={<DeliverySettings />} />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
