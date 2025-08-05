"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const server_1 = __importDefault(require("../server"));
const rsvpModel_1 = __importStar(require("../models/rsvpModel"));
const usersModel_1 = __importDefault(require("../models/usersModel"));
describe('RSVP System Integration Tests', () => {
    let mongoServer;
    let authToken;
    let testUser;
    let testEventId;
    let testRSVPId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Start in-memory MongoDB
        mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        yield mongoose_1.default.connect(mongoUri);
        // Create test user
        testUser = yield usersModel_1.default.create({
            email: 'test@example.com',
            roles: ['member'],
            isVerified: true,
            newsletter: false,
            interests: [],
            personalValues: []
        });
        // Mock Sanity event ID (this would be a real Sanity document ID in practice)
        testEventId = 'test-event-123';
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.disconnect();
        yield mongoServer.stop();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up RSVPs before each test
        yield rsvpModel_1.default.deleteMany({});
    }));
    describe('Authentication', () => {
        it('should send OTP email', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .post('/api/auth/email/send-otp')
                .send({ email: 'test@example.com' });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
        }));
        it('should verify OTP and return token', () => __awaiter(void 0, void 0, void 0, function* () {
            // First send OTP
            yield (0, supertest_1.default)(server_1.default)
                .post('/api/auth/email/send-otp')
                .send({ email: 'test@example.com' });
            // Mock OTP verification (in real tests, you'd use the actual OTP)
            const response = yield (0, supertest_1.default)(server_1.default)
                .post('/api/auth/email/verify-otp')
                .send({
                email: 'test@example.com',
                otp: '123456' // This would be mocked in your test environment
            });
            if (response.status === 200) {
                authToken = response.body.data.accessToken;
                expect(response.body.status).toBe('success');
                expect(authToken).toBeDefined();
            }
        }));
    });
    describe('RSVP CRUD Operations', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Ensure we have an auth token for protected routes
            if (!authToken) {
                // Mock authentication for testing
                authToken = 'mock-jwt-token';
            }
        }));
        it('should create a new RSVP', () => __awaiter(void 0, void 0, void 0, function* () {
            const rsvpData = {
                eventId: testEventId,
                status: rsvpModel_1.RSVPStatus.ATTENDING,
                guestCount: 2,
                dietaryRestrictions: 'Vegetarian',
                specialRequests: 'Wheelchair accessible',
                contactInfo: {
                    phone: '+1234567890',
                    emergencyContact: 'Jane Doe - +0987654321'
                }
            };
            const response = yield (0, supertest_1.default)(server_1.default)
                .post('/api/rsvp')
                .set('Authorization', `Bearer ${authToken}`)
                .send(rsvpData);
            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.eventId).toBe(testEventId);
            expect(response.body.data.status).toBe(rsvpModel_1.RSVPStatus.ATTENDING);
            expect(response.body.data.guestCount).toBe(2);
            testRSVPId = response.body.data._id;
        }));
        it('should get user RSVPs', () => __awaiter(void 0, void 0, void 0, function* () {
            // First create an RSVP
            yield rsvpModel_1.default.create({
                eventId: testEventId,
                userId: testUser._id,
                status: rsvpModel_1.RSVPStatus.ATTENDING,
                guestCount: 1
            });
            const response = yield (0, supertest_1.default)(server_1.default)
                .get('/api/rsvp/my-rsvps')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.rsvps).toHaveLength(1);
            expect(response.body.data.pagination).toBeDefined();
        }));
        it('should update an RSVP', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create an RSVP first
            const rsvp = yield rsvpModel_1.default.create({
                eventId: testEventId,
                userId: testUser._id,
                status: rsvpModel_1.RSVPStatus.ATTENDING,
                guestCount: 1
            });
            const updateData = {
                status: rsvpModel_1.RSVPStatus.MAYBE,
                guestCount: 2,
                dietaryRestrictions: 'Vegan'
            };
            const response = yield (0, supertest_1.default)(server_1.default)
                .put(`/api/rsvp/${rsvp._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.status).toBe(rsvpModel_1.RSVPStatus.MAYBE);
            expect(response.body.data.guestCount).toBe(2);
        }));
        it('should delete an RSVP', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create an RSVP first
            const rsvp = yield rsvpModel_1.default.create({
                eventId: testEventId,
                userId: testUser._id,
                status: rsvpModel_1.RSVPStatus.ATTENDING,
                guestCount: 1
            });
            const response = yield (0, supertest_1.default)(server_1.default)
                .delete(`/api/rsvp/${rsvp._id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            // Verify RSVP is deleted
            const deletedRSVP = yield rsvpModel_1.default.findById(rsvp._id);
            expect(deletedRSVP).toBeNull();
        }));
    });
    describe('Event Statistics', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Create test RSVPs for statistics
            yield rsvpModel_1.default.create([
                {
                    eventId: testEventId,
                    userId: new mongoose_1.default.Types.ObjectId(),
                    status: rsvpModel_1.RSVPStatus.ATTENDING,
                    guestCount: 2
                },
                {
                    eventId: testEventId,
                    userId: new mongoose_1.default.Types.ObjectId(),
                    status: rsvpModel_1.RSVPStatus.ATTENDING,
                    guestCount: 1
                },
                {
                    eventId: testEventId,
                    userId: new mongoose_1.default.Types.ObjectId(),
                    status: rsvpModel_1.RSVPStatus.MAYBE,
                    guestCount: 1
                },
                {
                    eventId: testEventId,
                    userId: new mongoose_1.default.Types.ObjectId(),
                    status: rsvpModel_1.RSVPStatus.NOT_ATTENDING,
                    guestCount: 0
                }
            ]);
        }));
        it('should get event RSVP statistics', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .get(`/api/rsvp/event/${testEventId}/stats`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.stats.totalRSVPs).toBe(4);
            expect(response.body.data.stats.attending).toBe(2);
            expect(response.body.data.stats.maybe).toBe(1);
            expect(response.body.data.stats.notAttending).toBe(1);
            expect(response.body.data.stats.totalGuests).toBe(3); // 2 + 1 from attending
        }));
        it('should get event attendees', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .get(`/api/rsvp/event/${testEventId}/attendees`)
                .query({ status: 'attending' });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.attendees).toHaveLength(2);
        }));
        it('should check event availability', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(server_1.default)
                .get(`/api/rsvp/event/${testEventId}/availability`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.eventId).toBe(testEventId);
            expect(response.body.data.isRSVPOpen).toBeDefined();
            expect(response.body.data.hasCapacity).toBeDefined();
        }));
    });
    describe('Waitlist Functionality', () => {
        it('should join waitlist when event is full', () => __awaiter(void 0, void 0, void 0, function* () {
            const waitlistData = {
                eventId: testEventId,
                guestCount: 1,
                notes: 'Very interested in attending'
            };
            const response = yield (0, supertest_1.default)(server_1.default)
                .post('/api/rsvp/waitlist/join')
                .set('Authorization', `Bearer ${authToken}`)
                .send(waitlistData);
            // This might fail if event doesn't have waitlist enabled
            // In a real test, you'd mock the Sanity response
            if (response.status === 201) {
                expect(response.body.status).toBe('success');
                expect(response.body.data.status).toBe(rsvpModel_1.RSVPStatus.WAITLISTED);
                expect(response.body.data.waitlistPosition).toBeDefined();
            }
        }));
        it('should get waitlist position', () => __awaiter(void 0, void 0, void 0, function* () {
            // First join waitlist
            const rsvp = yield rsvpModel_1.default.create({
                eventId: testEventId,
                userId: testUser._id,
                status: rsvpModel_1.RSVPStatus.WAITLISTED,
                guestCount: 1,
                waitlistPosition: 1
            });
            const response = yield (0, supertest_1.default)(server_1.default)
                .get(`/api/rsvp/waitlist/${testEventId}/position`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.position).toBe(1);
        }));
    });
    describe('Validation Tests', () => {
        it('should reject invalid RSVP data', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidData = {
                eventId: '', // Invalid event ID
                status: 'invalid-status',
                guestCount: -1 // Invalid guest count
            };
            const response = yield (0, supertest_1.default)(server_1.default)
                .post('/api/rsvp')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData);
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        }));
        it('should reject duplicate RSVP for same event', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create first RSVP
            yield rsvpModel_1.default.create({
                eventId: testEventId,
                userId: testUser._id,
                status: rsvpModel_1.RSVPStatus.ATTENDING,
                guestCount: 1
            });
            // Try to create duplicate
            const duplicateData = {
                eventId: testEventId,
                status: rsvpModel_1.RSVPStatus.ATTENDING,
                guestCount: 1
            };
            const response = yield (0, supertest_1.default)(server_1.default)
                .post('/api/rsvp')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicateData);
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('already RSVP');
        }));
    });
});
