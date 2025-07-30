import { body, query, param } from "express-validator";
import { RSVPStatus } from "../models/rsvpModel";

/**
 * Validation for creating RSVP
 */
export const validateCreateRSVP = [
  body("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .isString()
    .withMessage("Event ID must be a string")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Invalid event ID format"),

  body("status")
    .notEmpty()
    .withMessage("RSVP status is required")
    .isIn(Object.values(RSVPStatus))
    .withMessage("Invalid RSVP status"),

  body("guestCount")
    .notEmpty()
    .withMessage("Guest count is required")
    .isInt({ min: 1, max: 20 })
    .withMessage("Guest count must be between 1 and 20"),

  body("dietaryRestrictions")
    .optional()
    .isString()
    .withMessage("Dietary restrictions must be a string")
    .isLength({ max: 500 })
    .withMessage("Dietary restrictions cannot exceed 500 characters"),

  body("specialRequests")
    .optional()
    .isString()
    .withMessage("Special requests must be a string")
    .isLength({ max: 1000 })
    .withMessage("Special requests cannot exceed 1000 characters"),

  body("contactInfo")
    .optional()
    .isObject()
    .withMessage("Contact info must be an object"),

  body("contactInfo.phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .matches(/^[\+]?[1-9][\d\s\-\(\)]{0,15}$/)
    .withMessage("Invalid phone number format"),

  body("contactInfo.emergencyContact")
    .optional()
    .isString()
    .withMessage("Emergency contact must be a string")
    .isLength({ max: 200 })
    .withMessage("Emergency contact cannot exceed 200 characters")
];

/**
 * Validation for updating RSVP
 */
export const validateUpdateRSVP = [
  param("id")
    .notEmpty()
    .withMessage("RSVP ID is required")
    .isMongoId()
    .withMessage("Invalid RSVP ID format"),

  body("status")
    .optional()
    .isIn(Object.values(RSVPStatus))
    .withMessage("Invalid RSVP status"),

  body("guestCount")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Guest count must be between 1 and 20"),

  body("dietaryRestrictions")
    .optional()
    .isString()
    .withMessage("Dietary restrictions must be a string")
    .isLength({ max: 500 })
    .withMessage("Dietary restrictions cannot exceed 500 characters"),

  body("specialRequests")
    .optional()
    .isString()
    .withMessage("Special requests must be a string")
    .isLength({ max: 1000 })
    .withMessage("Special requests cannot exceed 1000 characters"),

  body("contactInfo")
    .optional()
    .isObject()
    .withMessage("Contact info must be an object"),

  body("contactInfo.phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .matches(/^[\+]?[1-9][\d\s\-\(\)]{0,15}$/)
    .withMessage("Invalid phone number format"),

  body("contactInfo.emergencyContact")
    .optional()
    .isString()
    .withMessage("Emergency contact must be a string")
    .isLength({ max: 200 })
    .withMessage("Emergency contact cannot exceed 200 characters")
];

/**
 * Validation for getting user RSVPs
 */
export const validateGetUserRSVPs = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("status")
    .optional()
    .isIn(Object.values(RSVPStatus))
    .withMessage("Invalid RSVP status filter")
];

/**
 * Validation for getting event attendees
 */
export const validateGetEventAttendees = [
  param("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .isString()
    .withMessage("Event ID must be a string")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Invalid event ID format"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("status")
    .optional()
    .isIn(Object.values(RSVPStatus))
    .withMessage("Invalid RSVP status filter")
];

/**
 * Validation for joining waitlist
 */
export const validateJoinWaitlist = [
  body("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .isString()
    .withMessage("Event ID must be a string")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Invalid event ID format"),

  body("guestCount")
    .notEmpty()
    .withMessage("Guest count is required")
    .isInt({ min: 1, max: 20 })
    .withMessage("Guest count must be between 1 and 20"),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters")
];

/**
 * Validation for event ID parameter
 */
export const validateEventId = [
  param("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .isString()
    .withMessage("Event ID must be a string")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Invalid event ID format")
];

/**
 * Validation for RSVP ID parameter
 */
export const validateRSVPId = [
  param("id")
    .notEmpty()
    .withMessage("RSVP ID is required")
    .isMongoId()
    .withMessage("Invalid RSVP ID format")
];

/**
 * Validation for bulk operations
 */
export const validateBulkUpdate = [
  body("rsvpIds")
    .isArray({ min: 1 })
    .withMessage("RSVP IDs array is required and must not be empty"),

  body("rsvpIds.*")
    .isMongoId()
    .withMessage("Each RSVP ID must be a valid MongoDB ObjectId"),

  body("updates")
    .isObject()
    .withMessage("Updates object is required"),

  body("updates.status")
    .optional()
    .isIn(Object.values(RSVPStatus))
    .withMessage("Invalid RSVP status"),

  body("updates.adminNotes")
    .optional()
    .isString()
    .withMessage("Admin notes must be a string")
    .isLength({ max: 2000 })
    .withMessage("Admin notes cannot exceed 2000 characters"),

  body("sendNotification")
    .optional()
    .isBoolean()
    .withMessage("Send notification must be a boolean")
];

/**
 * Validation for email operations
 */
export const validateSendEmail = [
  body("rsvpId")
    .optional()
    .isMongoId()
    .withMessage("Invalid RSVP ID format"),

  body("eventId")
    .optional()
    .isString()
    .withMessage("Event ID must be a string")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Invalid event ID format"),

  body("emailType")
    .notEmpty()
    .withMessage("Email type is required")
    .isIn(['confirmation', 'reminder', 'cancellation', 'update'])
    .withMessage("Invalid email type"),

  body("customMessage")
    .optional()
    .isString()
    .withMessage("Custom message must be a string")
    .isLength({ max: 1000 })
    .withMessage("Custom message cannot exceed 1000 characters")
];

/**
 * Validation for reminder operations
 */
export const validateSendReminder = [
  body("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .isString()
    .withMessage("Event ID must be a string")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Invalid event ID format"),

  body("reminderType")
    .notEmpty()
    .withMessage("Reminder type is required")
    .isIn(['1_week', '24_hours', '1_day', '2_hours'])
    .withMessage("Invalid reminder type"),

  body("customMessage")
    .optional()
    .isString()
    .withMessage("Custom message must be a string")
    .isLength({ max: 1000 })
    .withMessage("Custom message cannot exceed 1000 characters")
];

/**
 * Validation for analytics queries
 */
export const validateAnalytics = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),

  query("groupBy")
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage("Group by must be one of: day, week, month, year"),

  query("eventId")
    .optional()
    .isString()
    .withMessage("Event ID must be a string")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Invalid event ID format")
];
