import { Routes, Route } from "react-router-dom";
import { routes } from "./routeConfig.js";

// Components
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import RoleGuard from "../components/common/RoleGuard.jsx";
import RoleBasedRoute from "../components/common/RoleBasedRoute.jsx";

// Layouts
import MainLayout from "../components/layout/MainLayout.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import SuperAdminLayout from "../components/layout/SuperAdminLayout.jsx";
import DeliveryLayout from "../components/layout/DeliveryLayout.jsx";

// Pages
import LandingPage from "../modules/product/pages/LandingPage.jsx";
import LoginPage from "../modules/auth/pages/LoginPage.jsx";
import RegisterPage from "../modules/auth/pages/Register.jsx";
import ProductPage from "../modules/product/pages/ProductPage.jsx";
import AdminPage from "../modules/admin/pages/AdminPage.jsx";
import AdminUsersPage from "../modules/admin/pages/Users.jsx";
import AdminProductsPage from "../modules/admin/pages/Products.jsx";
import AdminOrdersPage from "../modules/admin/pages/Orders.jsx";
import AdminVendorsPage from "../modules/admin/pages/Vendors.jsx";
import AdminApprovalsPage from "../modules/admin/pages/Approvals.jsx";
import SuperAdminPage from "../modules/superAdmin/pages/SuperAdminPage.jsx";
import DeliveryPage from "../modules/delivery/pages/DeliveryPage.jsx";
import CreditPage from "../modules/credit/pages/CreditPage.jsx";
import CheckoutPage from "../modules/order/pages/Checkout.jsx";
import OrdersPage from "../modules/order/pages/OrdersPage.jsx";
import OrderDetails from "../modules/order/pages/OrderDetails.jsx";
import CartPage from "../modules/order/pages/Cart.jsx";
import PaymentPage from "../modules/payment/pages/PaymentPage.jsx";
import ProfilePage from "../modules/user/pages/Profile.jsx";
import SecurityPage from "../modules/user/pages/Security.jsx";
import HelpPage from "../modules/user/pages/Help.jsx";
import ProductDetails from "../modules/product/pages/ProductDetails.jsx";
import Dashboard from "../modules/user/pages/Dashboard.jsx";

// New Module Pages
import AnalyticsPage from "../modules/analytics/pages/AnalyticsPage.jsx";
import CompanyPage from "../modules/company/pages/CompanyPage.jsx";
import InventoryPage from "../modules/inventory/pages/InventoryPage.jsx";
import LogisticsPage from "../modules/logistics/pages/LogisticsPage.jsx";
import WarehousePage from "../modules/warehouse/pages/WarehousePage.jsx";
import PromotionPage from "../modules/promotion/pages/PromotionPage.jsx";
import SettingsPage from "../modules/settings/SettingsPage.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
        <Route path={routes.LANDING} element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path={routes.LOGIN} element={<LoginPage />} />
        <Route path={routes.REGISTER} element={<RegisterPage />} />
        
        <Route path={routes.PRODUCTS} element={<MainLayout><ProductPage /></MainLayout>} />
        <Route path={`${routes.PRODUCTS}/:id`} element={<MainLayout><ProductDetails /></MainLayout>} />

        {/* B2C & B2B HOME */}
        <Route path={routes.HOME} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["B2C_CUSTOMER", "B2B_CUSTOMER"]}>
              <MainLayout><ProductPage /></MainLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* B2B ROUTES */}
        <Route path={routes.DASHBOARD} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["B2B_CUSTOMER"]}>
              <MainLayout><Dashboard /></MainLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.CREDIT} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["B2B_CUSTOMER"]}>
              <MainLayout><CreditPage /></MainLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* ADMIN ROUTES */}
        <Route element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout />
            </RoleGuard>
          </ProtectedRoute>
        }>
          <Route path={routes.ADMIN} element={<AdminPage />} />
          <Route path={routes.ADMIN_USERS} element={<AdminUsersPage />} />
          <Route path={routes.ADMIN_PRODUCTS} element={<AdminProductsPage />} />
          <Route path={routes.ADMIN_ORDERS} element={<AdminOrdersPage />} />
          <Route path={routes.ADMIN_VENDORS} element={<AdminVendorsPage />} />
          <Route path={routes.ADMIN_APPROVALS} element={<AdminApprovalsPage />} />
          <Route path={routes.ADMIN_ANALYTICS} element={<AnalyticsPage />} />
          <Route path={routes.ADMIN_INVENTORY} element={<InventoryPage />} />
          <Route path={routes.ADMIN_WAREHOUSE} element={<WarehousePage />} />
          <Route path={routes.ADMIN_PROMOTIONS} element={<PromotionPage />} />
          <Route path={routes.ADMIN_SETTINGS} element={<SettingsPage />} />
          <Route path={routes.VENDOR_INVENTORY} element={<InventoryPage />} />
          <Route path={routes.VENDOR_COMPANY} element={<CompanyPage />} />
        </Route>

        {/* SUPER ADMIN ROUTES */}
        <Route element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
              <SuperAdminLayout />
            </RoleGuard>
          </ProtectedRoute>
        }>
          <Route path={routes.SUPER_ADMIN} element={<SuperAdminPage />} />
        </Route>

        {/* DELIVERY ROUTES */}
        <Route element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["DELIVERY_PARTNER", "SUPER_ADMIN", "ADMIN"]}>
              <DeliveryLayout />
            </RoleGuard>
          </ProtectedRoute>
        }>
          <Route path={routes.DELIVERY_DASHBOARD} element={<LogisticsPage />} />
          <Route path={routes.DELIVERY_SHIPMENTS} element={<LogisticsPage />} />
          <Route path={routes.DELIVERY_HISTORY} element={<DeliveryPage />} />
        </Route>

        {/* COMMON PRIVATE ROUTES (Mainly for Customers) */}
        <Route path={routes.ORDERS} element={
          <ProtectedRoute>
            <MainLayout><OrdersPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path={`${routes.ORDERS}/:id`} element={
          <ProtectedRoute>
            <MainLayout><OrderDetails /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path={routes.CART} element={
          <ProtectedRoute>
            <MainLayout><CartPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path={routes.PAYMENT} element={
          <ProtectedRoute>
            <MainLayout><PaymentPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path={routes.PROFILE} element={
          <ProtectedRoute>
            <MainLayout><ProfilePage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path={routes.SECURITY} element={
          <ProtectedRoute>
            <MainLayout><SecurityPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path={routes.HELP} element={
          <ProtectedRoute>
            <MainLayout><HelpPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path={routes.CHECKOUT} element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["B2B_CUSTOMER", "B2C_CUSTOMER"]}>
              <MainLayout><CheckoutPage /></MainLayout>
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        {/* FALLBACK */}
        <Route path="*" element={<MainLayout><h2>404 Not Found</h2></MainLayout>} />
      </Routes>
  );
};

export default AppRoutes;