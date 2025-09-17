import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { selectIsAuthenticated, selectUser, logout } from '../store/slices/authSlice';
import { selectCartItemsCount } from '../store/slices/cartSlice';
import LanguageSwitcher from './LanguageSwitcher';
import {
  FiShoppingCart,
  FiUser,
  FiMenu,
  FiLogOut,
  FiHeart,
  FiClock
} from 'react-icons/fi';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const cartItemsCount = useAppSelector(selectCartItemsCount);
  
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  
  const isRTL = i18n.language === 'ar';

  const handleLogout = () => {
    dispatch(logout());
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('app.name')}
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
            >
              {t('navigation.home')}
            </Link>
            <Link 
              to="/restaurants" 
              className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
            >
              {t('navigation.restaurants')}
            </Link>
            {isAuthenticated && (
              <Link 
                to="/orders" 
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
              >
                {t('navigation.orders')}
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Language Switcher */}
            <LanguageSwitcher variant="toggle" showText={false} />

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              <FiShoppingCart className="w-6 h-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 rtl:space-x-reverse p-2 text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <FiUser className="w-6 h-6" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {user?.firstName || t('common.profile')}
                  </span>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FiUser className="mr-3 rtl:mr-0 rtl:ml-3 w-4 h-4" />
                          {t('navigation.profile')}
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FiClock className="mr-3 rtl:mr-0 rtl:ml-3 w-4 h-4" />
                          {t('navigation.orders')}
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FiUser className="mr-3 rtl:mr-0 rtl:ml-3 w-4 h-4" />
                          {t('common.settings')}
                        </Link>
                        <div className="border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <FiLogOut className="mr-3 rtl:mr-0 rtl:ml-3 w-4 h-4" />
                            {t('auth.logout')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
                >
                  {t('auth.register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/" 
                className="py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.home')}
              </Link>
              <Link 
                to="/restaurants" 
                className="py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.restaurants')}
              </Link>
              {isAuthenticated && (
                <Link 
                  to="/orders" 
                  className="py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('navigation.orders')}
                </Link>
              )}
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('auth.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="py-2 text-orange-600 hover:text-orange-700 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('auth.register')}
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;