import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { HomePage } from '../HomePage';
import { RestaurantPage } from '../RestaurantPage';
import { OrderPage } from '../OrderPage';
import { ProfilePage } from '../ProfilePage';
import { LoginPage } from '../LoginPage';
import { RegisterPage } from '../RegisterPage';
import { NotFoundPage } from '../NotFoundPage';

// Mock store for testing
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: false }, action) => state,
      restaurant: (state = { restaurants: [] }, action) => state,
      order: (state = { orders: [] }, action) => state,
      user: (state = { profile: null }, action) => state,
      ui: (state = { theme: 'light', language: 'ar' }, action) => state,
    },
    preloadedState: initialState,
  });
};

// Mock components
jest.mock('../../components/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
  };
});

jest.mock('../../components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

describe('HomePage', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const store = createMockStore({
      restaurant: { restaurants: [], isLoading: true },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
  });
});

describe('RestaurantPage', () => {
  it('should render correctly', () => {
    const store = createMockStore({
      restaurant: {
        currentRestaurant: {
          id: '1',
          name: 'مطعم أسوان',
          description: 'مطعم مصري أصيل',
        },
        menuItems: [],
      },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RestaurantPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('مطعم أسوان')).toBeInTheDocument();
  });

  it('should show error when restaurant not found', () => {
    const store = createMockStore({
      restaurant: {
        currentRestaurant: null,
        error: 'Restaurant not found',
      },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RestaurantPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('Restaurant not found')).toBeInTheDocument();
  });
});

describe('OrderPage', () => {
  it('should render correctly', () => {
    const store = createMockStore({
      order: {
        orders: [
          {
            id: '1',
            status: 'PENDING',
            total: 50,
            items: [],
          },
        ],
      },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('طلباتي')).toBeInTheDocument();
  });

  it('should show empty state when no orders', () => {
    const store = createMockStore({
      order: { orders: [] },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('لا توجد طلبات')).toBeInTheDocument();
  });
});

describe('ProfilePage', () => {
  it('should render correctly', () => {
    const store = createMockStore({
      user: {
        profile: {
          id: '1',
          email: 'test@example.com',
          firstName: 'أحمد',
          lastName: 'محمد',
        },
      },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('الملف الشخصي')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const store = createMockStore({
      user: { profile: null, isLoading: true },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
  });
});

describe('LoginPage', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument();
  });

  it('should show form fields', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByLabelText('البريد الإلكتروني')).toBeInTheDocument();
    expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('إنشاء حساب')).toBeInTheDocument();
  });

  it('should show form fields', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByLabelText('الاسم الأول')).toBeInTheDocument();
    expect(screen.getByLabelText('الاسم الأخير')).toBeInTheDocument();
    expect(screen.getByLabelText('البريد الإلكتروني')).toBeInTheDocument();
    expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument();
  });
});

describe('NotFoundPage', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotFoundPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('الصفحة غير موجودة')).toBeInTheDocument();
  });

  it('should have back to home link', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotFoundPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('العودة للرئيسية')).toBeInTheDocument();
  });
});