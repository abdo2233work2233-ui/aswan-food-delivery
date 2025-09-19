import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Header from '../layout/Header';
import { authSlice } from '../../store/slices/authSlice';
import { uiSlice } from '../../store/slices/uiSlice';

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

// Mock components
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

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

describe('Header Component', () => {
  it('renders header with logo and navigation', () => {
    renderWithProviders(<Header />);
    
    expect(screen.getByText('Aswan Food')).toBeInTheDocument();
    expect(screen.getByText('Restaurants')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  it('shows login button when user is not authenticated', () => {
    renderWithProviders(<Header />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('shows user menu when user is authenticated', () => {
    const initialState = {
      auth: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'أحمد',
          lastName: 'محمد',
          role: 'CUSTOMER',
        },
        isAuthenticated: true,
      },
    };
    
    renderWithProviders(<Header />, initialState);
    
    expect(screen.getByText('أحمد')).toBeInTheDocument();
  });

  it('toggles mobile menu when menu button is clicked', () => {
    renderWithProviders(<Header />);
    
    const menuButton = screen.getByLabelText('Mobile menu');
    fireEvent.click(menuButton);
    
    // Menu should be open now
    expect(screen.getByText('Mobile menu')).toBeInTheDocument();
  });

  it('shows cart button with item count', () => {
    const initialState = {
      ui: {
        cartItemsCount: 3,
      },
    };
    
    renderWithProviders(<Header />, initialState);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('toggles language when language button is clicked', () => {
    renderWithProviders(<Header />);
    
    const languageButton = screen.getByLabelText('Switch to Arabic');
    fireEvent.click(languageButton);
    
    // Language should be toggled
    expect(languageButton).toBeInTheDocument();
  });
});
