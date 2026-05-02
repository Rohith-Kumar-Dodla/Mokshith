import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import SuperAdminPage from "../modules/superadmin/pages/SuperAdminPage.jsx";
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
import ShipmentTrackingPage from "../modules/shipment/pages/ShipmentTrackingPage.jsx";
import WarehousePage from "../modules/warehouse/pages/WarehousePage.jsx";
import PromotionPage from "../modules/promotion/pages/PromotionPage.jsx";
import WishlistPage from "../modules/wishlist/pages/WishlistPage.jsx";
import SettingsPage from "../modules/settings/SettingsPage.jsx";

const AppRoutes = () => {
  return (
    <BrowserRouter>
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
        <Route path={routes.ADMIN} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout title="Overview"><AdminPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.ADMIN_USERS} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout title="User Management"><AdminUsersPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.ADMIN_PRODUCTS} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout title="Product Inventory"><AdminProductsPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.ADMIN_ORDERS} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout title="Order Fulfillment"><AdminOrdersPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.ADMIN_VENDORS} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout title="Vendor Control"><AdminVendorsPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.ADMIN_APPROVALS} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout title="New Approvals"><AdminApprovalsPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* NEW MODULE ROUTES */}
        <Route path={routes.ADMIN_ANALYTICS} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout title="Analytics"><AnalyticsPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.ADMIN_INVENTORY} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout title="Inventory Management"><InventoryPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.ADMIN_WAREHOUSE} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout title="Warehouse Management"><WarehousePage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.ADMIN_PROMOTIONS} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout title="Promotions"><PromotionPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.ADMIN_SETTINGS} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "VENDOR"]}>
              <AdminLayout title="Settings"><SettingsPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.VENDOR_INVENTORY} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["VENDOR", "SUPER_ADMIN", "ADMIN"]}>
              <AdminLayout title="My Inventory"><InventoryPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.VENDOR_COMPANY} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["VENDOR", "SUPER_ADMIN", "ADMIN"]}>
              <AdminLayout title="Company Profile"><CompanyPage /></AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.DELIVERY_DASHBOARD} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["DELIVERY_PARTNER", "SUPER_ADMIN", "ADMIN"]}>
              <DeliveryLayout title="Logistics"><LogisticsPage /></DeliveryLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.DELIVERY_SHIPMENTS} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["DELIVERY_PARTNER", "SUPER_ADMIN", "ADMIN"]}>
              <DeliveryLayout title="My Deliveries"><LogisticsPage /></DeliveryLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path={routes.SHIPMENT_TRACKING} element={
          <ProtectedRoute>
            <MainLayout><ShipmentTrackingPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path={routes.WISHLIST} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["B2B_CUSTOMER", "B2C_CUSTOMER", "SUPER_ADMIN", "ADMIN"]}>
              <MainLayout><WishlistPage /></MainLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* SUPER ADMIN ROUTES */}
        <Route path={routes.SUPER_ADMIN} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
              <SuperAdminPage />
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* DELIVERY ROUTES */}
        <Route path={routes.DELIVERY_HISTORY} element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["DELIVERY_PARTNER", "SUPER_ADMIN", "ADMIN"]}>
              <DeliveryLayout><DeliveryPage /></DeliveryLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />

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
    </BrowserRouter>
  );
};

export default AppRoutes;