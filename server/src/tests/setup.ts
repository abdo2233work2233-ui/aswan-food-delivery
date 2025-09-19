import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Redis for tests
jest.mock('../index', () => {
  const actualModule = jest.requireActual('../index');
  return {
    ...actualModule,
    redis: {
      connect: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      disconnect: jest.fn(),
    },
  };
});

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'mongodb+srv://work23abdo23_db_user:mOFAZbgfzCpWMpIk@cluster0.wohgveh.mongodb.net/aswan_food_test?retryWrites=true&w=majority&appName=Cluster0';
});

afterAll(async () => {
  // Clean up after all tests
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});