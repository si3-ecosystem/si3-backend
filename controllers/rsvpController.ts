import { Request, Response, NextFunction } from "express";
import { RSVPModel, EventCacheModel, RSVPStatus, IEventCache } from "../models/rsvpModels";
import { IUser } from "../models/usersModel";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";
import redisClient from "../config/redis";

// Extend Request interface to include user and event
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      event?: IEventCache;
    }
  }
}



// Create or update RSVP
export const createOrUpdateRSVP = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId, status, notes, notificationPreferences } = req.body;
    const userId = req.user!._id;

    // Check if event exists in cache, if not sync from Sanity
    let event = await EventCacheModel.findOne({ eventId });
    if (!event) {
      return next(
        AppError.notFound("Event not found. Please ensure the event exists in Sanity CMS.")
      );
    }

    // Check if event is still active and upcoming
    if (!event.isActive) {
      return next(AppError.badRequest("This event is no longer active."));
    }

    if (event.startDate <= new Date()) {
      return next(AppError.badRequest("Cannot RSVP to past events."));
    }

    // Check if event is at capacity (for YES responses)
    if (status === RSVPStatus.YES && event.maxAttendees) {
      const eventStats = await RSVPModel.getEventStats(eventId);
      if (eventStats.yesCount >= event.maxAttendees) {
        return next(AppError.badRequest("This event is at full capacity."));
      }
    }

    // Create or update RSVP
    const rsvp = await RSVPModel.createOrUpdateRSVP(
      eventId,
      userId,
      status,
      { notes, notificationPreferences }
    );

    // Populate user data for response
    await rsvp.populate('user', 'email roles');

    // Clear cache for this event's RSVPs
    await redisClient.del(`rsvp:event:${eventId}:*`);
    await redisClient.del(`rsvp:user:${userId}:*`);

    res.status(200).json({
      status: "success",
      data: {
        rsvp,
        message: `RSVP ${status === RSVPStatus.YES ? 'confirmed' : status === RSVPStatus.NO ? 'declined' : 'marked as maybe'} for ${event.title}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get user's RSVPs
export const getUserRSVPs = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const upcoming = req.query.upcoming === 'true';
    const skip = (page - 1) * limit;

    // Check cache first
    const cacheKey = `rsvp:user:${userId}:${page}:${limit}:${upcoming}`;
    const cachedResult = await redisClient.get(cacheKey);
    
    if (cachedResult) {
      res.status(200).json(cachedResult);
      return;
    }

    // Get RSVPs from database
    const rsvps = await RSVPModel.findUserRSVPs(userId, {
      limit,
      skip,
      upcoming,
    });

    // Get total count for pagination
    const totalRSVPs = await RSVPModel.countDocuments({ userId });

    const pagination = {
      page,
      limit,
      totalPages: Math.ceil(totalRSVPs / limit),
      totalRSVPs,
      hasNextPage: page < Math.ceil(totalRSVPs / limit),
      hasPrevPage: page > 1,
    };

    const result = {
      status: "success",
      results: rsvps.length,
      pagination,
      data: {
        rsvps,
      },
    };

    // Cache for 5 minutes
    await redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Get RSVPs for a specific event
export const getEventRSVPs = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const status = req.query.status as RSVPStatus;
    const includeUser = req.query.includeUser === 'true';

    // Check cache first
    const cacheKey = `rsvp:event:${eventId}:${status || 'all'}:${includeUser}`;
    const cachedResult = await redisClient.get(cacheKey);
    
    if (cachedResult) {
      res.status(200).json(cachedResult);
      return;
    }

    // Verify event exists
    const event = await EventCacheModel.findOne({ eventId });
    if (!event) {
      return next(AppError.notFound("Event not found."));
    }

    // Get RSVPs
    const rsvps = await RSVPModel.findByEventId(eventId, {
      status,
      includeUser,
    });

    const result = {
      status: "success",
      results: rsvps.length,
      data: {
        event: {
          id: event.eventId,
          title: event.title,
          startDate: event.startDate,
          maxAttendees: event.maxAttendees,
        },
        rsvps,
      },
    };

    // Cache for 2 minutes
    await redisClient.setex(cacheKey, 120, JSON.stringify(result));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Get event RSVP statistics
export const getEventStats = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.params;

    // Check cache first
    const cacheKey = `rsvp:stats:${eventId}`;
    const cachedResult = await redisClient.get(cacheKey);
    
    if (cachedResult) {
      res.status(200).json(cachedResult);
      return;
    }

    // Verify event exists
    const event = await EventCacheModel.findOne({ eventId });
    if (!event) {
      return next(AppError.notFound("Event not found."));
    }

    // Get statistics
    const stats = await RSVPModel.getEventStats(eventId);

    const result = {
      status: "success",
      data: {
        event: {
          id: event.eventId,
          title: event.title,
          startDate: event.startDate,
          maxAttendees: event.maxAttendees,
        },
        stats,
      },
    };

    // Cache for 1 minute
    await redisClient.setex(cacheKey, 60, JSON.stringify(result));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Delete RSVP
export const deleteRSVP = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user!._id;

    // Find and delete RSVP
    const rsvp = await RSVPModel.findOneAndDelete({ eventId, userId });

    if (!rsvp) {
      return next(AppError.notFound("RSVP not found."));
    }

    // Clear cache
    await redisClient.del(`rsvp:event:${eventId}:*`);
    await redisClient.del(`rsvp:user:${userId}:*`);

    res.status(200).json({
      status: "success",
      message: "RSVP deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Get user's RSVP for a specific event
export const getUserEventRSVP = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user!._id;

    const rsvp = await RSVPModel.findOne({ eventId, userId }).populate('user', 'email roles');

    if (!rsvp) {
      return next(AppError.notFound("RSVP not found."));
    }

    res.status(200).json({
      status: "success",
      data: {
        rsvp,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Sync event from Sanity CMS
export const syncEventFromSanity = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const sanityData = req.body;

    // Validate required Sanity data
    if (!sanityData.title || !sanityData.startDate || !sanityData.eventType) {
      return next(
        AppError.badRequest("Missing required event data: title, startDate, and eventType are required.")
      );
    }

    // Sync event to cache
    const event = await EventCacheModel.syncFromSanity(eventId, sanityData);

    // Clear related caches
    await redisClient.del(`rsvp:event:${eventId}:*`);
    await redisClient.del(`rsvp:stats:${eventId}`);

    res.status(200).json({
      status: "success",
      data: {
        event,
        message: "Event synced successfully from Sanity CMS",
      },
    });
  } catch (error) {
    next(error);
  }
});
