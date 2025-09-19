import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { DashboardLayout } from '../DashboardLayout';
import { DashboardSidebar } from '../DashboardSidebar';
import { DashboardHeader } from '../DashboardHeader';
import { DashboardStats } from '../DashboardStats';
import { DashboardTable } from '../DashboardTable';
import { DashboardModal } from '../DashboardModal';
import { DashboardForm } from '../DashboardForm';

// Mock store for testing
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: true, user: { role: 'ADMIN' } }, action) => state,
      ui: (state = { theme: 'light', language: 'ar', sidebarOpen: false }, action) => state,
    },
    preloadedState: initialState,
  });
};

describe('DashboardLayout', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardLayout>
            <div>Dashboard content</div>
          </DashboardLayout>
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('should render sidebar and header', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardLayout>
            <div>Dashboard content</div>
          </DashboardLayout>
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
  });
});

describe('DashboardSidebar', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardSidebar />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
  });

  it('should show navigation items', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardSidebar />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('لوحة التحكم')).toBeInTheDocument();
    expect(screen.getByText('المطاعم')).toBeInTheDocument();
    expect(screen.getByText('الطلبات')).toBeInTheDocument();
    expect(screen.getByText('المستخدمين')).toBeInTheDocument();
    expect(screen.getByText('الإعدادات')).toBeInTheDocument();
  });

  it('should handle sidebar toggle', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardSidebar />
        </BrowserRouter>
      </Provider>
    );
    
    const toggleButton = screen.getByTestId('sidebar-toggle');
    expect(toggleButton).toBeInTheDocument();
  });
});

describe('DashboardHeader', () => {
  it('should render correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardHeader />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
  });

  it('should show user info', () => {
    const store = createMockStore({
      auth: {
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'admin@example.com',
          firstName: 'أحمد',
          lastName: 'محمد',
          role: 'ADMIN',
        },
      },
    });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardHeader />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
  });

  it('should show logout button', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardHeader />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('تسجيل الخروج')).toBeInTheDocument();
  });
});

describe('DashboardStats', () => {
  it('should render correctly', () => {
    const stats = [
      { title: 'إجمالي المطاعم', value: 10, icon: 'restaurant' },
      { title: 'إجمالي الطلبات', value: 150, icon: 'order' },
      { title: 'إجمالي المستخدمين', value: 500, icon: 'user' },
      { title: 'إجمالي الإيرادات', value: 25000, icon: 'revenue' },
    ];
    
    render(<DashboardStats stats={stats} />);
    
    expect(screen.getByText('إجمالي المطاعم')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('إجمالي الطلبات')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should handle empty stats', () => {
    render(<DashboardStats stats={[]} />);
    expect(screen.getByText('لا توجد إحصائيات')).toBeInTheDocument();
  });
});

describe('DashboardTable', () => {
  it('should render correctly', () => {
    const columns = [
      { key: 'id', title: 'ID' },
      { key: 'name', title: 'الاسم' },
      { key: 'email', title: 'البريد الإلكتروني' },
    ];
    
    const data = [
      { id: '1', name: 'أحمد محمد', email: 'ahmed@example.com' },
      { id: '2', name: 'علي أحمد', email: 'ali@example.com' },
    ];
    
    render(<DashboardTable columns={columns} data={data} />);
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('الاسم')).toBeInTheDocument();
    expect(screen.getByText('البريد الإلكتروني')).toBeInTheDocument();
    expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
    expect(screen.getByText('علي أحمد')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    const columns = [
      { key: 'id', title: 'ID' },
      { key: 'name', title: 'الاسم' },
    ];
    
    render(<DashboardTable columns={columns} data={[]} />);
    expect(screen.getByText('لا توجد بيانات')).toBeInTheDocument();
  });
});

describe('DashboardModal', () => {
  it('should render when open', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="إضافة مطعم">
        <div>Modal content</div>
      </DashboardModal>
    );
    
    expect(screen.getByText('إضافة مطعم')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <DashboardModal isOpen={false} onClose={() => {}} title="إضافة مطعم">
        <div>Modal content</div>
      </DashboardModal>
    );
    
    expect(screen.queryByText('إضافة مطعم')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <DashboardModal isOpen={true} onClose={handleClose} title="إضافة مطعم">
        <div>Modal content</div>
      </DashboardModal>
    );
    
    const closeButton = screen.getByTestId('modal-close');
    closeButton.click();
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('DashboardForm', () => {
  it('should render correctly', () => {
    const fields = [
      { name: 'name', label: 'الاسم', type: 'text', required: true },
      { name: 'email', label: 'البريد الإلكتروني', type: 'email', required: true },
      { name: 'phone', label: 'الهاتف', type: 'tel', required: false },
    ];
    
    render(<DashboardForm fields={fields} onSubmit={() => {}} />);
    
    expect(screen.getByLabelText('الاسم')).toBeInTheDocument();
    expect(screen.getByLabelText('البريد الإلكتروني')).toBeInTheDocument();
    expect(screen.getByLabelText('الهاتف')).toBeInTheDocument();
  });

  it('should show submit button', () => {
    const fields = [
      { name: 'name', label: 'الاسم', type: 'text', required: true },
    ];
    
    render(<DashboardForm fields={fields} onSubmit={() => {}} />);
    
    expect(screen.getByText('حفظ')).toBeInTheDocument();
  });

  it('should handle form submission', () => {
    const handleSubmit = jest.fn();
    const fields = [
      { name: 'name', label: 'الاسم', type: 'text', required: true },
    ];
    
    render(<DashboardForm fields={fields} onSubmit={handleSubmit} />);
    
    const submitButton = screen.getByText('حفظ');
    submitButton.click();
    
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});