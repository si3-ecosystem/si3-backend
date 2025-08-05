import RSVPEmailService from '../services/rsvpEmailService';
import RSVPModel, { RSVPStatus } from '../models/rsvpModel';
import UserModel from '../models/usersModel';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
  let mongoServer: MongoMemoryServer;
  let testUser: any;
  let testRSVP: any;
  let mockEmailService: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Get mock email service
    mockEmailService = require('../config/protonMail').emailService;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Clean up data
    await UserModel.deleteMany({});
    await RSVPModel.deleteMany({});

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
      },
      confirmationEmailSent: false,
      reminderEmailsSent: []
    });
  });

  describe('Confirmation Email', () => {
    it('should send confirmation email successfully', async () => {
      const result = await RSVPEmailService.sendConfirmationEmail(
        testRSVP._id.toString(),
        'Welcome to our event!'
      );

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
      const updatedRSVP = await RSVPModel.findById(testRSVP._id);
      expect(updatedRSVP?.confirmationEmailSent).toBe(true);
    });

    it('should include RSVP details in confirmation email', async () => {
      await RSVPEmailService.sendConfirmationEmail(testRSVP._id.toString());

      const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
      expect(emailCall.htmlContent).toContain('Status: attending');
      expect(emailCall.htmlContent).toContain('2 people');
      expect(emailCall.htmlContent).toContain('Vegetarian');
      expect(emailCall.htmlContent).toContain('Wheelchair accessible seating');
      expect(emailCall.htmlContent).toContain('+1234567890');
    });

    it('should handle custom message in confirmation email', async () => {
      const customMessage = 'Looking forward to seeing you!';
      await RSVPEmailService.sendConfirmationEmail(testRSVP._id.toString(), customMessage);

      const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
      expect(emailCall.htmlContent).toContain(customMessage);
    });

    it('should return false when RSVP not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const result = await RSVPEmailService.sendConfirmationEmail(fakeId);

      expect(result).toBe(false);
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should return false when email service fails', async () => {
      mockEmailService.sendEmail.mockResolvedValueOnce({ success: false });

      const result = await RSVPEmailService.sendConfirmationEmail(testRSVP._id.toString());

      expect(result).toBe(false);
    });
  });

  describe('Reminder Email', () => {
    it('should send reminder email for attending users', async () => {
      const result = await RSVPEmailService.sendReminderEmail(
        testRSVP._id.toString(),
        '24_hours',
        'Don\'t forget to bring your ID!'
      );

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
      const updatedRSVP = await RSVPModel.findById(testRSVP._id);
      expect(updatedRSVP?.reminderEmailsSent).toContain('24_hours');
    });

    it('should not send reminder to non-attending users', async () => {
      // Update RSVP to not attending
      await RSVPModel.findByIdAndUpdate(testRSVP._id, { status: RSVPStatus.NOT_ATTENDING });

      const result = await RSVPEmailService.sendReminderEmail(
        testRSVP._id.toString(),
        '24_hours'
      );

      expect(result).toBe(false);
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should not send duplicate reminders', async () => {
      // Mark reminder as already sent
      await RSVPModel.findByIdAndUpdate(testRSVP._id, { 
        reminderEmailsSent: ['24_hours'] 
      });

      const result = await RSVPEmailService.sendReminderEmail(
        testRSVP._id.toString(),
        '24_hours'
      );

      expect(result).toBe(false);
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should include different reminder messages', async () => {
      const reminderTypes = ['1_week', '24_hours', '1_day', '2_hours'];
      
      for (const reminderType of reminderTypes) {
        // Reset RSVP
        await RSVPModel.findByIdAndUpdate(testRSVP._id, { 
          reminderEmailsSent: [] 
        });

        await RSVPEmailService.sendReminderEmail(
          testRSVP._id.toString(),
          reminderType
        );

        const emailCall = mockEmailService.sendEmail.mock.calls[mockEmailService.sendEmail.mock.calls.length - 1][0];
        expect(emailCall.subject).toContain(reminderType.replace('_', ' '));
      }
    });
  });

  describe('Waitlist Notification', () => {
    beforeEach(async () => {
      // Update RSVP to waitlisted
      await RSVPModel.findByIdAndUpdate(testRSVP._id, { 
        status: RSVPStatus.WAITLISTED,
        waitlistPosition: 1
      });
    });

    it('should send waitlist notification email', async () => {
      const result = await RSVPEmailService.sendWaitlistNotification(testRSVP._id.toString());

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
    });

    it('should include urgency message in waitlist notification', async () => {
      await RSVPEmailService.sendWaitlistNotification(testRSVP._id.toString());

      const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
      expect(emailCall.htmlContent).toContain('Time Sensitive');
      expect(emailCall.htmlContent).toContain('24 hours');
    });
  });

  describe('Bulk Reminder Emails', () => {
    beforeEach(async () => {
      // Create multiple RSVPs for bulk testing
      const users = await UserModel.create([
        { email: 'user1@example.com', roles: ['member'], isVerified: true, newsletter: false, interests: [], personalValues: [] },
        { email: 'user2@example.com', roles: ['member'], isVerified: true, newsletter: false, interests: [], personalValues: [] },
        { email: 'user3@example.com', roles: ['member'], isVerified: true, newsletter: false, interests: [], personalValues: [] }
      ]);

      await RSVPModel.create([
        {
          eventId: 'test-event-123',
          userId: users[0]._id,
          status: RSVPStatus.ATTENDING,
          guestCount: 1,
          reminderEmailsSent: []
        },
        {
          eventId: 'test-event-123',
          userId: users[1]._id,
          status: RSVPStatus.ATTENDING,
          guestCount: 1,
          reminderEmailsSent: []
        },
        {
          eventId: 'test-event-123',
          userId: users[2]._id,
          status: RSVPStatus.NOT_ATTENDING,
          guestCount: 0,
          reminderEmailsSent: []
        }
      ]);
    });

    it('should send bulk reminders to attending users only', async () => {
      const result = await RSVPEmailService.sendBulkReminders({
        eventId: 'test-event-123',
        reminderType: '24_hours',
        customMessage: 'Event starts soon!'
      });

      expect(result.sent).toBe(3); // Including original testRSVP
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(3);
    });

    it('should handle email failures gracefully', async () => {
      // Mock one email to fail
      mockEmailService.sendEmail
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: true });

      const result = await RSVPEmailService.sendBulkReminders({
        eventId: 'test-event-123',
        reminderType: '24_hours'
      });

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Waitlist Processing', () => {
    beforeEach(async () => {
      // Create waitlisted users
      const users = await UserModel.create([
        { email: 'waitlist1@example.com', roles: ['member'], isVerified: true, newsletter: false, interests: [], personalValues: [] },
        { email: 'waitlist2@example.com', roles: ['member'], isVerified: true, newsletter: false, interests: [], personalValues: [] }
      ]);

      await RSVPModel.create([
        {
          eventId: 'test-event-123',
          userId: users[0]._id,
          status: RSVPStatus.WAITLISTED,
          guestCount: 1,
          waitlistPosition: 1
        },
        {
          eventId: 'test-event-123',
          userId: users[1]._id,
          status: RSVPStatus.WAITLISTED,
          guestCount: 1,
          waitlistPosition: 2
        }
      ]);
    });

    it('should process waitlist and promote users', async () => {
      const result = await RSVPEmailService.processWaitlistNotifications(
        'test-event-123',
        2
      );

      expect(result.notified).toBe(2);
      expect(result.promoted).toContain('waitlist1@example.com');
      expect(result.promoted).toContain('waitlist2@example.com');

      // Check that RSVPs are updated to attending
      const promotedRSVPs = await RSVPModel.find({
        eventId: 'test-event-123',
        status: RSVPStatus.ATTENDING
      });
      expect(promotedRSVPs.length).toBeGreaterThanOrEqual(2);
    });

    it('should respect waitlist order', async () => {
      const result = await RSVPEmailService.processWaitlistNotifications(
        'test-event-123',
        1
      );

      expect(result.notified).toBe(1);
      expect(result.promoted).toContain('waitlist1@example.com');
      expect(result.promoted).not.toContain('waitlist2@example.com');
    });
  });

  describe('Update Notification', () => {
    it('should send update notification with changes', async () => {
      const changes = ['Status changed to Maybe', 'Guest count updated to 3'];
      
      const result = await RSVPEmailService.sendUpdateNotification(
        testRSVP._id.toString(),
        changes,
        'Please confirm your attendance'
      );

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
    });
  });

  describe('Error Handling', () => {
    it('should handle Sanity service errors', async () => {
      const { SanityEventService } = require('../config/sanity');
      SanityEventService.getEventById.mockRejectedValueOnce(new Error('Sanity error'));

      const result = await RSVPEmailService.sendConfirmationEmail(testRSVP._id.toString());

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      // Close database connection to simulate error
      await mongoose.disconnect();

      const result = await RSVPEmailService.sendConfirmationEmail(testRSVP._id.toString());

      expect(result).toBe(false);

      // Reconnect for cleanup
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });
});
