import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute, ProtectedRoute, VendorRoute } from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
const HomePage = lazy(() => import('./pages/HomePage'))
const CollectionPage = lazy(() => import('./pages/CollectionPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const ProductReviewsPage = lazy(() => import('./pages/ProductReviewsPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const FaqsPage = lazy(() => import('./pages/FaqsPage'))
const SizeChartPage = lazy(() => import('./pages/SizeChartPage'))
const PolicyPage = lazy(() => import('./pages/PolicyPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const VendorDashboardPage = lazy(() => import('./pages/VendorDashboardCleanPage'))
const SellerLandingPage = lazy(() => import('./pages/SellerLandingPage'))
const VendorStatusPage = lazy(() => import('./pages/VendorStatusPage'))
const VendorRegistrationPage = lazy(() => import('./pages/VendorRegistrationPage'))

const PageFallback = () => (
  <div className="container-shell py-16">
    <div className="h-56 animate-pulse rounded-[2.25rem] bg-white/80" />
  </div>
)

const App = () => (
  <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<CollectionPage />} />
        <Route path="/collections" element={<CollectionPage />} />
        <Route path="/collections/:slug" element={<CollectionPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/products/:slug/reviews" element={<ProductReviewsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/size-chart" element={<SizeChartPage />} />
        <Route path="/policies/:type" element={<PolicyPage />} />
        <Route path="/account/login" element={<LoginPage />} />
        <Route path="/account/login/*" element={<LoginPage />} />
        <Route path="/account/register" element={<RegisterPage />} />
        <Route path="/account/register/*" element={<RegisterPage />} />
        <Route path="/account/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/login" element={<Navigate to="/account/login" replace />} />
        <Route path="/register" element={<Navigate to="/account/register" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/account/forgot-password" replace />} />
        <Route
          path="/account/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/status"
          element={
            <ProtectedRoute>
              <VendorStatusPage />
            </ProtectedRoute>
          }
        />
        <Route path="/vendor/register" element={<VendorRegistrationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route
        path="/admin/login"
        element={<AdminLoginPage />}
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route
        path="/vendor"
        element={
          <VendorRoute>
            <VendorDashboardPage />
          </VendorRoute>
        }
      />
      <Route
        path="/vendor/products"
        element={
          <VendorRoute>
            <VendorDashboardPage />
          </VendorRoute>
        }
      />
      <Route
        path="/vendor/products/new"
        element={
          <VendorRoute>
            <VendorDashboardPage />
          </VendorRoute>
        }
      />
      <Route
        path="/vendor/products/:productId/edit"
        element={
          <VendorRoute>
            <VendorDashboardPage />
          </VendorRoute>
        }
      />
      <Route
        path="/vendor/orders"
        element={
          <VendorRoute>
            <VendorDashboardPage />
          </VendorRoute>
        }
      />
      <Route
        path="/vendor/analytics"
        element={
          <VendorRoute>
            <VendorDashboardPage />
          </VendorRoute>
        }
      />
      <Route
        path="/vendor/wallet"
        element={
          <VendorRoute>
            <VendorDashboardPage />
          </VendorRoute>
        }
      />
      <Route
        path="/vendor/settings"
        element={
          <VendorRoute>
            <VendorDashboardPage />
          </VendorRoute>
        }
      />
      <Route
        path="/vendor/onboarding"
        element={<SellerLandingPage />}
      />
    </Routes>
  </Suspense>
)

export default App
