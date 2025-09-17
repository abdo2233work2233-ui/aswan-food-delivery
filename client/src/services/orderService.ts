import { apiClient } from './api';
import { Order, OrderCalculation, ApiResponse, OrderStatus, PaymentStatus, PaymentMethod } from '../types';

// Mock orders for development
const mockOrders: Order[] = [
  {
    id: 'order_1',
    customerId: 'user1',
    restaurantId: '1',
    addressId: 'addr1',
    orderNumber: 'ORD-001',
    status: OrderStatus.CONFIRMED,
    subtotal: 53.00,
    deliveryFee: 0,
    tax: 7.42,
    discount: 0,
    total: 60.42,
    paymentMethod: PaymentMethod.CARD,
    paymentStatus: PaymentStatus.COMPLETED,
    notes: 'Please deliver to the main entrance',
    estimatedDeliveryTime: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 25 minutes from now
    confirmedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'order_item_1',
        orderId: 'order_1',
        menuItemId: 'item1',
        quantity: 1,
        price: 20.00,
        notes: 'Extra spicy',
      },
      {
        id: 'order_item_2',
        orderId: 'order_1',
        menuItemId: 'item2',
        quantity: 2,
        price: 18.00,
        notes: '',
      }
    ],
  },
  {
    id: 'order_2',
    customerId: 'user1',
    restaurantId: '2',
    addressId: 'addr1',
    orderNumber: 'ORD-002',
    status: OrderStatus.PREPARING,
    subtotal: 45.00,
    deliveryFee: 15.00,
    tax: 8.40,
    discount: 0,
    total: 68.40,
    paymentMethod: PaymentMethod.CASH,
    paymentStatus: PaymentStatus.PENDING,
    notes: 'Extra spicy please',
    estimatedDeliveryTime: new Date(Date.now() + 35 * 60 * 1000).toISOString(), // 35 minutes from now
    confirmedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    items: [
      {
        id: 'order_item_3',
        orderId: 'order_2',
        menuItemId: 'item3',
        quantity: 1,
        price: 35.00,
        notes: 'Extra honey',
      },
      {
        id: 'order_item_4',
        orderId: 'order_2',
        menuItemId: 'item4',
        quantity: 1,
        price: 12.00,
        notes: 'Strong coffee',
      }
    ],
  },
  {
    id: 'order_3',
    customerId: 'user1',
    restaurantId: '1',
    addressId: 'addr1',
    orderNumber: 'ORD-003',
    status: OrderStatus.DELIVERED,
    subtotal: 78.00,
    deliveryFee: 0,
    tax: 10.92,
    discount: 5.00,
    total: 83.92,
    paymentMethod: PaymentMethod.CARD,
    paymentStatus: PaymentStatus.COMPLETED,
    notes: 'Leave at door if no answer',
    estimatedDeliveryTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    confirmedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    preparedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    deliveredAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(), // 50 minutes ago
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'order_item_5',
        orderId: 'order_3',
        menuItemId: 'item1',
        quantity: 2,
        price: 20.00,
        notes: 'Medium spicy',
      },
      {
        id: 'order_item_6',
        orderId: 'order_3',
        menuItemId: 'item2',
        quantity: 1,
        price: 18.00,
        notes: '',
      },
      {
        id: 'order_item_7',
        orderId: 'order_3',
        menuItemId: 'item3',
        quantity: 1,
        price: 35.00,
        notes: 'Extra crispy',
      }
    ],
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

export const calculateOrder = async (orderData: {
  restaurantId: string;
  items: Array<{ menuItemId: string; quantity: number }>;
  couponCode?: string;
}): Promise<ApiResponse<OrderCalculation>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    // Return mock calculation
    const mockCalculation: OrderCalculation = {
      subtotal: 53.00,
      deliveryFee: 0,
      tax: 7.42,
      discount: 0,
      total: 60.42,
    };
    return {
      data: mockCalculation,
      success: true,
      message: 'Order calculated successfully'
    };
  }
  
  return apiClient.post<OrderCalculation>('/orders/calculate', orderData);
};

export const createOrder = async (orderData: {
  restaurantId: string;
  addressId: string;
  items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
  paymentMethod: PaymentMethod;
  notes?: string;
  couponCode?: string;
}): Promise<ApiResponse<Order>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    // Calculate order totals based on actual items
    // For now, we'll use the cart totals that were calculated during checkout
    // In a real app, this would fetch menu item prices from the database
    
    // Mock calculation based on typical Egyptian food prices
    const itemPrices: { [key: string]: number } = {
      'item1': 20, // Koshari (with discount)
      'item2': 18, // Ful Medames
      'item3': 35, // Baklava
      'item4': 12, // Turkish Coffee
    };
    
    const subtotal = orderData.items.reduce((total, item) => {
      const price = itemPrices[item.menuItemId] || 25; // Default price
      return total + (price * item.quantity);
    }, 0);
    
    const deliveryFee = subtotal >= 100 ? 0 : 15; // Free delivery over 100 EGP
    const tax = (subtotal + deliveryFee) * 0.14; // 14% VAT
    const total = subtotal + deliveryFee + tax;
    
    // Create new order and add to mock data
    const newOrder: Order = {
      id: `order_${Date.now()}`,
      customerId: 'user1',
      restaurantId: orderData.restaurantId,
      addressId: orderData.addressId,
      orderNumber: `ORD-${Date.now()}`,
      status: OrderStatus.PENDING,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentMethod === PaymentMethod.CARD ? PaymentStatus.PENDING : PaymentStatus.COMPLETED,
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: 0,
      total: Math.round(total * 100) / 100,
      notes: orderData.notes,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: orderData.items.map((item, index) => ({
        id: `order_item_${Date.now()}_${index}`,
        orderId: `order_${Date.now()}`,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: itemPrices[item.menuItemId] || 25, // Use actual price
        notes: item.notes,
      })),
    };
    
    // Add to mock orders array
    mockOrders.unshift(newOrder); // Add to beginning of array
    
    return {
      data: newOrder,
      success: true,
      message: 'Order created successfully'
    };
  }
  
  return apiClient.post<Order>('/orders', orderData);
};

export const getOrders = async (params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<ApiResponse<{
  orders: Order[];
  pagination: any;
}>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    // Return mock data
    let filteredOrders = [...mockOrders];
    
    // Filter by status if provided
    if (params.status) {
      filteredOrders = filteredOrders.filter(order => order.status === params.status);
    }
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    return {
      data: {
        orders: paginatedOrders,
        pagination: {
          page,
          limit,
          total: filteredOrders.length,
          totalPages: Math.ceil(filteredOrders.length / limit),
          hasNext: endIndex < filteredOrders.length,
          hasPrev: page > 1,
        },
      },
      success: true,
      message: 'Orders fetched successfully'
    };
  }
  
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  return apiClient.get<{
    orders: Order[];
    pagination: any;
  }>(`/users/orders?${queryParams.toString()}`);
};

export const getOrderById = async (orderId: string): Promise<ApiResponse<Order>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    // Return mock data
    const order = mockOrders.find(o => o.id === orderId);
    if (order) {
      return {
        data: order,
        success: true,
        message: 'Order fetched successfully'
      };
    }
    throw new Error('Order not found');
  }
  
  return apiClient.get<Order>(`/orders/${orderId}`);
};

export const cancelOrder = async (orderId: string, reason?: string): Promise<ApiResponse<Order>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    // Find and update the order in mock data
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      const updatedOrder = {
        ...mockOrders[orderIndex],
        status: OrderStatus.CANCELLED,
        cancellationReason: reason || 'Cancelled by customer',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockOrders[orderIndex] = updatedOrder;
      
      return {
        data: updatedOrder,
        success: true,
        message: 'Order cancelled successfully'
      };
    }
    throw new Error('Order not found');
  }
  
  return apiClient.put<Order>(`/orders/${orderId}/cancel`, { reason });
};

export const updateOrderStatus = (
  orderId: string, 
  status: string, 
  estimatedDeliveryTime?: string
): Promise<ApiResponse<Order>> => {
  return apiClient.put<Order>(`/orders/${orderId}/status`, {
    status,
    estimatedDeliveryTime,
  });
};