import React, { useEffect } from 'react';
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

// Pages
import HomePage from './pages/HomePage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Dashboard Pages
import CustomerDashboard from './pages/dashboard/customer/CustomerDashboard';
import OwnerDashboard from './pages/dashboard/owner/OwnerDashboard';
import DriverDashboard from './pages/dashboard/driver/DriverDashboard';
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';

// Components
import RoleGuard from './components/RoleGuard';
import { UserRole } from './types';

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
    </div>
  );
};

export default App;