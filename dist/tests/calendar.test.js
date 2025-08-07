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
const calendarService_1 = __importDefault(require("../services/calendarService"));
const rsvpModel_1 = __importStar(require("../models/rsvpModel"));
const usersModel_1 = __importDefault(require("../models/usersModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
// Mock Sanity service
jest.mock('../config/sanity', () => ({
    SanityEventService: {
        getEventById: jest.fn().mockResolvedValue({
            _id: 'test-event-123',
            title: 'Test Guide Session',
            description: 'A test session for calendar generation',
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
            guideName: 'Test Guide',
            slug: 'test-guide-session'
        })
    }
}));
describe('Calendar Service Tests', () => {
    let mongoServer;
    let testUser;
    let testRSVP;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
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
            }
        });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.disconnect();
        yield mongoServer.stop();
    }));
    describe('ICS Calendar Generation', () => {
        it('should generate valid ICS content for RSVP', () => __awaiter(void 0, void 0, void 0, function* () {
            const icsContent = yield calendarService_1.default.generateICSForRSVP(testRSVP._id.toString());
            expect(icsContent).toContain('BEGIN:VCALENDAR');
            expect(icsContent).toContain('END:VCALENDAR');
            expect(icsContent).toContain('BEGIN:VEVENT');
            expect(icsContent).toContain('END:VEVENT');
            expect(icsContent).toContain('SUMMARY:Test Guide Session');
            expect(icsContent).toContain('LOCATION:Zoom Meeting');
            expect(icsContent).toContain('ORGANIZER;CN=SI3 Team:mailto:events@si3.space');
            expect(icsContent).toContain('ATTENDEE;CN=test@example.com');
        }));
        it('should include RSVP details in description', () => __awaiter(void 0, void 0, void 0, function* () {
            const icsContent = yield calendarService_1.default.generateICSForRSVP(testRSVP._id.toString());
            expect(icsContent).toContain('Status: attending');
            expect(icsContent).toContain('Guests: 2 people');
            expect(icsContent).toContain('Dietary Restrictions: Vegetarian');
            expect(icsContent).toContain('Special Requests: Wheelchair accessible seating');
            expect(icsContent).toContain('Contact: events@si3.space');
        }));
        it('should include event reminders', () => __awaiter(void 0, void 0, void 0, function* () {
            const icsContent = yield calendarService_1.default.generateICSForRSVP(testRSVP._id.toString());
            expect(icsContent).toContain('BEGIN:VALARM');
            expect(icsContent).toContain('TRIGGER:-PT1H'); // 1 hour before
            expect(icsContent).toContain('TRIGGER:-PT24H'); // 24 hours before
            expect(icsContent).toContain('ACTION:DISPLAY');
        }));
        it('should handle virtual event links', () => __awaiter(void 0, void 0, void 0, function* () {
            const icsContent = yield calendarService_1.default.generateICSForRSVP(testRSVP._id.toString());
            expect(icsContent).toContain('Zoom Meeting (Virtual: https://zoom.us/j/123456789)');
            expect(icsContent).toContain('Access Instructions');
            expect(icsContent).toContain('Meeting ID: 123 456 789');
        }));
        it('should throw error for non-existent RSVP', () => __awaiter(void 0, void 0, void 0, function* () {
            const fakeId = new mongoose_1.default.Types.ObjectId().toString();
            yield expect(calendarService_1.default.generateICSForRSVP(fakeId))
                .rejects.toThrow('RSVP not found');
        }));
    });
    describe('Calendar Filename Generation', () => {
        it('should generate valid filename', () => {
            const filename = calendarService_1.default.generateCalendarFilename('Test Guide Session!@#$%', testRSVP._id.toString());
            expect(filename).toMatch(/^test_guide_session_[a-f0-9]{24}\.ics$/);
            expect(filename.length).toBeLessThanOrEqual(100); // Reasonable length
        });
        it('should handle long event titles', () => {
            const longTitle = 'A'.repeat(100);
            const filename = calendarService_1.default.generateCalendarFilename(longTitle, testRSVP._id.toString());
            expect(filename.length).toBeLessThanOrEqual(100);
            expect(filename).toContain('.ics');
        });
    });
    describe('Google Calendar URL Generation', () => {
        it('should generate valid Google Calendar URL', () => __awaiter(void 0, void 0, void 0, function* () {
            const googleURL = yield calendarService_1.default.generateGoogleCalendarURL(testRSVP._id.toString());
            expect(googleURL).toContain('https://calendar.google.com/calendar/render');
            expect(googleURL).toContain('action=TEMPLATE');
            expect(googleURL).toContain('text=Test%20Guide%20Session');
            expect(googleURL).toContain('dates=');
            expect(googleURL).toContain('location=');
            expect(googleURL).toContain('details=');
        }));
        it('should include event details in Google URL', () => __awaiter(void 0, void 0, void 0, function* () {
            const googleURL = yield calendarService_1.default.generateGoogleCalendarURL(testRSVP._id.toString());
            expect(googleURL).toContain('sprop=website%3Asi3.space');
        }));
    });
    describe('Outlook Calendar URL Generation', () => {
        it('should generate valid Outlook Calendar URL', () => __awaiter(void 0, void 0, void 0, function* () {
            const outlookURL = yield calendarService_1.default.generateOutlookCalendarURL(testRSVP._id.toString());
            expect(outlookURL).toContain('https://outlook.live.com/calendar/0/deeplink/compose');
            expect(outlookURL).toContain('subject=Test%20Guide%20Session');
            expect(outlookURL).toContain('startdt=');
            expect(outlookURL).toContain('enddt=');
            expect(outlookURL).toContain('location=');
            expect(outlookURL).toContain('body=');
        }));
    });
    describe('Date Formatting', () => {
        it('should format dates correctly for ICS', () => {
            const testDate = new Date('2024-12-01T18:00:00.000Z');
            // Access private method through any casting for testing
            const formattedDate = calendarService_1.default.formatDateForICS(testDate);
            expect(formattedDate).toMatch(/^\d{8}T\d{6}Z$/);
            expect(formattedDate).toBe('20241201T180000Z');
        });
        it('should calculate end date when not provided', () => {
            const startDate = new Date('2024-12-01T18:00:00.000Z');
            // Access private method through any casting for testing
            const endDate = calendarService_1.default.calculateEndDate(startDate);
            expect(endDate.getTime()).toBe(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 hours later
        });
    });
    describe('Text Escaping', () => {
        it('should escape special characters for ICS format', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create RSVP with special characters
            const specialRSVP = yield rsvpModel_1.default.create({
                eventId: 'test-event-123',
                userId: testUser._id,
                status: rsvpModel_1.RSVPStatus.ATTENDING,
                guestCount: 1,
                specialRequests: 'Need; comma, and\\backslash\nand newline'
            });
            const icsContent = yield calendarService_1.default.generateICSForRSVP(specialRSVP._id.toString());
            expect(icsContent).toContain('Need\\; comma\\, and\\\\backslash\\nand newline');
        }));
    });
    describe('Error Handling', () => {
        it('should handle missing event data gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock Sanity to return null
            const { SanityEventService } = require('../config/sanity');
            SanityEventService.getEventById.mockResolvedValueOnce(null);
            yield expect(calendarService_1.default.generateICSForRSVP(testRSVP._id.toString()))
                .rejects.toThrow('Event not found');
        }));
        it('should handle database connection errors', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidId = 'invalid-id';
            yield expect(calendarService_1.default.generateICSForRSVP(invalidId))
                .rejects.toThrow();
        }));
    });
    describe('Line Folding', () => {
        it('should fold long lines correctly', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create RSVP with very long description
            const longDescription = 'A'.repeat(200);
            // Mock event with long description
            const { SanityEventService } = require('../config/sanity');
            SanityEventService.getEventById.mockResolvedValueOnce({
                _id: 'test-event-123',
                title: 'Test Event',
                description: longDescription,
                eventDate: '2024-12-01T18:00:00.000Z',
                location: { type: 'virtual', venue: 'Zoom' },
                organizer: { name: 'Test', email: 'test@example.com' }
            });
            const icsContent = yield calendarService_1.default.generateICSForRSVP(testRSVP._id.toString());
            // Check that long lines are folded (contain CRLF + space)
            const lines = icsContent.split('\r\n');
            const longLines = lines.filter(line => line.length > 75);
            // Should have folded lines starting with space
            const foldedLines = lines.filter(line => line.startsWith(' '));
            expect(foldedLines.length).toBeGreaterThan(0);
        }));
    });
});
