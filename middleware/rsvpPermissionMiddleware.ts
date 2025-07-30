import { Request, Response, NextFunction } from "express";
import { EventCacheModel, EVENT_ACCESS_MAP, EventType, IEventCache } from "../models/rsvpModels";
import { UserRole, IUser } from "../models/usersModel";
import AppError from "../utils/AppError";

// Extend Request interface to include user and event
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      event?: IEventCache;
    }
  }
}



// Check if user can access event type
export const checkEventAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to access events.")
      );
    }

    // Get event type from request body or query
    const eventType = req.body?.eventType || req.query?.eventType;

    if (!eventType) {
      return next(AppError.badRequest("Event type is required"));
    }

    // Check if event type is valid
    if (!Object.values(EventType).includes(eventType as EventType)) {
      return next(AppError.badRequest("Invalid event type"));
    }

    // Get allowed roles for this event type
    const allowedRoles = EVENT_ACCESS_MAP[eventType as EventType];

    // Check if user has roles property
    if (!req.user.roles || !Array.isArray(req.user.roles)) {
      return next(
        AppError.unauthorized("User roles not properly configured. Please contact support.")
      );
    }

    // Check if user has at least one of the required roles
    const hasAccess = req.user.roles.some((userRole) =>
      allowedRoles.includes(userRole as UserRole)
    );

    if (!hasAccess) {
      return next(
        AppError.forbidden(
          `You do not have permission to access ${eventType.replace(
            "_",
            " "
          )} events.`
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user can access specific event (by eventId)
export const checkSpecificEventAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to access events.")
      );
    }

    const eventId = req.params.eventId || req.body.eventId;

    if (!eventId) {
      return next(AppError.badRequest("Event ID is required"));
    }

    // Get event from cache
    const event = await EventCacheModel.findOne({ eventId });

    if (!event) {
      return next(AppError.notFound("Event not found"));
    }

    // Check if event is active
    if (!event.isActive) {
      return next(AppError.badRequest("This event is no longer active"));
    }

    // Get allowed roles for this event type
    const allowedRoles = EVENT_ACCESS_MAP[event.eventType];

    // Check if user has roles property
    if (!req.user.roles || !Array.isArray(req.user.roles)) {
      return next(
        AppError.unauthorized("User roles not properly configured. Please contact support.")
      );
    }

    // Check if user has at least one of the required roles
    const hasAccess = req.user.roles.some((userRole) =>
      allowedRoles.includes(userRole as UserRole)
    );

    if (!hasAccess) {
      return next(
        AppError.forbidden(
          `You do not have permission to access ${event.eventType.replace(
            "_",
            " "
          )} events.`
        )
      );
    }

    // Add event to request for use in controller
    req.event = event;

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user can manage RSVPs (admin only for viewing all RSVPs)
export const checkRSVPManagementAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to manage RSVPs.")
      );
    }

    // Check if user has roles property
    if (!req.user.roles || !Array.isArray(req.user.roles)) {
      return next(
        AppError.unauthorized("User roles not properly configured. Please contact support.")
      );
    }

    // Only admins can manage all RSVPs
    const isAdmin = req.user.roles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return next(
        AppError.forbidden("You do not have permission to manage RSVPs.")
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user owns the RSVP or is admin
export const checkRSVPOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to access RSVPs.")
      );
    }

    // Check if user has roles property
    if (!req.user.roles || !Array.isArray(req.user.roles)) {
      return next(
        AppError.unauthorized("User roles not properly configured. Please contact support.")
      );
    }

    // Admins can access any RSVP
    const isAdmin = req.user.roles.includes(UserRole.ADMIN);

    if (isAdmin) {
      next();
      return;
    }

    // For non-admins, they can only access their own RSVPs
    // This will be further validated in the controller
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user can sync events from Sanity (admin only)
export const checkSanitySync = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to sync events.")
      );
    }

    // Check if user has roles property
    if (!req.user.roles || !Array.isArray(req.user.roles)) {
      return next(
        AppError.unauthorized("User roles not properly configured. Please contact support.")
      );
    }

    // Only admins can sync events from Sanity
    const isAdmin = req.user.roles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return next(
        AppError.forbidden("You do not have permission to sync events from Sanity.")
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting for RSVP operations
export const checkRSVPRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // This is a placeholder for rate limiting logic
    // You can implement Redis-based rate limiting here
    // For now, we'll just pass through
    next();
  } catch (error) {
    next(error);
  }
};

// Check event capacity before allowing RSVP
export const checkEventCapacity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    const eventId = req.params.eventId || req.body.eventId;

    // Only check capacity for YES responses
    if (status !== "yes") {
      next();
      return;
    }

    if (!eventId) {
      return next(AppError.badRequest("Event ID is required"));
    }

    // Get event from cache
    const event = await EventCacheModel.findOne({ eventId });

    if (!event) {
      return next(AppError.notFound("Event not found"));
    }

    // If no max attendees set, allow unlimited
    if (!event.maxAttendees) {
      next();
      return;
    }

    // Import RSVPModel here to avoid circular dependency
    const { RSVPModel } = await import("../models/rsvpModels");
    
    // Get current YES count
    const eventStats = await RSVPModel.getEventStats(eventId);

    // Check if adding this RSVP would exceed capacity
    if (eventStats.yesCount >= event.maxAttendees) {
      return next(AppError.badRequest("This event is at full capacity"));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validate event timing (can't RSVP to past events)
export const checkEventTiming = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const eventId = req.params.eventId || req.body.eventId;

    if (!eventId) {
      return next(AppError.badRequest("Event ID is required"));
    }

    // Get event from cache
    const event = await EventCacheModel.findOne({ eventId });

    if (!event) {
      return next(AppError.notFound("Event not found"));
    }

    // Check if event is in the past
    if (event.startDate <= new Date()) {
      return next(AppError.badRequest("Cannot RSVP to past events"));
    }

    next();
  } catch (error) {
    next(error);
  }
};


