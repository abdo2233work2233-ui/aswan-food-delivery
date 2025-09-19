import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { DashboardHomePage } from '../DashboardHomePage';
import { DashboardRestaurantsPage } from '../DashboardRestaurantsPage';
import { DashboardOrdersPage } from '../DashboardOrdersPage';
import { DashboardUsersPage } from '../DashboardUsersPage';
import { DashboardSettingsPage } from '../DashboardSettingsPage';

// Mock store for testing
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: true, user: { role: 'ADMIN' } }, action) => state,
      restaurant: (state = { restaurants: [] }, action) => state,
      order: (state = { orders: [] }, action) => state,
      user: (state = { users: [] }, action) => state,
      ui: (state = { theme: 'light', language: 'ar' }, action) => state,
    },
    preloadedState: initialState,
  });
};

// Mock components
jest.mock('../../components/dashboard/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

describe('DashboardHomePage', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardHomePage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  it('should show dashboard statistics', () => {
    const store = createMockStore({
      restaurant: { restaurants: [{ id: '1' }, { id: '2' }] },
      order: { orders: [{ id: '1' }, { id: '2' }, { id: '3' }] },
      user: { users: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }] },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardHomePage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('إحصائيات لوحة التحكم')).toBeInTheDocument();
  });
});

describe('DashboardRestaurantsPage', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardRestaurantsPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  it('should show restaurants list', () => {
    const store = createMockStore({
      restaurant: {
        restaurants: [
          { id: '1', name: 'مطعم أسوان', isActive: true },
          { id: '2', name: 'مطعم الأقصر', isActive: false },
        ],
      },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardRestaurantsPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('إدارة المطاعم')).toBeInTheDocument();
  });

  it('should show add restaurant button', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardRestaurantsPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('إضافة مطعم')).toBeInTheDocument();
  });
});

describe('DashboardOrdersPage', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardOrdersPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  it('should show orders list', () => {
    const store = createMockStore({
      order: {
        orders: [
          { id: '1', status: 'PENDING', total: 50 },
          { id: '2', status: 'DELIVERED', total: 75 },
        ],
      },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardOrdersPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('إدارة الطلبات')).toBeInTheDocument();
  });

  it('should show order filters', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardOrdersPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('فلترة الطلبات')).toBeInTheDocument();
  });
});

describe('DashboardUsersPage', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardUsersPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  it('should show users list', () => {
    const store = createMockStore({
      user: {
        users: [
          { id: '1', email: 'user1@example.com', role: 'CUSTOMER' },
          { id: '2', email: 'user2@example.com', role: 'ADMIN' },
        ],
      },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardUsersPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('إدارة المستخدمين')).toBeInTheDocument();
  });

  it('should show user roles filter', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardUsersPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('فلترة المستخدمين')).toBeInTheDocument();
  });
});

describe('DashboardSettingsPage', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardSettingsPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  it('should show settings sections', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardSettingsPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('إعدادات النظام')).toBeInTheDocument();
    expect(screen.getByText('إعدادات المطاعم')).toBeInTheDocument();
    expect(screen.getByText('إعدادات التوصيل')).toBeInTheDocument();
  });

  it('should show save button', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardSettingsPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('حفظ الإعدادات')).toBeInTheDocument();
  });
});