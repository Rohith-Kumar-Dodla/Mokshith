import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import MaintenanceBanner from './components/common/MaintenanceBanner';
import ProtectedRoute from './routes/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

const PageLoader = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="animate-pulse text-sm text-gray-600">Loading...</div>
  </div>
);

const Home = lazy(() => import('./pages/Home/Home'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));

const SuperAdminLayout = lazy(() => import('./layouts/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdmin/Dashboard'));
const Platform = lazy(() => import('./pages/SuperAdmin/Platform'));
const AdminApprovals = lazy(() => import('./pages/SuperAdmin/AdminApprovals'));
const SuperAdminVendors = lazy(() => import('./pages/SuperAdmin/Vendors'));
const DeliveryPartners = lazy(() => import('./pages/SuperAdmin/DeliveryPartners'));
const UserManagement = lazy(() => import('./pages/SuperAdmin/UserManagement'));
const SuperAdminOrders = lazy(() => import('./pages/SuperAdmin/Orders'));
const SuperAdminAnalytics = lazy(() => import('./pages/SuperAdmin/Analytics'));
const SuperAdminSettings = lazy(() => import('./pages/SuperAdmin/Settings'));
const SuperAdminPaymentVerifications = lazy(() => import('./pages/SuperAdmin/PaymentVerifications'));
const SystemSettings = lazy(() => import('./pages/SuperAdmin/SystemSettings'));
const StaffOnboarding = lazy(() => import('./pages/SuperAdmin/StaffOnboarding'));

const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const Products = lazy(() => import('./pages/Admin/Products'));
const Categories = lazy(() => import('./pages/Admin/Categories'));
const Inventory = lazy(() => import('./pages/Admin/Inventory'));
const AdminVendors = lazy(() => import('./pages/Admin/Vendors'));
const AdminOrders = lazy(() => import('./pages/Admin/Orders'));
const DeliveryAssignment = lazy(() => import('./pages/Admin/DeliveryAssignment'));
const Reports = lazy(() => import('./pages/Admin/Reports'));
const AdminAnalytics = lazy(() => import('./pages/Admin/Analytics'));
const AdminSettings = lazy(() => import('./pages/Admin/Settings'));

const VendorLayout = lazy(() => import('./layouts/VendorLayout'));
const VendorDashboard = lazy(() => import('./pages/Vendor/Dashboard'));
const VendorProducts = lazy(() => import('./pages/Vendor/Products'));
const ProductDetails = lazy(() => import('./pages/Vendor/ProductDetails'));
const VendorCategories = lazy(() => import('./pages/Vendor/Categories'));
const VendorCart = lazy(() => import('./pages/Vendor/Cart'));
const VendorCheckout = lazy(() => import('./pages/Vendor/Checkout'));
const VendorOrderSuccess = lazy(() => import('./pages/Vendor/OrderSuccess'));
const BankTransferPayment = lazy(() => import('./pages/Vendor/BankTransferPayment'));
const VendorOrders = lazy(() => import('./pages/Vendor/Orders'));
const VendorOrderDetails = lazy(() => import('./pages/Vendor/OrderDetails'));
const VendorInvoices = lazy(() => import('./pages/Vendor/Invoices'));
const VendorWishlist = lazy(() => import('./pages/Vendor/Wishlist'));
const VendorProfile = lazy(() => import('./pages/Vendor/Profile'));
const VendorSettings = lazy(() => import('./pages/Vendor/Settings'));
const VendorSupport = lazy(() => import('./pages/Vendor/Support'));
const AdminSupport = lazy(() => import('./pages/Admin/Support'));

const DeliveryLayout = lazy(() => import('./layouts/DeliveryLayout'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryPartner/Dashboard'));
const AssignedOrders = lazy(() => import('./pages/DeliveryPartner/AssignedOrders'));
const OrderDetails = lazy(() => import('./pages/DeliveryPartner/OrderDetails'));
const DeliveryHistory = lazy(() => import('./pages/DeliveryPartner/History'));
const DeliveryEarnings = lazy(() => import('./pages/DeliveryPartner/Earnings'));
const DeliveryPerformance = lazy(() => import('./pages/DeliveryPartner/Performance'));
const DeliveryProfile = lazy(() => import('./pages/DeliveryPartner/Profile'));
const DeliverySettings = lazy(() => import('./pages/DeliveryPartner/Settings'));

function App() {
  return (
    <AuthProvider>
      <MaintenanceProvider>
      <Router>
        <ErrorBoundary>
          <MaintenanceBanner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/super-admin/*" element={<ProtectedRoute requiredRole="super-admin"><SuperAdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
                <Route path="dashboard" element={<SuperAdminDashboard />} />
                <Route path="platform" element={<Platform />} />
                <Route path="admin-approvals" element={<Navigate to="/super-admin/user-management" replace />} />
                <Route path="vendors" element={<Navigate to="/super-admin/user-management" replace />} />
                <Route path="delivery-partners" element={<Navigate to="/super-admin/user-management" replace />} />
                <Route path="user-management" element={<UserManagement />} />
                <Route path="staff-onboarding" element={<StaffOnboarding />} />
                <Route path="orders" element={<SuperAdminOrders />} />
                <Route path="payment-verifications" element={<SuperAdminPaymentVerifications />} />
                <Route path="analytics" element={<SuperAdminAnalytics />} />
                <Route path="settings" element={<SuperAdminSettings />} />
                <Route path="system-settings" element={<SystemSettings />} />
              </Route>

              <Route path="/admin/*" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
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
                <Route path="support" element={<AdminSupport />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="/vendor/*" element={<ProtectedRoute requiredRole="vendor"><VendorLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/vendor/dashboard" replace />} />
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="products" element={<VendorProducts />} />
                <Route path="products/:id" element={<ProductDetails />} />
                <Route path="categories" element={<VendorCategories />} />
                <Route path="cart" element={<VendorCart />} />
                <Route path="checkout" element={<VendorCheckout />} />
                <Route path="order-success" element={<VendorOrderSuccess />} />
                <Route path="orders/:id/payment" element={<BankTransferPayment />} />
                <Route path="orders" element={<VendorOrders />} />
                <Route path="orders/:id" element={<VendorOrderDetails />} />
                <Route path="invoices" element={<VendorInvoices />} />
                <Route path="invoices/:id" element={<VendorInvoices />} />
                <Route path="wishlist" element={<VendorWishlist />} />
                <Route path="support" element={<VendorSupport />} />
                <Route path="profile" element={<VendorProfile />} />
                <Route path="settings" element={<VendorSettings />} />
              </Route>

              <Route path="/delivery/*" element={<ProtectedRoute requiredRole="delivery"><DeliveryLayout /></ProtectedRoute>}>
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

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
      </MaintenanceProvider>
    </AuthProvider>
  );
}

export default App;
