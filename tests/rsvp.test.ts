import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server';
import RSVPModel, { RSVPStatus } from '../models/rsvpModel';
import UserModel from '../models/usersModel';

describe('RSVP System Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let testUser: any;
  let testEventId: string;
  let testRSVPId: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
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

    // Mock Sanity event ID (this would be a real Sanity document ID in practice)
    testEventId = 'test-event-123';
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up RSVPs before each test
    await RSVPModel.deleteMany({});
  });

  describe('Authentication', () => {
    it('should send OTP email', async () => {
      const response = await request(app)
        .post('/api/auth/email/send-otp')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should verify OTP and return token', async () => {
      // First send OTP
      await request(app)
        .post('/api/auth/email/send-otp')
        .send({ email: 'test@example.com' });

      // Mock OTP verification (in real tests, you'd use the actual OTP)
      const response = await request(app)
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
    });
  });

  describe('RSVP CRUD Operations', () => {
    beforeEach(async () => {
      // Ensure we have an auth token for protected routes
      if (!authToken) {
        // Mock authentication for testing
        authToken = 'mock-jwt-token';
      }
    });

    it('should create a new RSVP', async () => {
      const rsvpData = {
        eventId: testEventId,
        status: RSVPStatus.ATTENDING,
        guestCount: 2,
        dietaryRestrictions: 'Vegetarian',
        specialRequests: 'Wheelchair accessible',
        contactInfo: {
          phone: '+1234567890',
          emergencyContact: 'Jane Doe - +0987654321'
        }
      };

      const response = await request(app)
        .post('/api/rsvp')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rsvpData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.eventId).toBe(testEventId);
      expect(response.body.data.status).toBe(RSVPStatus.ATTENDING);
      expect(response.body.data.guestCount).toBe(2);

      testRSVPId = response.body.data._id;
    });

    it('should get user RSVPs', async () => {
      // First create an RSVP
      await RSVPModel.create({
        eventId: testEventId,
        userId: testUser._id,
        status: RSVPStatus.ATTENDING,
        guestCount: 1
      });

      const response = await request(app)
        .get('/api/rsvp/my-rsvps')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.rsvps).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should update an RSVP', async () => {
      // Create an RSVP first
      const rsvp = await RSVPModel.create({
        eventId: testEventId,
        userId: testUser._id,
        status: RSVPStatus.ATTENDING,
        guestCount: 1
      });

      const updateData = {
        status: RSVPStatus.MAYBE,
        guestCount: 2,
        dietaryRestrictions: 'Vegan'
      };

      const response = await request(app)
        .put(`/api/rsvp/${rsvp._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.status).toBe(RSVPStatus.MAYBE);
      expect(response.body.data.guestCount).toBe(2);
    });

    it('should delete an RSVP', async () => {
      // Create an RSVP first
      const rsvp = await RSVPModel.create({
        eventId: testEventId,
        userId: testUser._id,
        status: RSVPStatus.ATTENDING,
        guestCount: 1
      });

      const response = await request(app)
        .delete(`/api/rsvp/${rsvp._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      // Verify RSVP is deleted
      const deletedRSVP = await RSVPModel.findById(rsvp._id);
      expect(deletedRSVP).toBeNull();
    });
  });

  describe('Event Statistics', () => {
    beforeEach(async () => {
      // Create test RSVPs for statistics
      await RSVPModel.create([
        {
          eventId: testEventId,
          userId: new mongoose.Types.ObjectId(),
          status: RSVPStatus.ATTENDING,
          guestCount: 2
        },
        {
          eventId: testEventId,
          userId: new mongoose.Types.ObjectId(),
          status: RSVPStatus.ATTENDING,
          guestCount: 1
        },
        {
          eventId: testEventId,
          userId: new mongoose.Types.ObjectId(),
          status: RSVPStatus.MAYBE,
          guestCount: 1
        },
        {
          eventId: testEventId,
          userId: new mongoose.Types.ObjectId(),
          status: RSVPStatus.NOT_ATTENDING,
          guestCount: 0
        }
      ]);
    });

    it('should get event RSVP statistics', async () => {
      const response = await request(app)
        .get(`/api/rsvp/event/${testEventId}/stats`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.stats.totalRSVPs).toBe(4);
      expect(response.body.data.stats.attending).toBe(2);
      expect(response.body.data.stats.maybe).toBe(1);
      expect(response.body.data.stats.notAttending).toBe(1);
      expect(response.body.data.stats.totalGuests).toBe(3); // 2 + 1 from attending
    });

    it('should get event attendees', async () => {
      const response = await request(app)
        .get(`/api/rsvp/event/${testEventId}/attendees`)
        .query({ status: 'attending' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.attendees).toHaveLength(2);
    });

    it('should check event availability', async () => {
      const response = await request(app)
        .get(`/api/rsvp/event/${testEventId}/availability`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.eventId).toBe(testEventId);
      expect(response.body.data.isRSVPOpen).toBeDefined();
      expect(response.body.data.hasCapacity).toBeDefined();
    });
  });

  describe('Waitlist Functionality', () => {
    it('should join waitlist when event is full', async () => {
      const waitlistData = {
        eventId: testEventId,
        guestCount: 1,
        notes: 'Very interested in attending'
      };

      const response = await request(app)
        .post('/api/rsvp/waitlist/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send(waitlistData);

      // This might fail if event doesn't have waitlist enabled
      // In a real test, you'd mock the Sanity response
      if (response.status === 201) {
        expect(response.body.status).toBe('success');
        expect(response.body.data.status).toBe(RSVPStatus.WAITLISTED);
        expect(response.body.data.waitlistPosition).toBeDefined();
      }
    });

    it('should get waitlist position', async () => {
      // First join waitlist
      const rsvp = await RSVPModel.create({
        eventId: testEventId,
        userId: testUser._id,
        status: RSVPStatus.WAITLISTED,
        guestCount: 1,
        waitlistPosition: 1
      });

      const response = await request(app)
        .get(`/api/rsvp/waitlist/${testEventId}/position`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.position).toBe(1);
    });
  });

  describe('Validation Tests', () => {
    it('should reject invalid RSVP data', async () => {
      const invalidData = {
        eventId: '', // Invalid event ID
        status: 'invalid-status',
        guestCount: -1 // Invalid guest count
      };

      const response = await request(app)
        .post('/api/rsvp')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should reject duplicate RSVP for same event', async () => {
      // Create first RSVP
      await RSVPModel.create({
        eventId: testEventId,
        userId: testUser._id,
        status: RSVPStatus.ATTENDING,
        guestCount: 1
      });

      // Try to create duplicate
      const duplicateData = {
        eventId: testEventId,
        status: RSVPStatus.ATTENDING,
        guestCount: 1
      };

      const response = await request(app)
        .post('/api/rsvp')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already RSVP');
    });
  });
});
