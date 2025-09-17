import { apiClient } from './api';
import { Address, ApiResponse } from '../types';

// Mock addresses for development
const mockAddresses: Address[] = [
  {
    id: 'addr1',
    userId: 'user1',
    title: 'aswan',
    address: 'aswan end s',
    city: 'أسوان',
    governorate: 'أسوان',
    latitude: 24.0889,
    longitude: 32.8998,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'addr2',
    userId: 'user1',
    title: 'Home',
    address: '123 Main Street',
    city: 'Aswan',
    governorate: 'Aswan',
    latitude: 24.0889,
    longitude: 32.8998,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Check if API is available
const isApiAvailable = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch {
    return false;
  }
};

export const getAddresses = async (): Promise<ApiResponse<Address[]>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    // Return mock data
    return {
      data: mockAddresses,
      success: true,
      message: 'Addresses fetched successfully'
    };
  }
  
  return apiClient.get<Address[]>('/users/addresses');
};

export const addAddress = async (addressData: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Address>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    // Return mock data
    const newAddress: Address = {
      ...addressData,
      id: `addr${Date.now()}`,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return {
      data: newAddress,
      success: true,
      message: 'Address added successfully'
    };
  }
  
  return apiClient.post<Address>('/users/addresses', addressData);
};

export const updateAddress = async (addressId: string, addressData: Partial<Address>): Promise<ApiResponse<Address>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    // Return mock data
    const updatedAddress = mockAddresses.find(addr => addr.id === addressId);
    if (updatedAddress) {
      const newAddress = { ...updatedAddress, ...addressData, updatedAt: new Date().toISOString() };
      return {
        data: newAddress,
        success: true,
        message: 'Address updated successfully'
      };
    }
    throw new Error('Address not found');
  }
  
  return apiClient.put<Address>(`/users/addresses/${addressId}`, addressData);
};

export const deleteAddress = async (addressId: string): Promise<ApiResponse<void>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    // Return mock data
    return {
      data: undefined,
      success: true,
      message: 'Address deleted successfully'
    };
  }
  
  return apiClient.delete<void>(`/users/addresses/${addressId}`);
};

export const setDefaultAddress = async (addressId: string): Promise<ApiResponse<Address>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    // Return mock data
    const address = mockAddresses.find(addr => addr.id === addressId);
    if (address) {
      const updatedAddress = { ...address, isDefault: true, updatedAt: new Date().toISOString() };
      return {
        data: updatedAddress,
        success: true,
        message: 'Default address set successfully'
      };
    }
    throw new Error('Address not found');
  }
  
  return apiClient.put<Address>(`/users/addresses/${addressId}/default`);
};