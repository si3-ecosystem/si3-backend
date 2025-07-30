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

/**
 * @desc    Create new RSVP
 * @route   POST /api/rsvp
 * @access  Private
 */
export const createRSVP = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { eventId, status, guestCount, dietaryRestrictions, specialRequests, contactInfo } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  // Validate event and RSVP settings
  const event = await SanityEventService.validateEventForRSVP(eventId);
  
  // Check if user already has an RSVP for this event
  const existingRSVP = await RSVPModel.findOne({ eventId, userId });
  if (existingRSVP) {
    return next(new AppError("You have already RSVP'd for this event", 400));
  }

  // Validate guest count
  if (guestCount > event.rsvpSettings.maxGuestsPerRSVP) {
    return next(new AppError(`Maximum ${event.rsvpSettings.maxGuestsPerRSVP} guests allowed per RSVP`, 400));
  }

  // Check event capacity if attending
  if (status === RSVPStatus.ATTENDING && event.rsvpSettings.maxCapacity) {
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
    approvalStatus: event.rsvpSettings.requiresApproval ? 'pending' : 'approved'
  };

  const rsvp = await RSVPModel.create(rsvpData);
  await rsvp.populate('user', 'email roles');

  // Clear cache
  await redisHelper.cacheDelete(`event_stats_${eventId}`);
  await redisHelper.cacheDelete(`user_rsvps_${userId}`);

  res.status(201).json({
    status: "success",
    message: "RSVP created successfully",
    data: rsvp
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

  if (!userId) {
    return next(new AppError("User authentication required", 401));
  }

  // Build query
  const query: any = { userId };
  if (status) {
    query.status = status;
  }

  // Check cache first
  const cacheKey = `user_rsvps_${userId}_${page}_${limit}_${status || 'all'}`;
  const cachedRSVPs = await redisHelper.cacheGet(cacheKey);
  
  if (cachedRSVPs) {
    return res.status(200).json({
      status: "success",
      data: cachedRSVPs
    });
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const [rsvps, total] = await Promise.all([
    RSVPModel.find(query)
      .populate('user', 'email roles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    RSVPModel.countDocuments(query)
  ]);

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

  // Cache for 5 minutes
  await redisHelper.cacheSet(cacheKey, result, 300);

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
  const existingRSVP = await RSVPModel.findOne({ eventId, userId });
  if (existingRSVP) {
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
