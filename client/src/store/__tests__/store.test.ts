import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../slices/authSlice';
import { cartSlice } from '../slices/cartSlice';
import { uiSlice } from '../slices/uiSlice';

describe('Redux Store', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
        cart: cartSlice.reducer,
        ui: uiSlice.reducer,
      },
    });
  });

  describe('Auth Slice', () => {
    it('should handle initial state', () => {
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle login success', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'CUSTOMER',
      };

      store.dispatch(authSlice.actions.loginSuccess({ user, token: 'mock-token' }));

      const state = store.getState().auth;
      expect(state.user).toEqual(user);
      expect(state.token).toBe('mock-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('should handle login failure', () => {
      const error = 'Invalid credentials';

      store.dispatch(authSlice.actions.loginFailure(error));

      const state = store.getState().auth;
      expect(state.error).toBe(error);
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle logout', () => {
      // First login
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'CUSTOMER',
      };
      store.dispatch(authSlice.actions.loginSuccess({ user, token: 'mock-token' }));

      // Then logout
      store.dispatch(authSlice.actions.logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Cart Slice', () => {
    it('should handle initial state', () => {
      const state = store.getState().cart;
      expect(state.items).toEqual([]);
      expect(state.total).toBe(0);
      expect(state.restaurantId).toBeNull();
    });

    it('should add item to cart', () => {
      const menuItem = {
        id: '1',
        name: 'كشري',
        nameAr: 'كشري',
        price: 25,
        description: 'كشري مصري أصيل',
        image: 'koshary.jpg',
        category: { id: '1', name: 'Main Dishes', nameAr: 'الأطباق الرئيسية' },
        restaurant: { id: '1', name: 'مطعم أسوان' },
      };

      store.dispatch(cartSlice.actions.addItem({ menuItem, quantity: 2 }));

      const state = store.getState().cart;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].menuItem.id).toBe('1');
      expect(state.items[0].quantity).toBe(2);
      expect(state.total).toBe(50);
    });

    it('should remove item from cart', () => {
      const menuItem = {
        id: '1',
        name: 'كشري',
        nameAr: 'كشري',
        price: 25,
        description: 'كشري مصري أصيل',
        image: 'koshary.jpg',
        category: { id: '1', name: 'Main Dishes', nameAr: 'الأطباق الرئيسية' },
        restaurant: { id: '1', name: 'مطعم أسوان' },
      };

      // Add item first
      store.dispatch(cartSlice.actions.addItem({ menuItem, quantity: 2 }));

      // Then remove it
      store.dispatch(cartSlice.actions.removeItem('1'));

      const state = store.getState().cart;
      expect(state.items).toHaveLength(0);
      expect(state.total).toBe(0);
    });

    it('should clear cart', () => {
      const menuItem = {
        id: '1',
        name: 'كشري',
        nameAr: 'كشري',
        price: 25,
        description: 'كشري مصري أصيل',
        image: 'koshary.jpg',
        category: { id: '1', name: 'Main Dishes', nameAr: 'الأطباق الرئيسية' },
        restaurant: { id: '1', name: 'مطعم أسوان' },
      };

      // Add item first
      store.dispatch(cartSlice.actions.addItem({ menuItem, quantity: 2 }));

      // Then clear cart
      store.dispatch(cartSlice.actions.clearCart());

      const state = store.getState().cart;
      expect(state.items).toHaveLength(0);
      expect(state.total).toBe(0);
      expect(state.restaurantId).toBeNull();
    });
  });

  describe('UI Slice', () => {
    it('should handle initial state', () => {
      const state = store.getState().ui;
      expect(state.language).toBe('en');
      expect(state.cartSidebarOpen).toBe(false);
      expect(state.userMenuOpen).toBe(false);
      expect(state.mobileMenuOpen).toBe(false);
    });

    it('should toggle language', () => {
      store.dispatch(uiSlice.actions.toggleLanguage());

      const state = store.getState().ui;
      expect(state.language).toBe('ar');

      store.dispatch(uiSlice.actions.toggleLanguage());
      expect(store.getState().ui.language).toBe('en');
    });

    it('should toggle cart sidebar', () => {
      store.dispatch(uiSlice.actions.toggleCartSidebar());

      const state = store.getState().ui;
      expect(state.cartSidebarOpen).toBe(true);

      store.dispatch(uiSlice.actions.toggleCartSidebar());
      expect(store.getState().ui.cartSidebarOpen).toBe(false);
    });

    it('should toggle user menu', () => {
      store.dispatch(uiSlice.actions.toggleUserMenu());

      const state = store.getState().ui;
      expect(state.userMenuOpen).toBe(true);

      store.dispatch(uiSlice.actions.toggleUserMenu());
      expect(store.getState().ui.userMenuOpen).toBe(false);
    });

    it('should toggle mobile menu', () => {
      store.dispatch(uiSlice.actions.toggleMobileMenu());

      const state = store.getState().ui;
      expect(state.mobileMenuOpen).toBe(true);

      store.dispatch(uiSlice.actions.toggleMobileMenu());
      expect(store.getState().ui.mobileMenuOpen).toBe(false);
    });
  });
});
