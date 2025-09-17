import { apiClient } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User, ApiResponse, UserRole } from '../types';
import { findUserByEmail, addUser, updateUser } from '../data/runtimeUsers';

// Check if API is available
const isApiAvailable = async (): Promise<boolean> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://aswan-food-delivery.onrender.com';
    const response = await fetch(`${apiUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

// Use API if available, otherwise fallback to mock
let MOCK_ENABLED = true; // Will be updated dynamically

// Initialize API availability check
isApiAvailable().then(available => {
  MOCK_ENABLED = !available;
});

// Mock user data based on README.md
const MOCK_USERS: Record<string, User> = {
  'customer1@example.com': {
    id: '1',
    email: 'customer1@example.com',
    firstName: 'عميل',
    lastName: 'تجريبي',
    phone: '+20123456789',
    role: UserRole.CUSTOMER,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  'owner1@aswanfood.com': {
    id: '2',
    email: 'owner1@aswanfood.com',
    firstName: 'صاحب',
    lastName: 'مطعم',
    phone: '+20123456790',
    role: UserRole.RESTAURANT_OWNER,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  'driver1@aswanfood.com': {
    id: '3',
    email: 'driver1@aswanfood.com',
    firstName: 'سائق',
    lastName: 'توصيل',
    phone: '+20123456791',
    role: UserRole.DELIVERY_DRIVER,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  'admin@aswanfood.com': {
    id: '4',
    email: 'admin@aswanfood.com',
    firstName: 'مدير',
    lastName: 'النظام',
    phone: '+20123456792',
    role: UserRole.ADMIN,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
};

const MOCK_TOKEN = 'mock-jwt-token-for-demo';

// Default user for fallback
const DEFAULT_USER: User = {
  id: '1',
  email: 'customer1@example.com',
  firstName: 'عميل',
  lastName: 'تجريبي',
  phone: '+20123456789',
  role: UserRole.CUSTOMER,
  isVerified: true,
  createdAt: new Date().toISOString(),
};

// Mock API responses
const createMockResponse = <T>(data: T): Promise<ApiResponse<T>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data,
        message: 'Operation successful',
        messageAr: 'تمت العملية بنجاح',
      });
    }, 500); // Simulate network delay
  });
};

export const login = (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
  if (MOCK_ENABLED) {
    const account = findUserByEmail(credentials.email);
    if (account && credentials.password === account.password) {
      const user: User = {
        id: account.id,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        phone: account.phone,
        role: account.role,
        isVerified: account.isVerified,
        createdAt: account.createdAt,
      };
      localStorage.setItem('token', MOCK_TOKEN);
      localStorage.setItem('user', JSON.stringify(user));
      return createMockResponse<AuthResponse>({ user, token: MOCK_TOKEN });
    }
    return Promise.reject({
      response: {
        data: { success: false, message: 'Invalid credentials', messageAr: 'بيانات الدخول غير صحيحة' },
      },
    });
  }
  return apiClient.post<AuthResponse>('/auth/login', credentials);
};

export const register = (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
  if (MOCK_ENABLED) {
    const created = addUser({
      email: userData.email,
      password: 'user123',
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: userData.role || UserRole.CUSTOMER,
    });
    const user: User = {
      id: created.id,
      email: created.email,
      firstName: created.firstName,
      lastName: created.lastName,
      phone: created.phone,
      role: created.role,
      isVerified: created.isVerified,
      createdAt: created.createdAt,
    };
    localStorage.setItem('token', MOCK_TOKEN);
    localStorage.setItem('user', JSON.stringify(user));
    return createMockResponse<AuthResponse>({ user, token: MOCK_TOKEN });
  }
  return apiClient.post<AuthResponse>('/auth/register', userData);
};

export const getCurrentUser = (): Promise<ApiResponse<User>> => {
  if (MOCK_ENABLED) {
    const token = localStorage.getItem('token');
    if (token) {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : DEFAULT_USER;
      return createMockResponse<User>(user);
    } else {
      return Promise.reject({
        response: {
          status: 401,
          data: {
            success: false,
            message: 'Unauthorized',
            messageAr: 'غير مخول',
          },
        },
      });
    }
  }
  return apiClient.get<User>('/auth/me');
};

export const updateProfile = (userData: Partial<User>): Promise<ApiResponse<User>> => {
  if (MOCK_ENABLED) {
    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : DEFAULT_USER;
    const updatedUser = { ...currentUser, ...userData };
    try {
      updateUser(updatedUser.id, updatedUser as any);
    } catch (e) {}
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return createMockResponse<User>(updatedUser);
  }
  return apiClient.put<User>('/users/profile', userData);
};

export const changePassword = (passwordData: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResponse<void>> => {
  if (MOCK_ENABLED) {
    return createMockResponse<void>(undefined);
  }
  return apiClient.put<void>('/users/password', passwordData);
};

export const logout = (): Promise<ApiResponse<void>> => {
  if (MOCK_ENABLED) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return createMockResponse<void>(undefined);
  }
  return apiClient.post<void>('/auth/logout');
};

export const refreshToken = (refreshToken: string): Promise<ApiResponse<{ token: string }>> => {
  if (MOCK_ENABLED) {
    return createMockResponse<{ token: string }>({
      token: MOCK_TOKEN,
    });
  }
  return apiClient.post<{ token: string }>('/auth/refresh', { refreshToken });
};

export const forgotPassword = (email: string): Promise<ApiResponse<void>> => {
  if (MOCK_ENABLED) {
    return createMockResponse<void>(undefined);
  }
  return apiClient.post<void>('/auth/forgot-password', { email });
};

export const resetPassword = (token: string, password: string): Promise<ApiResponse<void>> => {
  if (MOCK_ENABLED) {
    return createMockResponse<void>(undefined);
  }
  return apiClient.post<void>('/auth/reset-password', { token, password });
};

export const verifyEmail = (token: string): Promise<ApiResponse<void>> => {
  if (MOCK_ENABLED) {
    return createMockResponse<void>(undefined);
  }
  return apiClient.post<void>('/auth/verify-email', { token });
};