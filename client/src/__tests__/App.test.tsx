import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import { authSlice } from '../store/slices/authSlice';
import { uiSlice } from '../store/slices/uiSlice';

// Mock components
jest.mock('../components/layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock('../components/ui/LoadingScreen', () => {
  return function MockLoadingScreen() {
    return <div data-testid="loading-screen">Loading...</div>;
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      ui: uiSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        ...initialState.auth,
      },
      ui: {
        language: 'en',
        cartSidebarOpen: false,
        userMenuOpen: false,
        mobileMenuOpen: false,
        ...initialState.ui,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('App Component', () => {
  it('renders without crashing', () => {
    renderWithProviders(<App />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('shows loading screen when auth is loading', () => {
    const initialState = {
      auth: {
        loading: true,
      },
    };
    
    renderWithProviders(<App />, initialState);
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('renders main app when not loading', () => {
    const initialState = {
      auth: {
        loading: false,
      },
    };
    
    renderWithProviders(<App />, initialState);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });
});
