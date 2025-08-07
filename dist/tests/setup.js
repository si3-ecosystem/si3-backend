"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load test environment variables
dotenv_1.default.config({ path: '.env.test' });
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
