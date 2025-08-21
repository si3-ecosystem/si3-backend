import { Request, Response, NextFunction } from "express";

import RSVPModel, { RSVPStatus, IRSVP } from "../models/rsvpModel";
import { IUser, UserRole } from "../models/usersModel";
import { SanityEventService } from "../config/sanity";
import RSVPEmailService from "../services/rsvpEmailService";
import CalendarService from "../services/calendarService";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import redisHelper from "../helpers/redisHelper";

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Type for RSVP with populated user
interface PopulatedRSVP extends IRSVP {
  user: IUser;
}

/**
 * @desc    Create new RSVP
 * @route   POST /api/rsvp
 * @access  Private
 */
export const createRSVP = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { eventId, status, guestCount, dietaryRestrictions, specialRequests, contactInfo } = req.body;
  const userId = req.user?._id;

  console.log(`\n🎫 [RSVP DEBUG] Starting RSVP creation process`);
  console.log(`   User ID: ${userId}`);
  console.log(`   User Email: ${req.user?.email}`);
  console.log(`   Event ID: ${eventId}`);
  console.log(`   Status: ${status}`);
  console.log(`   Guest Count: ${guestCount}`);

  if (!userId) {
    console.log(`❌ [RSVP DEBUG] No user ID found`);
    return next(new AppError("User authentication required", 401));
  }

  // Validate user has a real email address (not wallet temp email)
  const userEmail = req.user?.email;
  if (!userEmail || userEmail.includes('@wallet.temp')) {
    console.log(`❌ [RSVP DEBUG] Invalid email: ${userEmail}`);
    return next(new AppError("No valid email found for this user. Please update your email address to receive RSVP confirmations and event notifications.", 400));
  }

  console.log(`✅ [RSVP DEBUG] User validation passed`);

  // Validate event and RSVP settings from Sanity
  console.log(`🔍 [RSVP DEBUG] Validating event from Sanity...`);
  const event = await SanityEventService.validateEventForRSVP(eventId);
  console.log(`✅ [RSVP DEBUG] Event validation passed`);

  // Check if user already has an RSVP for this event
  console.log(`🔍 [RSVP DEBUG] Checking for existing RSVP...`);
  console.log(`   Query: { eventId: "${eventId}", userId: ObjectId("${userId}") }`);

  const existingRSVP = await RSVPModel.findOne({ eventId, userId });

  console.log(`🔍 [RSVP DEBUG] Existing RSVP query result:`, {
    found: !!existingRSVP,
    rsvpId: existingRSVP?._id,
    rsvpStatus: existingRSVP?.status,
    rsvpEventId: existingRSVP?.eventId,
    rsvpUserId: existingRSVP?.userId,
    rsvpCreatedAt: existingRSVP?.createdAt
  });

  if (existingRSVP) {
    console.log(`❌ [RSVP DEBUG] Found existing RSVP - blocking creation`);
    console.log(`   Existing RSVP details:`, {
      id: existingRSVP._id,
      eventId: existingRSVP.eventId,
      userId: existingRSVP.userId,
      status: existingRSVP.status,
      createdAt: existingRSVP.createdAt,
      guestCount: existingRSVP.guestCount
    });
    return next(new AppError("User has already RSVP'd for this event", 400));
  }

  console.log(`✅ [RSVP DEBUG] No existing RSVP found - proceeding with creation`);

  // Validate guest count with fallback for null values
  const maxGuestsPerRSVP = event.rsvpSettings?.maxGuestsPerRSVP || 5;

  if (guestCount > maxGuestsPerRSVP) {
    return next(new AppError(`Maximum ${maxGuestsPerRSVP} guests allowed per RSVP`, 400));
  }

  // Check event capacity if attending
  if (status === RSVPStatus.ATTENDING && event.rsvpSettings?.maxCapacity) {
    const stats = await RSVPModel.getEventStats(eventId);
    const totalAttending = stats.totalGuests + guestCount;

    if (totalAttending > event.rsvpSettings.maxCapacity) {
      if (event.rsvpSettings.waitlistEnabled) {
        // Add to waitlist
        const waitlistPosition = await RSVPModel.getNextWaitlistPosition(eventId);

        const rsvp = await RSVPModel.create({
          eventId,
          userId,
          status: RSVPStatus.WAITLISTED,
          guestCount,
          dietaryRestrictions,
          specialRequests,
          contactInfo,
          waitlistPosition,
          approvalStatus: 'approved'
        });

        // Clear cache
        await redisHelper.cacheDelete(`event_stats_${eventId}`);

        return res.status(201).json({
          status: "success",
          message: "Added to waitlist successfully",
          data: rsvp
        });
      } else {
        return next(new AppError("Event is at full capacity", 400));
      }
    }
  }

  // Create RSVP
  const rsvpData: Partial<IRSVP> = {
    eventId,
    userId,
    status,
    guestCount,
    dietaryRestrictions,
    specialRequests,
    contactInfo,
    approvalStatus: event.rsvpSettings?.requiresApproval ? 'pending' : 'approved'
  };

  console.log(`🚀 [RSVP DEBUG] About to create RSVP with data:`, {
    eventId: rsvpData.eventId,
    userId: rsvpData.userId,
    status: rsvpData.status,
    guestCount: rsvpData.guestCount,
    approvalStatus: rsvpData.approvalStatus
  });

  // Double-check for existing RSVP right before creation
  console.log(`🔍 [RSVP DEBUG] Final check for existing RSVP before creation...`);
  const finalCheck = await RSVPModel.findOne({ eventId, userId });
  console.log(`🔍 [RSVP DEBUG] Final check result:`, {
    found: !!finalCheck,
    rsvpId: finalCheck?._id,
    rsvpStatus: finalCheck?.status
  });

  if (finalCheck) {
    console.log(`❌ [RSVP DEBUG] RACE CONDITION DETECTED - RSVP was created between checks!`);
    return next(new AppError("User has already RSVP'd for this event", 400));
  }

  console.log(`🚀 [RSVP DEBUG] Creating RSVP in database...`);
  const rsvp = await RSVPModel.create(rsvpData);
  console.log(`✅ [RSVP DEBUG] RSVP created successfully:`, {
    id: rsvp._id,
    eventId: rsvp.eventId,
    userId: rsvp.userId,
    status: rsvp.status
  });
  await rsvp.populate('user', 'email roles');
  const populatedRSVP = rsvp as unknown as PopulatedRSVP;

  // Clear cache
  await redisHelper.cacheDelete(`event_stats_${eventId}`);
  await redisHelper.cacheDelete(`user_rsvps_${userId}`);

  // Send confirmation email with calendar attachment
  try {
    const RSVPEmailService = await import("../services/rsvpEmailService");
    const emailSent = await RSVPEmailService.default.sendConfirmationEmail(
      populatedRSVP._id.toString(),
      "Thank you for your RSVP! We're excited to see you at the event."
    );

    if (emailSent) {
      // Update RSVP to mark confirmation email as sent
      await RSVPModel.findByIdAndUpdate(populatedRSVP._id, {
        confirmationEmailSent: true
      });
    }
  } catch (emailError) {
    // Don't fail the RSVP creation if email fails
    console.error('Error sending confirmation email:', emailError);
  }

  res.status(201).json({
    status: "success",
    message: "RSVP created successfully",
    data: populatedRSVP
  });
});

/**
 * @desc    Get user's RSVPs
 * @route   GET /api/rsvp/my-rsvps
 * @access  Private
 */
export const getUserRSVPs = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { page = 1, limit = 10, status } = req.query;

  console.log(`\n📋 [GET RSVPS DEBUG] Starting getUserRSVPs`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Query params: page=${page}, limit=${limit}, status=${status}`);

  if (!userId) {
    console.log(`❌ [GET RSVPS DEBUG] No user ID found`);
    return next(new AppError("User authentication required", 401));
  }

  // Build query
  const query: any = { userId };
  if (status) {
    query.status = status;
  }

  console.log(`🔍 [GET RSVPS DEBUG] MongoDB query:`, query);

  // Check cache first
  const cacheKey = `user_rsvps_${userId}_${page}_${limit}_${status || 'all'}`;
  console.log(`🔍 [GET RSVPS DEBUG] Cache key: ${cacheKey}`);

  const cachedRSVPs = await redisHelper.cacheGet(cacheKey);

  if (cachedRSVPs) {
    console.log(`✅ [GET RSVPS DEBUG] Found cached result with ${cachedRSVPs.rsvps?.length || 0} RSVPs`);
    return res.status(200).json({
      status: "success",
      data: cachedRSVPs
    });
  }

  console.log(`🔍 [GET RSVPS DEBUG] No cache found, querying database...`);

  const skip = (Number(page) - 1) * Number(limit);

  console.log(`🔍 [GET RSVPS DEBUG] Executing database queries...`);
  console.log(`   Skip: ${skip}, Limit: ${Number(limit)}`);

  const [rsvps, total] = await Promise.all([
    RSVPModel.find(query)
      .populate('user', 'email roles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    RSVPModel.countDocuments(query)
  ]);

  console.log(`📊 [GET RSVPS DEBUG] Database results:`);
  console.log(`   Total count: ${total}`);
  console.log(`   RSVPs returned: ${rsvps.length}`);

  if (rsvps.length > 0) {
    console.log(`   First RSVP:`, {
      id: rsvps[0]._id,
      eventId: rsvps[0].eventId,
      userId: rsvps[0].userId,
      status: rsvps[0].status,
      createdAt: rsvps[0].createdAt
    });
  }

  const result = {
    rsvps,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalItems: total,
      hasNext: skip + Number(limit) < total,
      hasPrev: Number(page) > 1
    }
  };

  console.log(`💾 [GET RSVPS DEBUG] Caching result for 5 minutes`);
  // Cache for 5 minutes
  await redisHelper.cacheSet(cacheKey, result, 300);

  console.log(`✅ [GET RSVPS DEBUG] Sending response with ${result.rsvps.length} RSVPs`);
  res.status(200).json({
    status: "success",
    data: result
  });
});

/**
 * @desc    Get RSVP by ID
 * @route   GET /api/rsvp/:id
 * @access  Private
 */
export const getRSVPById = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  const rsvp = await RSVPModel.findById(id).populate('user', 'email roles');

  if (!rsvp) {
    return next(new AppError("RSVP not found", 404));
  }

  // Check if user owns this RSVP or is admin
  const isOwner = rsvp.userId.toString() === userId.toString();
  const isAdmin = req.user?.roles.includes(UserRole.ADMIN);

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to view this RSVP", 403));
  }

  res.status(200).json({
    status: "success",
    data: rsvp
  });
});

/**
 * @desc    Update RSVP
 * @route   PUT /api/rsvp/:id
 * @access  Private
 */
export const updateRSVP = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status, guestCount, dietaryRestrictions, specialRequests, contactInfo } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  const rsvp = await RSVPModel.findById(id);

  if (!rsvp) {
    return next(new AppError("RSVP not found", 404));
  }

  // Check ownership
  if (rsvp.userId.toString() !== userId.toString()) {
    return next(new AppError("Not authorized to update this RSVP", 403));
  }

  // Validate event is still accepting RSVPs
  const event = await SanityEventService.validateEventForRSVP(rsvp.eventId);

  // If changing to attending, check capacity
  if (status === RSVPStatus.ATTENDING && rsvp.status !== RSVPStatus.ATTENDING && event.rsvpSettings.maxCapacity) {
    const stats = await RSVPModel.getEventStats(rsvp.eventId);
    const additionalGuests = guestCount; // New guests being added
    
    if (stats.totalGuests + additionalGuests > event.rsvpSettings.maxCapacity) {
      return next(new AppError("Event is at full capacity", 400));
    }
  }

  // Update RSVP
  const updatedRSVP = await RSVPModel.findByIdAndUpdate(
    id,
    {
      status,
      guestCount,
      dietaryRestrictions,
      specialRequests,
      contactInfo,
      ...(status !== rsvp.status && { approvalStatus: event.rsvpSettings.requiresApproval ? 'pending' : 'approved' })
    },
    { new: true, runValidators: true }
  ).populate('user', 'email roles');

  // Clear cache
  await redisHelper.cacheDelete(`event_stats_${rsvp.eventId}`);
  await redisHelper.cacheDelete(`user_rsvps_${userId}`);

  res.status(200).json({
    status: "success",
    message: "RSVP updated successfully",
    data: updatedRSVP
  });
});

/**
 * @desc    Delete RSVP
 * @route   DELETE /api/rsvp/:id
 * @access  Private
 */
export const deleteRSVP = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  const rsvp = await RSVPModel.findById(id);

  if (!rsvp) {
    return next(new AppError("RSVP not found", 404));
  }

  // Check ownership or admin
  const isOwner = rsvp.userId.toString() === userId.toString();
  const isAdmin = req.user?.roles.includes(UserRole.ADMIN);

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to delete this RSVP", 403));
  }

  await RSVPModel.findByIdAndDelete(id);

  // Clear cache
  await redisHelper.cacheDelete(`event_stats_${rsvp.eventId}`);
  await redisHelper.cacheDelete(`user_rsvps_${rsvp.userId}`);

  res.status(200).json({
    status: "success",
    message: "RSVP deleted successfully"
  });
});

/**
 * @desc    Get event RSVP statistics
 * @route   GET /api/rsvp/event/:eventId/stats
 * @access  Public
 */
export const getEventRSVPStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { eventId } = req.params;

  // Check cache first
  const cacheKey = `event_stats_${eventId}`;
  const cachedStats = await redisHelper.cacheGet(cacheKey);
  
  if (cachedStats) {
    return res.status(200).json({
      status: "success",
      data: cachedStats
    });
  }

  // Validate event exists
  const event = await SanityEventService.getEventById(eventId);
  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  // Get RSVP statistics
  const stats = await RSVPModel.getEventStats(eventId);
  
  // Calculate additional metrics
  const maxCapacity = event.rsvpSettings?.maxCapacity;
  const availableSpots = maxCapacity ? Math.max(0, maxCapacity - stats.totalGuests) : null;
  const isAtCapacity = maxCapacity ? stats.totalGuests >= maxCapacity : false;

  const result = {
    eventId,
    eventTitle: event.title,
    eventDate: event.eventDate,
    maxCapacity,
    waitlistEnabled: event.rsvpSettings?.waitlistEnabled || false,
    rsvpDeadline: event.rsvpSettings?.rsvpDeadline,
    stats: {
      ...stats,
      availableSpots,
      isAtCapacity
    }
  };

  // Cache for 2 minutes
  await redisHelper.cacheSet(cacheKey, result, 120);

  res.status(200).json({
    status: "success",
    data: result
  });
});

/**
 * @desc    Get event attendees
 * @route   GET /api/rsvp/event/:eventId/attendees
 * @access  Public
 */
export const getEventAttendees = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { eventId } = req.params;
  const { page = 1, limit = 50, status = 'attending' } = req.query;

  // Validate event exists
  const event = await SanityEventService.getEventById(eventId);
  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  const skip = (Number(page) - 1) * Number(limit);

  const query: any = { eventId };
  if (status) {
    query.status = status;
  }

  const [attendees, total] = await Promise.all([
    RSVPModel.find(query)
      .populate('user', 'email roles')
      .select('-adminNotes -approvedBy') // Hide sensitive fields
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    RSVPModel.countDocuments(query)
  ]);

  const result = {
    eventId,
    eventTitle: event.title,
    attendees,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalItems: total,
      hasNext: skip + Number(limit) < total,
      hasPrev: Number(page) > 1
    }
  };

  res.status(200).json({
    status: "success",
    data: result
  });
});

/**
 * @desc    Check event availability
 * @route   GET /api/rsvp/event/:eventId/availability
 * @access  Public
 */
export const checkEventAvailability = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { eventId } = req.params;

  // Validate event exists
  const event = await SanityEventService.getEventById(eventId);
  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  const stats = await RSVPModel.getEventStats(eventId);
  const maxCapacity = event.rsvpSettings?.maxCapacity;

  const availability = {
    eventId,
    isRSVPOpen: event.rsvpSettings?.enabled || false,
    hasCapacity: maxCapacity ? stats.totalGuests < maxCapacity : true,
    availableSpots: maxCapacity ? Math.max(0, maxCapacity - stats.totalGuests) : null,
    waitlistEnabled: event.rsvpSettings?.waitlistEnabled || false,
    rsvpDeadline: event.rsvpSettings?.rsvpDeadline,
    isDeadlinePassed: event.rsvpSettings?.rsvpDeadline ?
      new Date(event.rsvpSettings.rsvpDeadline) < new Date() : false
  };

  res.status(200).json({
    status: "success",
    data: availability
  });
});

/**
 * @desc    Join event waitlist
 * @route   POST /api/rsvp/waitlist/join
 * @access  Private
 */
export const joinWaitlist = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { eventId, guestCount, notes } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  // Validate event
  const event = await SanityEventService.validateEventForRSVP(eventId);

  if (!event.rsvpSettings.waitlistEnabled) {
    return next(new AppError("Waitlist is not enabled for this event", 400));
  }

  // Check if user already has an RSVP
  console.log(`🔍 [WAITLIST DEBUG] Checking for existing RSVP...`);
  console.log(`   Query: { eventId: "${eventId}", userId: ObjectId("${userId}") }`);

  const existingRSVP = await RSVPModel.findOne({ eventId, userId });

  console.log(`🔍 [WAITLIST DEBUG] Existing RSVP query result:`, {
    found: !!existingRSVP,
    rsvpId: existingRSVP?._id,
    rsvpStatus: existingRSVP?.status,
    rsvpEventId: existingRSVP?.eventId,
    rsvpUserId: existingRSVP?.userId,
    rsvpCreatedAt: existingRSVP?.createdAt
  });

  if (existingRSVP) {
    console.log(`❌ [WAITLIST DEBUG] Found existing RSVP - blocking waitlist join`);
    return next(new AppError("You have already RSVP'd for this event", 400));
  }

  // Get next waitlist position
  const waitlistPosition = await RSVPModel.getNextWaitlistPosition(eventId);

  const rsvp = await RSVPModel.create({
    eventId,
    userId,
    status: RSVPStatus.WAITLISTED,
    guestCount,
    specialRequests: notes,
    waitlistPosition,
    approvalStatus: 'approved'
  });

  await rsvp.populate('user', 'email roles');

  // Clear cache
  await redisHelper.cacheDelete(`event_stats_${eventId}`);

  res.status(201).json({
    status: "success",
    message: "Successfully joined waitlist",
    data: rsvp
  });
});

/**
 * @desc    Get waitlist position
 * @route   GET /api/rsvp/waitlist/:eventId/position
 * @access  Private
 */
export const getWaitlistPosition = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { eventId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  const rsvp = await RSVPModel.findOne({
    eventId,
    userId,
    status: RSVPStatus.WAITLISTED
  });

  if (!rsvp) {
    return next(new AppError("You are not on the waitlist for this event", 404));
  }

  // Get total waitlist count
  const totalWaitlisted = await RSVPModel.countDocuments({
    eventId,
    status: RSVPStatus.WAITLISTED
  });

  res.status(200).json({
    status: "success",
    data: {
      position: rsvp.waitlistPosition,
      totalWaitlisted,
      joinedAt: rsvp.waitlistJoinedAt
    }
  });
});

/**
 * @desc    Debug RSVP email status and configuration
 * @route   GET /api/rsvp/:rsvpId/email-debug
 * @access  Private
 */
export const debugRSVPEmail = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { rsvpId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  // Get RSVP with user data
  const rsvp = await RSVPModel.findById(rsvpId).populate('user', 'email roles') as PopulatedRSVP | null;
  if (!rsvp) {
    return next(new AppError("RSVP not found", 404));
  }

  // Check if user has permission to debug this RSVP
  const isOwner = rsvp.userId.toString() === userId.toString();
  const isAdmin = req.user?.roles?.includes(UserRole.ADMIN);

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to debug this RSVP", 403));
  }

  try {
    // Get event data from Sanity
    const event = await SanityEventService.getEventById(rsvp.eventId);

    // Get SMTP status for events email type
    const emailService = await import("../config/protonMail");
    const smtpStatus = emailService.default.getSMTPStatus();

    // Test SMTP connection for events
    let smtpConnectionTest = false;
    let smtpError = null;
    try {
      smtpConnectionTest = await emailService.default.verifyConnection('rsvp');
    } catch (error) {
      smtpError = (error as Error).message;
    }

    // Check environment variables
    const envCheck = {
      SMTP_USERNAME_MEMBERS: !!process.env.SMTP_USERNAME_MEMBERS,
      SMTP_TOKEN_MEMBERS: !!process.env.SMTP_TOKEN_MEMBERS,
      SMTP_SERVER: process.env.SMTP_SERVER,
      SMTP_PORT: process.env.SMTP_PORT,
      API_BASE_URL: process.env.API_BASE_URL,
      BASE_URL: process.env.BASE_URL
    };

    const debugInfo = {
      rsvp: {
        id: rsvp._id,
        eventId: rsvp.eventId,
        userId: rsvp.userId,
        status: rsvp.status,
        confirmationEmailSent: rsvp.confirmationEmailSent,
        reminderEmailsSent: rsvp.reminderEmailsSent,
        approvalStatus: rsvp.approvalStatus,
        createdAt: rsvp.createdAt,
        updatedAt: rsvp.updatedAt
      },
      user: {
        email: rsvp.user.email,
        emailValid: isValidUserEmail(rsvp.user.email),
        isWalletEmail: rsvp.user.email.includes('@wallet.temp')
      },
      event: event ? {
        id: event._id,
        title: event.title,
        eventDate: event.eventDate,
        organizer: event.organizer
      } : null,
      emailConfig: {
        smtpStatus: smtpStatus.events || smtpStatus,
        smtpConnectionTest,
        smtpError,
        senderEmail: emailService.default.getSenderEmail('rsvp'),
        emailType: 'rsvp'
      },
      environment: envCheck,
      lastEmailAttempt: {
        // This would need to be tracked in a separate log table
        // For now, we can only show what we know from the RSVP record
        confirmationSent: rsvp.confirmationEmailSent,
        lastUpdated: rsvp.updatedAt
      }
    };

    res.status(200).json({
      status: "success",
      message: "RSVP email debug information retrieved",
      data: debugInfo,
      recommendations: generateEmailDebugRecommendations(debugInfo)
    });

  } catch (error) {
    console.error('Error in RSVP email debug:', error);
    return next(new AppError("Failed to retrieve debug information", 500));
  }
});

/**
 * @desc    Resend RSVP confirmation email for debugging
 * @route   POST /api/rsvp/:rsvpId/resend-email
 * @access  Private
 */
export const resendRSVPEmail = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { rsvpId } = req.params;
  const { emailType = 'confirmation', customMessage, force = false } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  // Get RSVP with user data
  const rsvp = await RSVPModel.findById(rsvpId).populate('user', 'email roles') as PopulatedRSVP | null;
  if (!rsvp) {
    return next(new AppError("RSVP not found", 404));
  }

  // Check if user has permission to resend email for this RSVP
  const isOwner = rsvp.userId.toString() === userId.toString();
  const isAdmin = req.user?.roles?.includes(UserRole.ADMIN);

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to resend email for this RSVP", 403));
  }

  try {
    const RSVPEmailService = await import("../services/rsvpEmailService");
    let success = false;
    let message = "";
    let debugInfo: any = {};

    // Capture start time for performance tracking
    const startTime = Date.now();

    switch (emailType) {
      case 'confirmation':
        // Reset confirmation flag if force is true
        if (force) {
          await RSVPModel.findByIdAndUpdate(rsvpId, {
            confirmationEmailSent: false
          });
        }

        success = await RSVPEmailService.default.sendConfirmationEmail(
          rsvpId,
          customMessage || "Debug resend: Thank you for your RSVP! We're excited to see you at the event."
        );
        message = success ? "Confirmation email resent successfully" : "Failed to resend confirmation email";
        break;

      case 'reminder':
        success = await RSVPEmailService.default.sendReminderEmail(
          rsvpId,
          '24_hours',
          customMessage || "Debug resend: Reminder about your upcoming event."
        );
        message = success ? "Reminder email resent successfully" : "Failed to resend reminder email";
        break;

      default:
        return next(new AppError("Invalid email type. Use 'confirmation' or 'reminder'", 400));
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Get updated RSVP to check if flags were updated
    const updatedRSVP = await RSVPModel.findById(rsvpId);

    debugInfo = {
      emailType,
      success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      rsvpUpdated: {
        confirmationEmailSent: updatedRSVP?.confirmationEmailSent,
        reminderEmailsSent: updatedRSVP?.reminderEmailsSent
      }
    };

    res.status(success ? 200 : 500).json({
      status: success ? "success" : "error",
      message,
      data: debugInfo
    });

  } catch (error) {
    console.error('Error resending RSVP email:', error);
    return next(new AppError(`Failed to resend email: ${(error as Error).message}`, 500));
  }
});

/**
 * @desc    Get current user info for debugging
 * @route   GET /api/rsvp/debug/current-user
 * @access  Private
 */
export const debugCurrentUser = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  try {
    // Get full user data
    const UserModel = await import("../models/usersModel");
    const user = await UserModel.default.findById(userId);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Get user's RSVPs for context
    const userRSVPs = await RSVPModel.find({ userId }).sort({ createdAt: -1 });

    console.log(`🔍 [DEBUG] User RSVP check for user ${userId}:`);
    console.log(`   Total RSVPs found: ${userRSVPs.length}`);
    userRSVPs.forEach((rsvp, index) => {
      console.log(`   RSVP ${index + 1}:`, {
        id: rsvp._id,
        eventId: rsvp.eventId,
        status: rsvp.status,
        guestCount: rsvp.guestCount,
        createdAt: rsvp.createdAt
      });
    });

    const debugInfo = {
      user: {
        id: user._id,
        email: user.email,
        emailValid: isValidUserEmail(user.email),
        isWalletEmail: user.email.includes('@wallet.temp'),
        roles: user.roles,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      allRSVPs: userRSVPs.map(rsvp => ({
        id: rsvp._id,
        eventId: rsvp.eventId,
        status: rsvp.status,
        guestCount: rsvp.guestCount,
        confirmationEmailSent: rsvp.confirmationEmailSent,
        createdAt: rsvp.createdAt,
        updatedAt: rsvp.updatedAt
      })),
      rsvpCount: userRSVPs.length,
      recommendations: [] as string[]
    };

    // Generate recommendations
    if (debugInfo.user.isWalletEmail) {
      debugInfo.recommendations.push("User is using a wallet-based temporary email address. Consider updating to a real email address to receive notifications.");
    }

    if (!debugInfo.user.emailValid) {
      debugInfo.recommendations.push("User email format is invalid. Update the email address.");
    }

    if (!debugInfo.user.isVerified) {
      debugInfo.recommendations.push("User account is not verified. This might affect email delivery.");
    }

    res.status(200).json({
      status: "success",
      message: "Current user debug information",
      data: debugInfo
    });

  } catch (error) {
    console.error('Error in current user debug:', error);
    return next(new AppError("Failed to retrieve user debug information", 500));
  }
});

// Helper function to check if email is valid (not wallet temp)
function isValidUserEmail(email: string): boolean {
  if (!email) return false;
  if (email.includes('@wallet.temp')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper function to generate debug recommendations
function generateEmailDebugRecommendations(debugInfo: any): string[] {
  const recommendations: string[] = [];

  // Check for wallet email first (highest priority)
  if (debugInfo.user.email && debugInfo.user.email.includes('@wallet.temp')) {
    recommendations.push("🚨 WALLET EMAIL DETECTED: User is using a temporary wallet email address (" + debugInfo.user.email + "). This is why emails aren't being received. The system now blocks RSVPs with wallet emails. User must update to a real email address.");
    return recommendations; // Return early as this is the main issue
  }

  if (!debugInfo.emailConfig.smtpStatus.isConfigured) {
    recommendations.push("SMTP configuration is incomplete. Check SMTP_USERNAME_MEMBERS and SMTP_TOKEN_MEMBERS environment variables.");
  }

  if (!debugInfo.emailConfig.smtpConnectionTest) {
    recommendations.push("SMTP connection test failed. Verify SMTP credentials and server settings.");
  }

  if (!debugInfo.user.emailValid) {
    recommendations.push("User email format appears invalid. Verify the email address.");
  }

  if (!debugInfo.event) {
    recommendations.push("Event data could not be retrieved from Sanity. Check event ID and Sanity connection.");
  }

  if (!debugInfo.environment.SMTP_USERNAME_MEMBERS || !debugInfo.environment.SMTP_TOKEN_MEMBERS) {
    recommendations.push("Missing required environment variables for events SMTP configuration.");
  }

  if (debugInfo.rsvp.confirmationEmailSent && !debugInfo.lastEmailAttempt.confirmationSent) {
    recommendations.push("Inconsistent email status. The confirmationEmailSent flag may not be accurate.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Configuration appears correct. Email should be working. Check spam folder or try resending.");
  }

  return recommendations;
}

/**
 * @desc    Send RSVP email (confirmation, reminder, etc.)
 * @route   POST /api/rsvp/send-email
 * @access  Private
 */
export const sendRSVPEmail = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { rsvpId, emailType, customMessage } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  // Validate RSVP exists and user has permission
  const rsvp = await RSVPModel.findById(rsvpId);
  if (!rsvp) {
    return next(new AppError("RSVP not found", 404));
  }

  const isOwner = rsvp.userId.toString() === userId.toString();
  const isAdmin = req.user?.roles.includes(UserRole.ADMIN);

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to send emails for this RSVP", 403));
  }

  let success = false;
  let message = "";

  try {
    switch (emailType) {
      case 'confirmation':
        success = await RSVPEmailService.sendConfirmationEmail(rsvpId, customMessage);
        message = "Confirmation email sent successfully";
        break;

      case 'reminder':
        success = await RSVPEmailService.sendReminderEmail(rsvpId, '24_hours', customMessage);
        message = "Reminder email sent successfully";
        break;

      default:
        return next(new AppError("Invalid email type", 400));
    }

    if (!success) {
      return next(new AppError("Failed to send email", 500));
    }

    res.status(200).json({
      status: "success",
      message
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return next(new AppError("Failed to send email", 500));
  }
});

/**
 * @desc    Send event reminder to all attendees
 * @route   POST /api/rsvp/send-reminder
 * @access  Private (Admin only)
 */
export const sendEventReminder = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { eventId, reminderType, customMessage } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  // Check admin permission
  const isAdmin = req.user?.roles.includes(UserRole.ADMIN);
  if (!isAdmin) {
    return next(new AppError("Admin access required", 403));
  }

  // Validate event exists
  const event = await SanityEventService.getEventById(eventId);
  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  try {
    const results = await RSVPEmailService.sendBulkReminders({
      eventId,
      reminderType,
      customMessage
    });

    res.status(200).json({
      status: "success",
      message: "Reminder emails sent",
      data: {
        sent: results.sent,
        failed: results.failed,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('Bulk reminder error:', error);
    return next(new AppError("Failed to send reminder emails", 500));
  }
});

/**
 * @desc    Download calendar invitation for RSVP (Public with token)
 * @route   GET /api/rsvp/:id/calendar/public
 * @access  Public (with secure token)
 */
export const downloadPublicCalendarInvitation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { format = 'ics', token } = req.query;

  // Get RSVP
  const rsvp = await RSVPModel.findById(id);
  if (!rsvp) {
    return next(new AppError("RSVP not found", 404));
  }

  // Verify token (simple token based on RSVP ID and user ID)
  const expectedToken = Buffer.from(`${rsvp._id}:${rsvp.userId}:${rsvp.eventId}`).toString('base64');
  if (token !== expectedToken) {
    return next(new AppError("Invalid calendar access token", 403));
  }

  // Only allow calendar download for attending users
  if (rsvp.status !== RSVPStatus.ATTENDING) {
    return next(new AppError("Calendar invitations are only available for attending RSVPs", 400));
  }

  try {
    if (format === 'google') {
      // Redirect to Google Calendar
      const googleURL = await CalendarService.generateGoogleCalendarURL(id);
      return res.redirect(googleURL);
    } else if (format === 'outlook') {
      // Redirect to Outlook Calendar
      const outlookURL = await CalendarService.generateOutlookCalendarURL(id);
      return res.redirect(outlookURL);
    } else {
      // Generate and download ICS file
      const icsContent = await CalendarService.generateICSForRSVP(id);
      const filename = CalendarService.generateFilename(
        `Event_${rsvp.eventId}`,
        id
      );

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      res.send(icsContent);
    }
  } catch (error) {
    console.error('Calendar generation error:', error);
    return next(new AppError("Failed to generate calendar invitation", 500));
  }
});

/**
 * @desc    Download calendar invitation for RSVP
 * @route   GET /api/rsvp/:id/calendar
 * @access  Private
 */
export const downloadCalendarInvitation = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { format = 'ics' } = req.query;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  // Get RSVP and verify ownership
  const rsvp = await RSVPModel.findById(id);
  if (!rsvp) {
    return next(new AppError("RSVP not found", 404));
  }

  const isOwner = rsvp.userId.toString() === userId.toString();
  const isAdmin = req.user?.roles.includes(UserRole.ADMIN);

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to download calendar for this RSVP", 403));
  }

  // Only allow calendar download for attending users
  if (rsvp.status !== RSVPStatus.ATTENDING) {
    return next(new AppError("Calendar invitations are only available for attending RSVPs", 400));
  }

  try {
    if (format === 'google') {
      // Redirect to Google Calendar
      const googleURL = await CalendarService.generateGoogleCalendarURL(id);
      return res.redirect(googleURL);
    } else if (format === 'outlook') {
      // Redirect to Outlook Calendar
      const outlookURL = await CalendarService.generateOutlookCalendarURL(id);
      return res.redirect(outlookURL);
    } else {
      // Generate and download ICS file
      const icsContent = await CalendarService.generateICSForRSVP(id);
      const filename = CalendarService.generateCalendarFilename(
        `Event_${rsvp.eventId}`,
        id
      );

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      res.send(icsContent);
    }
  } catch (error) {
    console.error('Calendar generation error:', error);
    return next(new AppError("Failed to generate calendar invitation", 500));
  }
});

/**
 * @desc    Get calendar links for RSVP
 * @route   GET /api/rsvp/:id/calendar-links
 * @access  Private
 */
export const getCalendarLinks = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  // Get RSVP and verify ownership
  const rsvp = await RSVPModel.findById(id);
  if (!rsvp) {
    return next(new AppError("RSVP not found", 404));
  }

  const isOwner = rsvp.userId.toString() === userId.toString();
  const isAdmin = req.user?.roles.includes(UserRole.ADMIN);

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to access calendar links for this RSVP", 403));
  }

  // Only provide calendar links for attending users
  if (rsvp.status !== RSVPStatus.ATTENDING) {
    return next(new AppError("Calendar links are only available for attending RSVPs", 400));
  }

  try {
    const baseURL = `${req.protocol}://${req.get('host')}/api/rsvp/${id}/calendar`;

    const calendarLinks = {
      ics: `${baseURL}?format=ics`,
      google: `${baseURL}?format=google`,
      outlook: `${baseURL}?format=outlook`,
      googleDirect: await CalendarService.generateGoogleCalendarURL(id),
      outlookDirect: await CalendarService.generateOutlookCalendarURL(id)
    };

    res.status(200).json({
      status: "success",
      data: calendarLinks
    });
  } catch (error) {
    console.error('Calendar links generation error:', error);
    return next(new AppError("Failed to generate calendar links", 500));
  }
});
