import CalendarService from '../services/calendarService';
import RSVPModel, { RSVPStatus } from '../models/rsvpModel';
import UserModel from '../models/usersModel';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
  let mongoServer: MongoMemoryServer;
  let testUser: any;
  let testRSVP: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = await UserModel.create({
      email: 'test@example.com',
      roles: ['member'],
      isVerified: true,
      newsletter: false,
      interests: [],
      personalValues: []
    });

    // Create test RSVP
    testRSVP = await RSVPModel.create({
      eventId: 'test-event-123',
      userId: testUser._id,
      status: RSVPStatus.ATTENDING,
      guestCount: 2,
      dietaryRestrictions: 'Vegetarian',
      specialRequests: 'Wheelchair accessible seating',
      contactInfo: {
        phone: '+1234567890',
        emergencyContact: 'Jane Doe - +0987654321'
      }
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('ICS Calendar Generation', () => {
    it('should generate valid ICS content for RSVP', async () => {
      const icsContent = await CalendarService.generateICSForRSVP(testRSVP._id.toString());

      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).toContain('BEGIN:VEVENT');
      expect(icsContent).toContain('END:VEVENT');
      expect(icsContent).toContain('SUMMARY:Test Guide Session');
      expect(icsContent).toContain('LOCATION:Zoom Meeting');
      expect(icsContent).toContain('ORGANIZER;CN=SI3 Team:mailto:events@si3.space');
      expect(icsContent).toContain('ATTENDEE;CN=test@example.com');
    });

    it('should include RSVP details in description', async () => {
      const icsContent = await CalendarService.generateICSForRSVP(testRSVP._id.toString());

      expect(icsContent).toContain('Status: attending');
      expect(icsContent).toContain('Guests: 2 people');
      expect(icsContent).toContain('Dietary Restrictions: Vegetarian');
      expect(icsContent).toContain('Special Requests: Wheelchair accessible seating');
      expect(icsContent).toContain('Contact: events@si3.space');
    });

    it('should include event reminders', async () => {
      const icsContent = await CalendarService.generateICSForRSVP(testRSVP._id.toString());

      expect(icsContent).toContain('BEGIN:VALARM');
      expect(icsContent).toContain('TRIGGER:-PT1H'); // 1 hour before
      expect(icsContent).toContain('TRIGGER:-PT24H'); // 24 hours before
      expect(icsContent).toContain('ACTION:DISPLAY');
    });

    it('should handle virtual event links', async () => {
      const icsContent = await CalendarService.generateICSForRSVP(testRSVP._id.toString());

      expect(icsContent).toContain('Zoom Meeting (Virtual: https://zoom.us/j/123456789)');
      expect(icsContent).toContain('Access Instructions');
      expect(icsContent).toContain('Meeting ID: 123 456 789');
    });

    it('should throw error for non-existent RSVP', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      await expect(CalendarService.generateICSForRSVP(fakeId))
        .rejects.toThrow('RSVP not found');
    });
  });

  describe('Calendar Filename Generation', () => {
    it('should generate valid filename', () => {
      const filename = CalendarService.generateCalendarFilename(
        'Test Guide Session!@#$%',
        testRSVP._id.toString()
      );

      expect(filename).toMatch(/^test_guide_session_[a-f0-9]{24}\.ics$/);
      expect(filename.length).toBeLessThanOrEqual(100); // Reasonable length
    });

    it('should handle long event titles', () => {
      const longTitle = 'A'.repeat(100);
      const filename = CalendarService.generateCalendarFilename(
        longTitle,
        testRSVP._id.toString()
      );

      expect(filename.length).toBeLessThanOrEqual(100);
      expect(filename).toContain('.ics');
    });
  });

  describe('Google Calendar URL Generation', () => {
    it('should generate valid Google Calendar URL', async () => {
      const googleURL = await CalendarService.generateGoogleCalendarURL(testRSVP._id.toString());

      expect(googleURL).toContain('https://calendar.google.com/calendar/render');
      expect(googleURL).toContain('action=TEMPLATE');
      expect(googleURL).toContain('text=Test%20Guide%20Session');
      expect(googleURL).toContain('dates=');
      expect(googleURL).toContain('location=');
      expect(googleURL).toContain('details=');
    });

    it('should include event details in Google URL', async () => {
      const googleURL = await CalendarService.generateGoogleCalendarURL(testRSVP._id.toString());

      expect(googleURL).toContain('sprop=website%3Asi3.space');
    });
  });

  describe('Outlook Calendar URL Generation', () => {
    it('should generate valid Outlook Calendar URL', async () => {
      const outlookURL = await CalendarService.generateOutlookCalendarURL(testRSVP._id.toString());

      expect(outlookURL).toContain('https://outlook.live.com/calendar/0/deeplink/compose');
      expect(outlookURL).toContain('subject=Test%20Guide%20Session');
      expect(outlookURL).toContain('startdt=');
      expect(outlookURL).toContain('enddt=');
      expect(outlookURL).toContain('location=');
      expect(outlookURL).toContain('body=');
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly for ICS', () => {
      const testDate = new Date('2024-12-01T18:00:00.000Z');
      
      // Access private method through any casting for testing
      const formattedDate = (CalendarService as any).formatDateForICS(testDate);
      
      expect(formattedDate).toMatch(/^\d{8}T\d{6}Z$/);
      expect(formattedDate).toBe('20241201T180000Z');
    });

    it('should calculate end date when not provided', () => {
      const startDate = new Date('2024-12-01T18:00:00.000Z');
      
      // Access private method through any casting for testing
      const endDate = (CalendarService as any).calculateEndDate(startDate);
      
      expect(endDate.getTime()).toBe(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 hours later
    });
  });

  describe('Text Escaping', () => {
    it('should escape special characters for ICS format', async () => {
      // Create RSVP with special characters
      const specialRSVP = await RSVPModel.create({
        eventId: 'test-event-123',
        userId: testUser._id,
        status: RSVPStatus.ATTENDING,
        guestCount: 1,
        specialRequests: 'Need; comma, and\\backslash\nand newline'
      });

      const icsContent = await CalendarService.generateICSForRSVP(specialRSVP._id.toString());

      expect(icsContent).toContain('Need\\; comma\\, and\\\\backslash\\nand newline');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing event data gracefully', async () => {
      // Mock Sanity to return null
      const { SanityEventService } = require('../config/sanity');
      SanityEventService.getEventById.mockResolvedValueOnce(null);

      await expect(CalendarService.generateICSForRSVP(testRSVP._id.toString()))
        .rejects.toThrow('Event not found');
    });

    it('should handle database connection errors', async () => {
      const invalidId = 'invalid-id';
      
      await expect(CalendarService.generateICSForRSVP(invalidId))
        .rejects.toThrow();
    });
  });

  describe('Line Folding', () => {
    it('should fold long lines correctly', async () => {
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

      const icsContent = await CalendarService.generateICSForRSVP(testRSVP._id.toString());

      // Check that long lines are folded (contain CRLF + space)
      const lines = icsContent.split('\r\n');
      const longLines = lines.filter(line => line.length > 75);
      
      // Should have folded lines starting with space
      const foldedLines = lines.filter(line => line.startsWith(' '));
      expect(foldedLines.length).toBeGreaterThan(0);
    });
  });
});
