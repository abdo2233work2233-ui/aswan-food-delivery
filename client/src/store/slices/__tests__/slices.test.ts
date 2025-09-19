import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../authSlice';
import { restaurantSlice } from '../restaurantSlice';
import { orderSlice } from '../orderSlice';
import { cartSlice } from '../cartSlice';
import { userSlice } from '../userSlice';
import { uiSlice } from '../uiSlice';

describe('Auth Slice', () => {
  it('should have correct initial state', () => {
    expect(authSlice.getInitialState()).toEqual({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should handle login pending', () => {
    const action = { type: 'auth/login/pending' };
    const state = authSlice.reducer(undefined, action);
    expect(state.isLoading).toBe(true);
  });

  it('should handle login fulfilled', () => {
    const action = {
      type: 'auth/login/fulfilled',
      payload: {
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-token',
      },
    };
    const state = authSlice.reducer(undefined, action);
    expect(state.user).toEqual(action.payload.user);
    expect(state.token).toBe(action.payload.token);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should handle login rejected', () => {
    const action = {
      type: 'auth/login/rejected',
      payload: 'Login failed',
    };
    const state = authSlice.reducer(undefined, action);
    expect(state.error).toBe('Login failed');
    expect(state.isLoading).toBe(false);
  });
});

describe('Restaurant Slice', () => {
  it('should have correct initial state', () => {
    expect(restaurantSlice.getInitialState()).toEqual({
      restaurants: [],
      currentRestaurant: null,
      menuItems: [],
      isLoading: false,
      error: null,
    });
  });

  it('should handle fetch restaurants pending', () => {
    const action = { type: 'restaurant/fetchRestaurants/pending' };
    const state = restaurantSlice.reducer(undefined, action);
    expect(state.isLoading).toBe(true);
  });

  it('should handle fetch restaurants fulfilled', () => {
    const mockRestaurants = [
      { id: '1', name: 'مطعم أسوان' },
      { id: '2', name: 'مطعم الأقصر' },
    ];
    const action = {
      type: 'restaurant/fetchRestaurants/fulfilled',
      payload: mockRestaurants,
    };
    const state = restaurantSlice.reducer(undefined, action);
    expect(state.restaurants).toEqual(mockRestaurants);
    expect(state.isLoading).toBe(false);
  });
});

describe('Order Slice', () => {
  it('should have correct initial state', () => {
    expect(orderSlice.getInitialState()).toEqual({
      orders: [],
      currentOrder: null,
      isLoading: false,
      error: null,
    });
  });

  it('should handle fetch orders pending', () => {
    const action = { type: 'order/fetchOrders/pending' };
    const state = orderSlice.reducer(undefined, action);
    expect(state.isLoading).toBe(true);
  });

  it('should handle fetch orders fulfilled', () => {
    const mockOrders = [
      { id: '1', status: 'PENDING', total: 50 },
      { id: '2', status: 'DELIVERED', total: 75 },
    ];
    const action = {
      type: 'order/fetchOrders/fulfilled',
      payload: mockOrders,
    };
    const state = orderSlice.reducer(undefined, action);
    expect(state.orders).toEqual(mockOrders);
    expect(state.isLoading).toBe(false);
  });
});

describe('Cart Slice', () => {
  it('should have correct initial state', () => {
    expect(cartSlice.getInitialState()).toEqual({
      items: [],
      total: 0,
      itemCount: 0,
    });
  });

  it('should handle add item', () => {
    const action = {
      type: 'cart/addItem',
      payload: {
        id: '1',
        name: 'كشري',
        price: 25,
        quantity: 1,
      },
    };
    const state = cartSlice.reducer(undefined, action);
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(action.payload);
    expect(state.total).toBe(25);
    expect(state.itemCount).toBe(1);
  });

  it('should handle remove item', () => {
    const initialState = {
      items: [{ id: '1', name: 'كشري', price: 25, quantity: 1 }],
      total: 25,
      itemCount: 1,
    };
    const action = {
      type: 'cart/removeItem',
      payload: '1',
    };
    const state = cartSlice.reducer(initialState, action);
    expect(state.items).toHaveLength(0);
    expect(state.total).toBe(0);
    expect(state.itemCount).toBe(0);
  });

  it('should handle update quantity', () => {
    const initialState = {
      items: [{ id: '1', name: 'كشري', price: 25, quantity: 1 }],
      total: 25,
      itemCount: 1,
    };
    const action = {
      type: 'cart/updateQuantity',
      payload: { id: '1', quantity: 2 },
    };
    const state = cartSlice.reducer(initialState, action);
    expect(state.items[0].quantity).toBe(2);
    expect(state.total).toBe(50);
    expect(state.itemCount).toBe(2);
  });

  it('should handle clear cart', () => {
    const initialState = {
      items: [{ id: '1', name: 'كشري', price: 25, quantity: 1 }],
      total: 25,
      itemCount: 1,
    };
    const action = { type: 'cart/clearCart' };
    const state = cartSlice.reducer(initialState, action);
    expect(state.items).toHaveLength(0);
    expect(state.total).toBe(0);
    expect(state.itemCount).toBe(0);
  });
});

describe('User Slice', () => {
  it('should have correct initial state', () => {
    expect(userSlice.getInitialState()).toEqual({
      profile: null,
      addresses: [],
      isLoading: false,
      error: null,
    });
  });

  it('should handle fetch profile pending', () => {
    const action = { type: 'user/fetchProfile/pending' };
    const state = userSlice.reducer(undefined, action);
    expect(state.isLoading).toBe(true);
  });

  it('should handle fetch profile fulfilled', () => {
    const mockProfile = {
      id: '1',
      email: 'test@example.com',
      firstName: 'أحمد',
      lastName: 'محمد',
    };
    const action = {
      type: 'user/fetchProfile/fulfilled',
      payload: mockProfile,
    };
    const state = userSlice.reducer(undefined, action);
    expect(state.profile).toEqual(mockProfile);
    expect(state.isLoading).toBe(false);
  });
});

describe('UI Slice', () => {
  it('should have correct initial state', () => {
    expect(uiSlice.getInitialState()).toEqual({
      theme: 'light',
      language: 'ar',
      sidebarOpen: false,
      modalOpen: false,
      loading: false,
    });
  });

  it('should handle toggle theme', () => {
    const action = { type: 'ui/toggleTheme' };
    const state = uiSlice.reducer(undefined, action);
    expect(state.theme).toBe('dark');
  });

  it('should handle set language', () => {
    const action = {
      type: 'ui/setLanguage',
      payload: 'en',
    };
    const state = uiSlice.reducer(undefined, action);
    expect(state.language).toBe('en');
  });

  it('should handle toggle sidebar', () => {
    const action = { type: 'ui/toggleSidebar' };
    const state = uiSlice.reducer(undefined, action);
    expect(state.sidebarOpen).toBe(true);
  });

  it('should handle toggle modal', () => {
    const action = { type: 'ui/toggleModal' };
    const state = uiSlice.reducer(undefined, action);
    expect(state.modalOpen).toBe(true);
  });

  it('should handle set loading', () => {
    const action = {
      type: 'ui/setLoading',
      payload: true,
    };
    const state = uiSlice.reducer(undefined, action);
    expect(state.loading).toBe(true);
  });
});