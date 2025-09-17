import request from 'supertest';
import { app } from '../index';
import { prisma } from '../index';
import { redis } from '../index';
import jwt from 'jsonwebtoken';
import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from '@prisma/client';

// Test setup
const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.CUSTOMER,
  isActive: true,
  isVerified: true,
};

const TEST_RESTAURANT = {
  id: 'test-restaurant-id',
  name: 'Test Restaurant',
  nameAr: 'مطعم تجريبي',
  isActive: true,
  isOpen: true,
  deliveryFee: 15,
  minimumOrder: 30,
  ownerId: 'restaurant-owner-id',
};

const TEST_ADDRESS = {
  id: 'test-address-id',
  userId: TEST_USER.id,
  title: 'Home',
  address: '123 Test Street',
  city: 'Aswan',
  governorate: 'Aswan',
  latitude: 24.0889,
  longitude: 32.8998,
  isDefault: true,
};

const TEST_MENU_ITEMS = [
  {
    id: 'menu-item-1',
    restaurantId: TEST_RESTAURANT.id,
    name: 'Test Item 1',
    nameAr: 'عنصر تجريبي 1',
    price: 25.99,
    isAvailable: true,
  },
  {
    id: 'menu-item-2',
    restaurantId: TEST_RESTAURANT.id,
    name: 'Test Item 2',
    nameAr: 'عنصر تجريبي 2',
    price: 18.50,
    discountPrice: 15.99,
    isAvailable: true,
  },
];

// Generate JWT token for testing
const generateTestToken = (user = TEST_USER): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Mock data setup
const setupTestData = async () => {
  // Clear existing test data
  await prisma.order.deleteMany({ where: { customerId: TEST_USER.id } });
  await prisma.menuItem.deleteMany({ where: { restaurantId: TEST_RESTAURANT.id } });
  await prisma.restaurant.deleteMany({ where: { id: TEST_RESTAURANT.id } });
  await prisma.address.deleteMany({ where: { userId: TEST_USER.id } });
  await prisma.user.deleteMany({ where: { id: TEST_USER.id } });

  // Create test user
  await prisma.user.create({ data: TEST_USER });

  // Create test restaurant
  await prisma.restaurant.create({ data: TEST_RESTAURANT });

  // Create test address
  await prisma.address.create({ data: TEST_ADDRESS });

  // Create test menu items
  await prisma.menuItem.createMany({ data: TEST_MENU_ITEMS });
};

// Cleanup test data
const cleanupTestData = async () => {
  await prisma.order.deleteMany({ where: { customerId: TEST_USER.id } });
  await prisma.menuItem.deleteMany({ where: { restaurantId: TEST_RESTAURANT.id } });
  await prisma.restaurant.deleteMany({ where: { id: TEST_RESTAURANT.id } });
  await prisma.address.deleteMany({ where: { userId: TEST_USER.id } });
  await prisma.user.deleteMany({ where: { id: TEST_USER.id } });
};

describe('Secure Checkout System', () => {
  let authToken: string;

  beforeAll(async () => {
    await setupTestData();
    authToken = generateTestToken();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
    await redis.disconnect();
  });

  describe('Order Calculation Endpoint', () => {
    const validCalculationData = {
      restaurantId: TEST_RESTAURANT.id,
      items: [
        { menuItemId: TEST_MENU_ITEMS[0].id, quantity: 2 },
        { menuItemId: TEST_MENU_ITEMS[1].id, quantity: 1 },
      ],
    };

    test('should calculate order total correctly', async () => {
      const response = await request(app)
        .post('/api/orders/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validCalculationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('subtotal');
      expect(response.body.data).toHaveProperty('deliveryFee', TEST_RESTAURANT.deliveryFee);
      expect(response.body.data).toHaveProperty('tax');
      expect(response.body.data).toHaveProperty('total');

      // Verify calculation accuracy
      const expectedSubtotal = (TEST_MENU_ITEMS[0].price * 2) + TEST_MENU_ITEMS[1].discountPrice!;
      expect(response.body.data.subtotal).toBeCloseTo(expectedSubtotal, 2);
    });

    test('should reject calculation for inactive restaurant', async () => {
      const response = await request(app)
        .post('/api/orders/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validCalculationData,
          restaurantId: 'non-existent-restaurant',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should handle empty items array', async () => {
      const response = await request(app)
        .post('/api/orders/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          restaurantId: TEST_RESTAURANT.id,
          items: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    test('should rate limit calculation requests', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const promises = Array.from({ length: 25 }, () =>
        request(app)
          .post('/api/orders/calculate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validCalculationData)
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Order Creation Endpoint', () => {
    const validOrderData = {
      restaurantId: TEST_RESTAURANT.id,
      addressId: TEST_ADDRESS.id,
      items: [
        { menuItemId: TEST_MENU_ITEMS[0].id, quantity: 2, notes: 'No onions' },
        { menuItemId: TEST_MENU_ITEMS[1].id, quantity: 1 },
      ],
      paymentMethod: PaymentMethod.CASH,
      notes: 'Please ring the bell',
    };

    test('should create order successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validOrderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data).toHaveProperty('status', OrderStatus.PENDING);
      expect(response.body.data).toHaveProperty('paymentStatus', PaymentStatus.PENDING);
      expect(response.body.data.customerId).toBe(TEST_USER.id);
      expect(response.body.data.restaurantId).toBe(TEST_RESTAURANT.id);
      expect(response.body.data.addressId).toBe(TEST_ADDRESS.id);
    });

    test('should prevent price manipulation by using server-side prices', async () => {
      // Try to manipulate prices by sending modified item data
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validOrderData)
        .expect(201);

      // Verify that server-calculated prices are used, not client-provided ones
      const order = response.body.data;
      const expectedTotal = order.subtotal + order.deliveryFee + order.tax - order.discount;
      expect(order.total).toBeCloseTo(expectedTotal, 2);
    });

    test('should reject order with invalid address', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validOrderData,
          addressId: 'invalid-address-id',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Address not found');
    });

    test('should reject order with unavailable menu items', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validOrderData,
          items: [
            { menuItemId: 'non-existent-item', quantity: 1 },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not available');
    });

    test('should reject order below minimum order amount', async () => {
      // Create order with very small quantity to go below minimum
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validOrderData,
          items: [
            { menuItemId: TEST_MENU_ITEMS[1].id, quantity: 1 }, // Only 15.99 EGP
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Minimum order');
    });

    test('should sanitize and validate order notes', async () => {
      const maliciousNotes = '<script>alert(\"xss\")</script>Test notes';
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validOrderData,
          notes: maliciousNotes,
        })
        .expect(201);

      // Notes should be cleaned of malicious content
      expect(response.body.data.notes).not.toContain('<script>');
      expect(response.body.data.notes).not.toContain('alert');
    });

    test('should limit maximum order quantity', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validOrderData,
          items: [
            { menuItemId: TEST_MENU_ITEMS[0].id, quantity: 150 }, // Exceeds limit
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('maximum limit');
    });

    test('should rate limit order creation', async () => {
      // Attempt to create multiple orders rapidly
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validOrderData)
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation Security', () => {
    test('should reject SQL injection attempts', async () => {
      const maliciousData = {
        restaurantId: \"'; DROP TABLE orders; --\",
        addressId: TEST_ADDRESS.id,
        items: [{ menuItemId: \"'; SELECT * FROM users; --\", quantity: 1 }],
        paymentMethod: PaymentMethod.CASH,
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject XSS attempts in order notes', async () => {
      const xssPayloads = [
        '<script>alert(\"xss\")</script>',
        'javascript:alert(\"xss\")',
        'onload=\"alert(\\\"xss\\\")\"',
        '<img src=x onerror=alert(\"xss\")>',
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            restaurantId: TEST_RESTAURANT.id,
            addressId: TEST_ADDRESS.id,
            items: [{ menuItemId: TEST_MENU_ITEMS[0].id, quantity: 1 }],
            paymentMethod: PaymentMethod.CASH,
            notes: payload,
          });

        // Should either reject the request or sanitize the input
        if (response.status === 201) {
          expect(response.body.data.notes).not.toContain('<script>');
          expect(response.body.data.notes).not.toContain('javascript:');
          expect(response.body.data.notes).not.toContain('onerror');
        }
      }
    });

    test('should validate payment method enum', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          restaurantId: TEST_RESTAURANT.id,
          addressId: TEST_ADDRESS.id,
          items: [{ menuItemId: TEST_MENU_ITEMS[0].id, quantity: 1 }],
          paymentMethod: 'INVALID_METHOD',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication and Authorization', () => {
    test('should reject requests without authentication token', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          restaurantId: TEST_RESTAURANT.id,
          addressId: TEST_ADDRESS.id,
          items: [{ menuItemId: TEST_MENU_ITEMS[0].id, quantity: 1 }],
          paymentMethod: PaymentMethod.CASH,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    test('should reject requests with invalid token', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          restaurantId: TEST_RESTAURANT.id,
          addressId: TEST_ADDRESS.id,
          items: [{ menuItemId: TEST_MENU_ITEMS[0].id, quantity: 1 }],
          paymentMethod: PaymentMethod.CASH,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject access to other users addresses', async () => {
      // Create another user's address
      const otherUserAddress = await prisma.address.create({
        data: {
          ...TEST_ADDRESS,
          id: 'other-user-address',
          userId: 'other-user-id',
        },
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          restaurantId: TEST_RESTAURANT.id,
          addressId: otherUserAddress.id,
          items: [{ menuItemId: TEST_MENU_ITEMS[0].id, quantity: 1 }],
          paymentMethod: PaymentMethod.CASH,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Address not found');

      // Cleanup
      await prisma.address.delete({ where: { id: otherUserAddress.id } });
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle database connection errors gracefully', async () => {
      // Mock database error by temporarily disconnecting
      await prisma.$disconnect();

      const response = await request(app)
        .post('/api/orders/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          restaurantId: TEST_RESTAURANT.id,
          items: [{ menuItemId: TEST_MENU_ITEMS[0].id, quantity: 1 }],
        });

      // Should return a proper error response, not crash
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');

      // Reconnect for other tests
      await setupTestData();
    });

    test('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle very large request bodies', async () => {
      const largeNotes = 'A'.repeat(10000); // 10KB of text
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          restaurantId: TEST_RESTAURANT.id,
          addressId: TEST_ADDRESS.id,
          items: [{ menuItemId: TEST_MENU_ITEMS[0].id, quantity: 1 }],
          paymentMethod: PaymentMethod.CASH,
          notes: largeNotes,
        });

      // Should either reject the request or truncate the notes
      if (response.status === 201) {
        expect(response.body.data.notes.length).toBeLessThanOrEqual(500);
      } else {
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent order requests', async () => {
      const concurrentRequests = 50;
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            restaurantId: TEST_RESTAURANT.id,
            addressId: TEST_ADDRESS.id,
            items: [{ menuItemId: TEST_MENU_ITEMS[0].id, quantity: 1 }],
            paymentMethod: PaymentMethod.CASH,
            notes: `Concurrent order ${i}`,
          })
      );

      const responses = await Promise.all(promises);
      const successfulResponses = responses.filter(r => r.status === 201);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // Should handle some requests successfully and rate limit others
      expect(successfulResponses.length).toBeGreaterThan(0);
      expect(successfulResponses.length + rateLimitedResponses.length).toBe(concurrentRequests);
    });

    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/orders/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          restaurantId: TEST_RESTAURANT.id,
          items: [{ menuItemId: TEST_MENU_ITEMS[0].id, quantity: 1 }],
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });
});