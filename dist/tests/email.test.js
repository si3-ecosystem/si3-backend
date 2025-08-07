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
const rsvpEmailService_1 = __importDefault(require("../services/rsvpEmailService"));
const rsvpModel_1 = __importStar(require("../models/rsvpModel"));
const usersModel_1 = __importDefault(require("../models/usersModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
// Mock ProtonMail service
jest.mock('../config/protonMail', () => ({
    emailService: {
        sendEmail: jest.fn().mockResolvedValue({ success: true })
    }
}));
// Mock Sanity service
jest.mock('../config/sanity', () => ({
    SanityEventService: {
        getEventById: jest.fn().mockResolvedValue({
            _id: 'test-event-123',
            title: 'Test Guide Session',
            description: 'A test session for email notifications',
            eventDate: '2024-12-01T18:00:00.000Z',
            endDate: '2024-12-01T20:00:00.000Z',
            location: {
                type: 'virtual',
                venue: 'Zoom Meeting',
                virtualLink: 'https://zoom.us/j/123456789',
                accessInstructions: 'Meeting ID: 123 456 789'
            },
            organizer: {
                name: 'SI3 Team',
                email: 'events@si3.space',
                phone: '+1234567890'
            },
            guideName: 'Test Guide'
        })
    }
}));
describe('RSVP Email Service Tests', () => {
    let mongoServer;
    let testUser;
    let testRSVP;
    let mockEmailService;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        yield mongoose_1.default.connect(mongoUri);
        // Get mock email service
        mockEmailService = require('../config/protonMail').emailService;
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.disconnect();
        yield mongoServer.stop();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Reset mocks
        jest.clearAllMocks();
        // Clean up data
        yield usersModel_1.default.deleteMany({});
        yield rsvpModel_1.default.deleteMany({});
        // Create test user
        testUser = yield usersModel_1.default.create({
            email: 'test@example.com',
            roles: ['member'],
            isVerified: true,
            newsletter: false,
            interests: [],
            personalValues: []
        });
        // Create test RSVP
        testRSVP = yield rsvpModel_1.default.create({
            eventId: 'test-event-123',
            userId: testUser._id,
            status: rsvpModel_1.RSVPStatus.ATTENDING,
            guestCount: 2,
            dietaryRestrictions: 'Vegetarian',
            specialRequests: 'Wheelchair accessible seating',
            contactInfo: {
                phone: '+1234567890',
                emergencyContact: 'Jane Doe - +0987654321'
            },
            confirmationEmailSent: false,
            reminderEmailsSent: []
        });
    }));
    describe('Confirmation Email', () => {
        it('should send confirmation email successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield rsvpEmailService_1.default.sendConfirmationEmail(testRSVP._id.toString(), 'Welcome to our event!');
            expect(result).toBe(true);
            expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
                toEmail: 'test@example.com',
                toName: 'test@example.com',
                subject: 'RSVP Confirmation - Test Guide Session',
                senderName: 'SI3 Team',
                senderEmail: 'events@si3.space',
                htmlContent: expect.stringContaining('Test Guide Session'),
                emailType: 'rsvp'
            });
            // Check that confirmation flag is updated
            const updatedRSVP = yield rsvpModel_1.default.findById(testRSVP._id);
            expect(updatedRSVP === null || updatedRSVP === void 0 ? void 0 : updatedRSVP.confirmationEmailSent).toBe(true);
        }));
        it('should include RSVP details in confirmation email', () => __awaiter(void 0, void 0, void 0, function* () {
            yield rsvpEmailService_1.default.sendConfirmationEmail(testRSVP._id.toString());
            const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
            expect(emailCall.htmlContent).toContain('Status: attending');
            expect(emailCall.htmlContent).toContain('2 people');
            expect(emailCall.htmlContent).toContain('Vegetarian');
            expect(emailCall.htmlContent).toContain('Wheelchair accessible seating');
            expect(emailCall.htmlContent).toContain('+1234567890');
        }));
        it('should handle custom message in confirmation email', () => __awaiter(void 0, void 0, void 0, function* () {
            const customMessage = 'Looking forward to seeing you!';
            yield rsvpEmailService_1.default.sendConfirmationEmail(testRSVP._id.toString(), customMessage);
            const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
            expect(emailCall.htmlContent).toContain(customMessage);
        }));
        it('should return false when RSVP not found', () => __awaiter(void 0, void 0, void 0, function* () {
            const fakeId = new mongoose_1.default.Types.ObjectId().toString();
            const result = yield rsvpEmailService_1.default.sendConfirmationEmail(fakeId);
            expect(result).toBe(false);
            expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
        }));
        it('should return false when email service fails', () => __awaiter(void 0, void 0, void 0, function* () {
            mockEmailService.sendEmail.mockResolvedValueOnce({ success: false });
            const result = yield rsvpEmailService_1.default.sendConfirmationEmail(testRSVP._id.toString());
            expect(result).toBe(false);
        }));
    });
    describe('Reminder Email', () => {
        it('should send reminder email for attending users', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield rsvpEmailService_1.default.sendReminderEmail(testRSVP._id.toString(), '24_hours', 'Don\'t forget to bring your ID!');
            expect(result).toBe(true);
            expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
                toEmail: 'test@example.com',
                toName: 'test@example.com',
                subject: '24 Hour Reminder - Test Guide Session',
                senderName: 'SI3 Team',
                senderEmail: 'events@si3.space',
                htmlContent: expect.stringContaining('Don\'t forget to bring your ID!'),
                emailType: 'rsvp'
            });
            // Check that reminder is marked as sent
            const updatedRSVP = yield rsvpModel_1.default.findById(testRSVP._id);
            expect(updatedRSVP === null || updatedRSVP === void 0 ? void 0 : updatedRSVP.reminderEmailsSent).toContain('24_hours');
        }));
        it('should not send reminder to non-attending users', () => __awaiter(void 0, void 0, void 0, function* () {
            // Update RSVP to not attending
            yield rsvpModel_1.default.findByIdAndUpdate(testRSVP._id, { status: rsvpModel_1.RSVPStatus.NOT_ATTENDING });
            const result = yield rsvpEmailService_1.default.sendReminderEmail(testRSVP._id.toString(), '24_hours');
            expect(result).toBe(false);
            expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
        }));
        it('should not send duplicate reminders', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mark reminder as already sent
            yield rsvpModel_1.default.findByIdAndUpdate(testRSVP._id, {
                reminderEmailsSent: ['24_hours']
            });
            const result = yield rsvpEmailService_1.default.sendReminderEmail(testRSVP._id.toString(), '24_hours');
            expect(result).toBe(false);
            expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
        }));
        it('should include different reminder messages', () => __awaiter(void 0, void 0, void 0, function* () {
            const reminderTypes = ['1_week', '24_hours', '1_day', '2_hours'];
            for (const reminderType of reminderTypes) {
                // Reset RSVP
                yield rsvpModel_1.default.findByIdAndUpdate(testRSVP._id, {
                    reminderEmailsSent: []
                });
                yield rsvpEmailService_1.default.sendReminderEmail(testRSVP._id.toString(), reminderType);
                const emailCall = mockEmailService.sendEmail.mock.calls[mockEmailService.sendEmail.mock.calls.length - 1][0];
                expect(emailCall.subject).toContain(reminderType.replace('_', ' '));
            }
        }));
    });
    describe('Waitlist Notification', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Update RSVP to waitlisted
            yield rsvpModel_1.default.findByIdAndUpdate(testRSVP._id, {
                status: rsvpModel_1.RSVPStatus.WAITLISTED,
                waitlistPosition: 1
            });
        }));
        it('should send waitlist notification email', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield rsvpEmailService_1.default.sendWaitlistNotification(testRSVP._id.toString());
            expect(result).toBe(true);
            expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
                toEmail: 'test@example.com',
                toName: 'test@example.com',
                subject: 'Spot Available - Test Guide Session',
                senderName: 'SI3 Team',
                senderEmail: 'events@si3.space',
                htmlContent: expect.stringContaining('You\'re Off the Waitlist!'),
                emailType: 'rsvp'
            });
        }));
        it('should include urgency message in waitlist notification', () => __awaiter(void 0, void 0, void 0, function* () {
            yield rsvpEmailService_1.default.sendWaitlistNotification(testRSVP._id.toString());
            const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
            expect(emailCall.htmlContent).toContain('Time Sensitive');
            expect(emailCall.htmlContent).toContain('24 hours');
        }));
    });
    describe('Bulk Reminder Emails', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Create multiple RSVPs for bulk testing
            const users = yield usersModel_1.default.create([
                { email: 'user1@example.com', roles: ['member'], isVerified: true, newsletter: false, interests: [], personalValues: [] },
                { email: 'user2@example.com', roles: ['member'], isVerified: true, newsletter: false, interests: [], personalValues: [] },
                { email: 'user3@example.com', roles: ['member'], isVerified: true, newsletter: false, interests: [], personalValues: [] }
            ]);
            yield rsvpModel_1.default.create([
                {
                    eventId: 'test-event-123',
                    userId: users[0]._id,
                    status: rsvpModel_1.RSVPStatus.ATTENDING,
                    guestCount: 1,
                    reminderEmailsSent: []
                },
                {
                    eventId: 'test-event-123',
                    userId: users[1]._id,
                    status: rsvpModel_1.RSVPStatus.ATTENDING,
                    guestCount: 1,
                    reminderEmailsSent: []
                },
                {
                    eventId: 'test-event-123',
                    userId: users[2]._id,
                    status: rsvpModel_1.RSVPStatus.NOT_ATTENDING,
                    guestCount: 0,
                    reminderEmailsSent: []
                }
            ]);
        }));
        it('should send bulk reminders to attending users only', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield rsvpEmailService_1.default.sendBulkReminders({
                eventId: 'test-event-123',
                reminderType: '24_hours',
                customMessage: 'Event starts soon!'
            });
            expect(result.sent).toBe(3); // Including original testRSVP
            expect(result.failed).toBe(0);
            expect(result.errors).toHaveLength(0);
            expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(3);
        }));
        it('should handle email failures gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock one email to fail
            mockEmailService.sendEmail
                .mockResolvedValueOnce({ success: true })
                .mockResolvedValueOnce({ success: false })
                .mockResolvedValueOnce({ success: true });
            const result = yield rsvpEmailService_1.default.sendBulkReminders({
                eventId: 'test-event-123',
                reminderType: '24_hours'
            });
            expect(result.sent).toBe(2);
            expect(result.failed).toBe(1);
            expect(result.errors.length).toBeGreaterThan(0);
        }));
    });
    describe('Waitlist Processing', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Create waitlisted users
            const users = yield usersModel_1.default.create([
                { email: 'waitlist1@example.com', roles: ['member'], isVerified: true, newsletter: false, interests: [], personalValues: [] },
                { email: 'waitlist2@example.com', roles: ['member'], isVerified: true, newsletter: false, interests: [], personalValues: [] }
            ]);
            yield rsvpModel_1.default.create([
                {
                    eventId: 'test-event-123',
                    userId: users[0]._id,
                    status: rsvpModel_1.RSVPStatus.WAITLISTED,
                    guestCount: 1,
                    waitlistPosition: 1
                },
                {
                    eventId: 'test-event-123',
                    userId: users[1]._id,
                    status: rsvpModel_1.RSVPStatus.WAITLISTED,
                    guestCount: 1,
                    waitlistPosition: 2
                }
            ]);
        }));
        it('should process waitlist and promote users', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield rsvpEmailService_1.default.processWaitlistNotifications('test-event-123', 2);
            expect(result.notified).toBe(2);
            expect(result.promoted).toContain('waitlist1@example.com');
            expect(result.promoted).toContain('waitlist2@example.com');
            // Check that RSVPs are updated to attending
            const promotedRSVPs = yield rsvpModel_1.default.find({
                eventId: 'test-event-123',
                status: rsvpModel_1.RSVPStatus.ATTENDING
            });
            expect(promotedRSVPs.length).toBeGreaterThanOrEqual(2);
        }));
        it('should respect waitlist order', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield rsvpEmailService_1.default.processWaitlistNotifications('test-event-123', 1);
            expect(result.notified).toBe(1);
            expect(result.promoted).toContain('waitlist1@example.com');
            expect(result.promoted).not.toContain('waitlist2@example.com');
        }));
    });
    describe('Update Notification', () => {
        it('should send update notification with changes', () => __awaiter(void 0, void 0, void 0, function* () {
            const changes = ['Status changed to Maybe', 'Guest count updated to 3'];
            const result = yield rsvpEmailService_1.default.sendUpdateNotification(testRSVP._id.toString(), changes, 'Please confirm your attendance');
            expect(result).toBe(true);
            expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
                toEmail: 'test@example.com',
                toName: 'test@example.com',
                subject: 'RSVP Updated - Test Guide Session',
                senderName: 'SI3 Team',
                senderEmail: 'events@si3.space',
                htmlContent: expect.stringContaining('Status changed to Maybe'),
                emailType: 'rsvp'
            });
            const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
            expect(emailCall.htmlContent).toContain('Guest count updated to 3');
            expect(emailCall.htmlContent).toContain('Please confirm your attendance');
        }));
    });
    describe('Error Handling', () => {
        it('should handle Sanity service errors', () => __awaiter(void 0, void 0, void 0, function* () {
            const { SanityEventService } = require('../config/sanity');
            SanityEventService.getEventById.mockRejectedValueOnce(new Error('Sanity error'));
            const result = yield rsvpEmailService_1.default.sendConfirmationEmail(testRSVP._id.toString());
            expect(result).toBe(false);
        }));
        it('should handle database errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Close database connection to simulate error
            yield mongoose_1.default.disconnect();
            const result = yield rsvpEmailService_1.default.sendConfirmationEmail(testRSVP._id.toString());
            expect(result).toBe(false);
            // Reconnect for cleanup
            const mongoUri = mongoServer.getUri();
            yield mongoose_1.default.connect(mongoUri);
        }));
    });
});
