import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout, selectIsAuthenticated, selectUser } from '../../store/slices/authSlice';
import { toggleLanguage, selectLanguage, toggleCartSidebar } from '../../store/slices/uiSlice';
import { selectCartItemsCount } from '../../store/slices/cartSlice';
import { selectRestaurants } from '../../store/slices/restaurantSlice';
import ProfessionalSearchBar from '../ui/ProfessionalSearchBar';
import { completeMenuItems } from '../../data/completeMenuItems';
import { SearchResult } from '../../utils/searchUtils';
import { UserRole } from '../../types';
import {
  FiShoppingCart,
  FiUser,
  FiMenu,
  FiX,
  FiGlobe,
  FiLogOut,
  FiSliders,
  FiPackage,
  FiSearch,
  FiSettings,
  FiTruck,
  FiLock,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const language = useAppSelector(selectLanguage);
  const cartItemsCount = useAppSelector(selectCartItemsCount);
  const restaurants = useAppSelector(selectRestaurants);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Professional search handlers
  const handleProfessionalSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(query)}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    navigate(`/restaurants?search=${encodeURIComponent(suggestion.name)}`);
  };

  const isArabic = language === 'ar';

  const getDashboardLink = () => {
    if (!user) return null;
    
    switch (user.role) {
      case UserRole.CUSTOMER:
        return { to: '/dashboard/customer', label: isArabic ? 'لوحة العميل' : 'Customer Dashboard', icon: FiUser };
      case UserRole.RESTAURANT_OWNER:
        return { to: '/dashboard/owner', label: isArabic ? 'لوحة المطعم' : 'Restaurant Dashboard', icon: FiSettings };
      case UserRole.DELIVERY_DRIVER:
        return { to: '/dashboard/driver', label: isArabic ? 'لوحة السائق' : 'Driver Dashboard', icon: FiTruck };
      case UserRole.ADMIN:
        return { to: '/dashboard/admin', label: isArabic ? 'لوحة المدير' : 'Admin Dashboard', icon: FiLock };
      default:
        return null;
    }
  };

  const dashboardLink = getDashboardLink();

  const handleLogout = () => {
    dispatch(logout());
    setUserMenuOpen(false);
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <header className="bg-white shadow-soft sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">أ</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-neutral-800">
                {isArabic ? 'أسوان فود' : 'Aswan Food'}
              </h1>
              <p className="text-xs text-neutral-500">
                {isArabic ? 'توصيل الطعام' : 'Food Delivery'}
              </p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <ProfessionalSearchBar
              restaurants={restaurants}
              menuItems={completeMenuItems}
              onSearch={handleProfessionalSearch}
              onSuggestionClick={handleSuggestionClick}
              placeholder={isArabic ? 'ابحث عن المطاعم والأطعمة...' : 'Search restaurants and food...'}
              isArabic={isArabic}
              className="w-full"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
            {/* Language Toggle */}
            <button
              onClick={() => dispatch(toggleLanguage())}
              className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
              title={isArabic ? 'English' : 'العربية'}
            >
              <FiGlobe className="h-5 w-5" />
            </button>

            {/* Cart */}
            <button
              onClick={() => dispatch(toggleCartSidebar())}
              className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <FiShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.firstName?.charAt(0) || 'ع'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-neutral-700">
                    {user?.firstName || 'عميل'}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-white rounded-lg shadow-medium border border-neutral-200 py-1 z-50"
                    >
                      {dashboardLink && (
                        <Link
                          to={dashboardLink.to}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          <dashboardLink.icon className="h-4 w-4" />
                          <span>{dashboardLink.label}</span>
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <FiUser className="h-4 w-4" />
                        <span>{isArabic ? 'الملف الشخصي' : 'Profile'}</span>
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <FiPackage className="h-4 w-4" />
                        <span>{isArabic ? 'طلباتي' : 'My Orders'}</span>
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rtl:text-right"
                      >
                        <FiLogOut className="h-4 w-4" />
                        <span>{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Link
                  to="/login"
                  className="btn btn-outline btn-sm"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Login'}
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                >
                  {isArabic ? 'إنشاء حساب' : 'Sign Up'}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2 rtl:space-x-reverse">
            {/* Cart */}
            <button
              onClick={() => dispatch(toggleCartSidebar())}
              className="relative p-2 rounded-lg text-neutral-600"
            >
              <FiShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-neutral-600"
            >
              {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <ProfessionalSearchBar
            restaurants={restaurants}
            menuItems={completeMenuItems}
            onSearch={handleProfessionalSearch}
            onSuggestionClick={handleSuggestionClick}
            placeholder={isArabic ? 'ابحث عن المطاعم والأطعمة...' : 'Search restaurants and food...'}
            isArabic={isArabic}
            className="w-full"
          />
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-neutral-200"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Language Toggle */}
              <button
                onClick={() => dispatch(toggleLanguage())}
                className="flex items-center space-x-2 rtl:space-x-reverse w-full p-2 rounded-lg text-neutral-600 hover:bg-neutral-50"
              >
                <FiGlobe className="h-5 w-5" />
                <span>{isArabic ? 'English' : 'العربية'}</span>
              </button>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 rtl:space-x-reverse w-full p-2 rounded-lg text-neutral-600 hover:bg-neutral-50"
                  >
                    <FiUser className="h-5 w-5" />
                    <span>{isArabic ? 'الملف الشخصي' : 'Profile'}</span>
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 rtl:space-x-reverse w-full p-2 rounded-lg text-neutral-600 hover:bg-neutral-50"
                  >
                    <FiPackage className="h-5 w-5" />
                    <span>{isArabic ? 'طلباتي' : 'My Orders'}</span>
                  </Link>
                  <hr />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 rtl:space-x-reverse w-full p-2 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut className="h-5 w-5" />
                    <span>{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-outline w-full"
                  >
                    {isArabic ? 'تسجيل الدخول' : 'Login'}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary w-full"
                  >
                    {isArabic ? 'إنشاء حساب' : 'Sign Up'}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;