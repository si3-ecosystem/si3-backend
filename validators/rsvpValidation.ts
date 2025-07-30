import { body, param, query } from "express-validator";
import { RSVPStatus, EventType } from "../models/rsvpModels";

// Create/Update RSVP validation
export const validateCreateRSVP = [
  body("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Event ID must be between 1 and 100 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Event ID can only contain alphanumeric characters, hyphens, and underscores")
    .trim(),

  body("status")
    .notEmpty()
    .withMessage("RSVP status is required")
    .isIn(Object.values(RSVPStatus))
    .withMessage(`Status must be one of: ${Object.values(RSVPStatus).join(", ")}`),

  body("notes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters")
    .trim(),

  body("notificationPreferences")
    .optional()
    .isObject()
    .withMessage("Notification preferences must be an object"),

  body("notificationPreferences.email")
    .optional()
    .isBoolean()
    .withMessage("Email notification preference must be a boolean"),

  body("notificationPreferences.inApp")
    .optional()
    .isBoolean()
    .withMessage("In-app notification preference must be a boolean"),

  body("notificationPreferences.daysBefore")
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage("Days before must be an array with maximum 10 items"),

  body("notificationPreferences.daysBefore.*")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Each day value must be between 1 and 365"),
];

// Get event RSVPs validation
export const validateGetEventRSVPs = [
  param("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Event ID can only contain alphanumeric characters, hyphens, and underscores")
    .trim(),

  query("status")
    .optional()
    .isIn(Object.values(RSVPStatus))
    .withMessage(`Status must be one of: ${Object.values(RSVPStatus).join(", ")}`),

  query("includeUser")
    .optional()
    .isBoolean()
    .withMessage("Include user must be a boolean"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

// Get user RSVPs validation
export const validateGetUserRSVPs = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("upcoming")
    .optional()
    .isBoolean()
    .withMessage("Upcoming must be a boolean"),
];

// Event ID parameter validation
export const validateEventId = [
  param("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Event ID can only contain alphanumeric characters, hyphens, and underscores")
    .trim(),
];

// Sync event from Sanity validation
export const validateSyncEvent = [
  param("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Event ID can only contain alphanumeric characters, hyphens, and underscores")
    .trim(),

  body("title")
    .notEmpty()
    .withMessage("Event title is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters")
    .trim(),

  body("description")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters")
    .trim(),

  body("eventType")
    .notEmpty()
    .withMessage("Event type is required")
    .isIn(Object.values(EventType))
    .withMessage(`Event type must be one of: ${Object.values(EventType).join(", ")}`),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date")
    .custom((value) => {
      const startDate = new Date(value);
      const now = new Date();
      if (startDate <= now) {
        throw new Error("Start date must be in the future");
      }
      return true;
    }),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (value && req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),

  body("location")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Location cannot exceed 200 characters")
    .trim(),

  body("maxAttendees")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Max attendees must be between 1 and 10,000"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Is active must be a boolean"),
];

// Notification preferences validation helper
export const validateNotificationPreferences = [
  body("email")
    .optional()
    .isBoolean()
    .withMessage("Email preference must be a boolean"),

  body("inApp")
    .optional()
    .isBoolean()
    .withMessage("In-app preference must be a boolean"),

  body("daysBefore")
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage("Days before must be an array with maximum 10 items"),

  body("daysBefore.*")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Each day value must be between 1 and 365"),
];

// Common pagination validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
];

// Event stats validation
export const validateEventStats = [
  param("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Event ID can only contain alphanumeric characters, hyphens, and underscores")
    .trim(),
];

// Bulk operations validation
export const validateBulkRSVP = [
  body("eventIds")
    .isArray({ min: 1, max: 50 })
    .withMessage("Event IDs must be an array with 1-50 items"),

  body("eventIds.*")
    .notEmpty()
    .withMessage("Each event ID is required")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Event ID can only contain alphanumeric characters, hyphens, and underscores"),

  body("status")
    .notEmpty()
    .withMessage("RSVP status is required")
    .isIn(Object.values(RSVPStatus))
    .withMessage(`Status must be one of: ${Object.values(RSVPStatus).join(", ")}`),
];

// Update notification preferences validation
export const validateUpdateNotificationPreferences = [
  param("rsvpId")
    .notEmpty()
    .withMessage("RSVP ID is required")
    .isMongoId()
    .withMessage("RSVP ID must be a valid MongoDB ObjectId"),

  ...validateNotificationPreferences,
];

// Event capacity check validation
export const validateEventCapacity = [
  param("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Event ID can only contain alphanumeric characters, hyphens, and underscores")
    .trim(),
];

// Date range validation for events
export const validateDateRange = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (value && req.query?.startDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),
];


