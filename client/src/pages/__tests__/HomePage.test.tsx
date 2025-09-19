import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import HomePage from '../HomePage';
import { authSlice } from '../../store/slices/authSlice';
import { uiSlice } from '../../store/slices/uiSlice';

// Mock components
jest.mock('../../components/ui/RestaurantCard', () => {
  return function MockRestaurantCard({ restaurant }: { restaurant: any }) {
    return <div data-testid="restaurant-card">{restaurant.name}</div>;
  };
});

jest.mock('../../components/ui/ProfessionalSearchBar', () => {
  return function MockProfessionalSearchBar() {
    return <div data-testid="search-bar">Search Bar</div>;
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

describe('HomePage Component', () => {
  it('renders homepage with hero section', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText('Order delicious food from your favorite restaurants')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders featured restaurants section', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText('Featured Restaurants')).toBeInTheDocument();
  });

  it('renders how it works section', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText('How It Works?')).toBeInTheDocument();
  });

  it('renders stats section', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('Local Restaurants')).toBeInTheDocument();
  });

  it('renders call to action section', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText('Ready to order?')).toBeInTheDocument();
    expect(screen.getByText('Browse Restaurants')).toBeInTheDocument();
  });

  it('renders in Arabic when language is Arabic', () => {
    const initialState = {
      ui: {
        language: 'ar',
      },
    };
    
    renderWithProviders(<HomePage />, initialState);
    
    // Should render Arabic content
    expect(screen.getByText('اطلب طعاماً لذيذاً من مطاعمك المفضلة')).toBeInTheDocument();
  });
});
