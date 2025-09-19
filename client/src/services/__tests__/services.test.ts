import { authService } from '../authService';
import { restaurantService } from '../restaurantService';
import { orderService } from '../orderService';
import { userService } from '../userService';
import { socketService } from '../socketService';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
  
  return jest.fn(() => mockSocket);
});

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login with valid credentials', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'أحمد',
            lastName: 'محمد',
            role: 'CUSTOMER',
          },
          token: 'mock-token',
        },
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const result = await authService.login('test@example.com', 'password123');

    expect(result.success).toBe(true);
    expect(result.data.user.email).toBe('test@example.com');
    expect(result.data.token).toBe('mock-token');
  });

  it('should register a new user', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'new@example.com',
            firstName: 'علي',
            lastName: 'أحمد',
            role: 'CUSTOMER',
          },
          token: 'mock-token',
        },
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const userData = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'علي',
      lastName: 'أحمد',
      phone: '+201234567890',
    };

    const result = await authService.register(userData);

    expect(result.success).toBe(true);
    expect(result.data.user.email).toBe('new@example.com');
  });

  it('should handle login errors', async () => {
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Invalid credentials',
        },
      },
    };

    mockedAxios.post.mockRejectedValueOnce(mockError);

    try {
      await authService.login('test@example.com', 'wrongpassword');
    } catch (error: any) {
      expect(error.response.data.success).toBe(false);
      expect(error.response.data.message).toBe('Invalid credentials');
    }
  });
});

describe('Restaurant Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch restaurants', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [
          {
            id: '1',
            name: 'مطعم أسوان',
            nameAr: 'مطعم أسوان',
            description: 'مطعم مصري أصيل',
            rating: 4.5,
            deliveryTime: 30,
            deliveryFee: 15,
            isOpen: true,
          },
        ],
      },
    };

    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await restaurantService.getRestaurants();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('مطعم أسوان');
  });

  it('should fetch restaurant by ID', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          id: '1',
          name: 'مطعم أسوان',
          nameAr: 'مطعم أسوان',
          description: 'مطعم مصري أصيل',
          rating: 4.5,
          deliveryTime: 30,
          deliveryFee: 15,
          isOpen: true,
        },
      },
    };

    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await restaurantService.getRestaurantById('1');

    expect(result.success).toBe(true);
    expect(result.data.id).toBe('1');
    expect(result.data.name).toBe('مطعم أسوان');
  });

  it('should handle API errors gracefully', async () => {
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Restaurant not found',
        },
      },
    };

    mockedAxios.get.mockRejectedValueOnce(mockError);

    try {
      await restaurantService.getRestaurantById('nonexistent');
    } catch (error: any) {
      expect(error.response.data.success).toBe(false);
      expect(error.response.data.message).toBe('Restaurant not found');
    }
  });
});

describe('Order Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create order', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          id: '1',
          userId: '1',
          restaurantId: '1',
          items: [],
          total: 50,
          status: 'PENDING',
          deliveryAddress: '123 Main St',
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const orderData = {
      restaurantId: '1',
      items: [],
      total: 50,
      deliveryAddress: '123 Main St',
      notes: '',
    };

    const result = await orderService.createOrder(orderData);

    expect(result.success).toBe(true);
    expect(result.data.id).toBe('1');
    expect(result.data.total).toBe(50);
  });

  it('should fetch user orders', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [
          {
            id: '1',
            userId: '1',
            restaurantId: '1',
            items: [],
            total: 50,
            status: 'PENDING',
            deliveryAddress: '123 Main St',
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    };

    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await orderService.getUserOrders();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('1');
  });

  it('should update order status', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          id: '1',
          status: 'CONFIRMED',
        },
      },
    };

    mockedAxios.patch.mockResolvedValueOnce(mockResponse);

    const result = await orderService.updateOrderStatus('1', 'CONFIRMED');

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('CONFIRMED');
  });
});

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch user profile', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'أحمد',
          lastName: 'محمد',
          role: 'CUSTOMER',
        },
      },
    };

    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await userService.getProfile();

    expect(result.success).toBe(true);
    expect(result.data.email).toBe('test@example.com');
    expect(result.data.firstName).toBe('أحمد');
  });

  it('should update user profile', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'أحمد',
          lastName: 'محمد',
          role: 'CUSTOMER',
        },
      },
    };

    mockedAxios.patch.mockResolvedValueOnce(mockResponse);

    const updateData = {
      firstName: 'أحمد',
      lastName: 'محمد',
      phone: '+201234567890',
    };

    const result = await userService.updateProfile(updateData);

    expect(result.success).toBe(true);
    expect(result.data.firstName).toBe('أحمد');
  });
});

describe('Socket Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize socket connection', () => {
    const socket = socketService.connect();

    expect(socket).toBeDefined();
    expect(socket.connected).toBe(true);
  });

  it('should handle order updates', () => {
    const socket = socketService.connect();
    const callback = jest.fn();

    socketService.onOrderUpdate(callback);

    expect(socket.on).toHaveBeenCalledWith('orderUpdate', callback);
  });

  it('should handle delivery updates', () => {
    const socket = socketService.connect();
    const callback = jest.fn();

    socketService.onDeliveryUpdate(callback);

    expect(socket.on).toHaveBeenCalledWith('deliveryUpdate', callback);
  });

  it('should emit order status update', () => {
    const socket = socketService.connect();

    socketService.updateOrderStatus('1', 'CONFIRMED');

    expect(socket.emit).toHaveBeenCalledWith('updateOrderStatus', {
      orderId: '1',
      status: 'CONFIRMED',
    });
  });

  it('should disconnect socket', () => {
    const socket = socketService.connect();

    socketService.disconnect();

    expect(socket.disconnect).toHaveBeenCalled();
  });
});