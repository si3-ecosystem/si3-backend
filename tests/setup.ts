import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Redis for testing
jest.mock('../helpers/redisHelper', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(true),
  cacheDelete: jest.fn().mockResolvedValue(true),
}));

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting RSVP System Tests...');
});

afterAll(() => {
  console.log('✅ RSVP System Tests Complete!');
});
