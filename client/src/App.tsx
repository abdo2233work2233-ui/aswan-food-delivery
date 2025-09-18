import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from './store';
import { loadUser } from './store/slices/authSlice';
import { selectIsAuthenticated, selectAuthLoading } from './store/slices/authSlice';
import { getLanguageDirection } from './i18n';
import './i18n'; // Initialize i18n
import './styles/rtl.css'; // Import RTL styles

// Layout Components
import Layout from './components/layout/Layout';
import LoadingScreen from './components/ui/LoadingScreen';

// Components
import RoleGuard from './components/RoleGuard';
import { UserRole } from './types';

// Dashboard Pages - Lazy loaded for better performance
const CustomerDashboard = React.lazy(() => import('./pages/dashboard/customer/CustomerDashboard'));
const OwnerDashboard = React.lazy(() => import('./pages/dashboard/owner/OwnerDashboard'));
const DriverDashboard = React.lazy(() => import('./pages/dashboard/driver/DriverDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/admin/AdminDashboard'));

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const RestaurantsPage = React.lazy(() => import('./pages/RestaurantsPage'));
const RestaurantDetailPage = React.lazy(() => import('./pages/RestaurantDetailPage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = React.lazy(() => import('./pages/OrderDetailPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));
const OrderConfirmationPage = React.lazy(() => import('./pages/OrderConfirmationPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const UnauthorizedPage = React.lazy(() => import('./pages/UnauthorizedPage'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect to home if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  useEffect(() => {
    // Set document direction and language based on current language
    const direction = getLanguageDirection(currentLanguage);
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage;
    
    // Add language class to body for styling
    document.body.className = currentLanguage === 'ar' ? 'arabic' : 'english';
  }, [currentLanguage]);

  useEffect(() => {
    // Try to load user from token on app start
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      dispatch(loadUser());
    }
  }, [dispatch, isAuthenticated]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />

        {/* Routes with Layout */}
        <Route path="/" element={<Layout />}>
          {/* Public Routes with Layout */}
          <Route index element={<HomePage />} />
          <Route path="restaurants" element={<RestaurantsPage />} />
          <Route path="restaurants/:id" element={<RestaurantDetailPage />} />
          
          {/* Protected Routes */}
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          <Route path="orders/:id" element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          } />
          <Route path="cart" element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          } />
          <Route path="checkout" element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } />
          <Route path="payment/:orderId" element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          } />
          <Route path="order-confirmation/:orderId" element={
            <ProtectedRoute>
              <OrderConfirmationPage />
            </ProtectedRoute>
          } />
          
          {/* Dashboard Routes */}
          <Route path="dashboard/customer" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={[UserRole.CUSTOMER]}>
                <CustomerDashboard />
              </RoleGuard>
            </ProtectedRoute>
          } />
          <Route path="dashboard/owner" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={[UserRole.RESTAURANT_OWNER]}>
                <OwnerDashboard />
              </RoleGuard>
            </ProtectedRoute>
          } />
          <Route path="dashboard/driver" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={[UserRole.DELIVERY_DRIVER]}>
                <DriverDashboard />
              </RoleGuard>
            </ProtectedRoute>
          } />
          <Route path="dashboard/admin" element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </RoleGuard>
            </ProtectedRoute>
          } />
          
          {/* Unauthorized Page */}
          <Route path="unauthorized" element={<UnauthorizedPage />} />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;