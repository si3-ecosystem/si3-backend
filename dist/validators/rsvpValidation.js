"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAnalytics = exports.validateResendEmail = exports.validateSendReminder = exports.validateSendEmail = exports.validateBulkUpdate = exports.validateRSVPId = exports.validateEventId = exports.validateJoinWaitlist = exports.validateGetEventAttendees = exports.validateGetUserRSVPs = exports.validateUpdateRSVP = exports.validateCreateRSVP = void 0;
const express_validator_1 = require("express-validator");
const rsvpModel_1 = require("../models/rsvpModel");
/**
 * Validation for creating RSVP
 */
exports.validateCreateRSVP = [
    (0, express_validator_1.body)("eventId")
        .notEmpty()
        .withMessage("Event ID is required")
        .isString()
        .withMessage("Event ID must be a string")
        .matches(/^[a-zA-Z0-9\-_]+$/)
        .withMessage("Invalid event ID format"),
    (0, express_validator_1.body)("status")
        .notEmpty()
        .withMessage("RSVP status is required")
        .isIn(Object.values(rsvpModel_1.RSVPStatus))
        .withMessage("Invalid RSVP status"),
    (0, express_validator_1.body)("guestCount")
        .notEmpty()
        .withMessage("Guest count is required")
        .isInt({ min: 1, max: 20 })
        .withMessage("Guest count must be between 1 and 20"),
    (0, express_validator_1.body)("dietaryRestrictions")
        .optional()
        .isString()
        .withMessage("Dietary restrictions must be a string")
        .isLength({ max: 500 })
        .withMessage("Dietary restrictions cannot exceed 500 characters"),
    (0, express_validator_1.body)("specialRequests")
        .optional()
        .isString()
        .withMessage("Special requests must be a string")
        .isLength({ max: 1000 })
        .withMessage("Special requests cannot exceed 1000 characters"),
    (0, express_validator_1.body)("contactInfo")
        .optional()
        .isObject()
        .withMessage("Contact info must be an object"),
    (0, express_validator_1.body)("contactInfo.phone")
        .optional()
        .isString()
        .withMessage("Phone must be a string")
        .matches(/^[\+]?[1-9][\d\s\-\(\)]{0,15}$/)
        .withMessage("Invalid phone number format"),
    (0, express_validator_1.body)("contactInfo.emergencyContact")
        .optional()
        .isString()
        .withMessage("Emergency contact must be a string")
        .isLength({ max: 200 })
        .withMessage("Emergency contact cannot exceed 200 characters")
];
/**
 * Validation for updating RSVP
 */
exports.validateUpdateRSVP = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage("RSVP ID is required")
        .isMongoId()
        .withMessage("Invalid RSVP ID format"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(Object.values(rsvpModel_1.RSVPStatus))
        .withMessage("Invalid RSVP status"),
    (0, express_validator_1.body)("guestCount")
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage("Guest count must be between 1 and 20"),
    (0, express_validator_1.body)("dietaryRestrictions")
        .optional()
        .isString()
        .withMessage("Dietary restrictions must be a string")
        .isLength({ max: 500 })
        .withMessage("Dietary restrictions cannot exceed 500 characters"),
    (0, express_validator_1.body)("specialRequests")
        .optional()
        .isString()
        .withMessage("Special requests must be a string")
        .isLength({ max: 1000 })
        .withMessage("Special requests cannot exceed 1000 characters"),
    (0, express_validator_1.body)("contactInfo")
        .optional()
        .isObject()
        .withMessage("Contact info must be an object"),
    (0, express_validator_1.body)("contactInfo.phone")
        .optional()
        .isString()
        .withMessage("Phone must be a string")
        .matches(/^[\+]?[1-9][\d\s\-\(\)]{0,15}$/)
        .withMessage("Invalid phone number format"),
    (0, express_validator_1.body)("contactInfo.emergencyContact")
        .optional()
        .isString()
        .withMessage("Emergency contact must be a string")
        .isLength({ max: 200 })
        .withMessage("Emergency contact cannot exceed 200 characters")
];
/**
 * Validation for getting user RSVPs
 */
exports.validateGetUserRSVPs = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    (0, express_validator_1.query)("status")
        .optional()
        .isIn(Object.values(rsvpModel_1.RSVPStatus))
        .withMessage("Invalid RSVP status filter")
];
/**
 * Validation for getting event attendees
 */
exports.validateGetEventAttendees = [
    (0, express_validator_1.param)("eventId")
        .notEmpty()
        .withMessage("Event ID is required")
        .isString()
        .withMessage("Event ID must be a string")
        .matches(/^[a-zA-Z0-9\-_]+$/)
        .withMessage("Invalid event ID format"),
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    (0, express_validator_1.query)("status")
        .optional()
        .isIn(Object.values(rsvpModel_1.RSVPStatus))
        .withMessage("Invalid RSVP status filter")
];
/**
 * Validation for joining waitlist
 */
exports.validateJoinWaitlist = [
    (0, express_validator_1.body)("eventId")
        .notEmpty()
        .withMessage("Event ID is required")
        .isString()
        .withMessage("Event ID must be a string")
        .matches(/^[a-zA-Z0-9\-_]+$/)
        .withMessage("Invalid event ID format"),
    (0, express_validator_1.body)("guestCount")
        .notEmpty()
        .withMessage("Guest count is required")
        .isInt({ min: 1, max: 20 })
        .withMessage("Guest count must be between 1 and 20"),
    (0, express_validator_1.body)("notes")
        .optional()
        .isString()
        .withMessage("Notes must be a string")
        .isLength({ max: 500 })
        .withMessage("Notes cannot exceed 500 characters")
];
/**
 * Validation for event ID parameter
 */
exports.validateEventId = [
    (0, express_validator_1.param)("eventId")
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
exports.validateRSVPId = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage("RSVP ID is required")
        .isMongoId()
        .withMessage("Invalid RSVP ID format")
];
/**
 * Validation for bulk operations
 */
exports.validateBulkUpdate = [
    (0, express_validator_1.body)("rsvpIds")
        .isArray({ min: 1 })
        .withMessage("RSVP IDs array is required and must not be empty"),
    (0, express_validator_1.body)("rsvpIds.*")
        .isMongoId()
        .withMessage("Each RSVP ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("updates")
        .isObject()
        .withMessage("Updates object is required"),
    (0, express_validator_1.body)("updates.status")
        .optional()
        .isIn(Object.values(rsvpModel_1.RSVPStatus))
        .withMessage("Invalid RSVP status"),
    (0, express_validator_1.body)("updates.adminNotes")
        .optional()
        .isString()
        .withMessage("Admin notes must be a string")
        .isLength({ max: 2000 })
        .withMessage("Admin notes cannot exceed 2000 characters"),
    (0, express_validator_1.body)("sendNotification")
        .optional()
        .isBoolean()
        .withMessage("Send notification must be a boolean")
];
/**
 * Validation for email operations
 */
exports.validateSendEmail = [
    (0, express_validator_1.body)("rsvpId")
        .optional()
        .isMongoId()
        .withMessage("Invalid RSVP ID format"),
    (0, express_validator_1.body)("eventId")
        .optional()
        .isString()
        .withMessage("Event ID must be a string")
        .matches(/^[a-zA-Z0-9\-_]+$/)
        .withMessage("Invalid event ID format"),
    (0, express_validator_1.body)("emailType")
        .notEmpty()
        .withMessage("Email type is required")
        .isIn(['confirmation', 'reminder', 'cancellation', 'update'])
        .withMessage("Invalid email type"),
    (0, express_validator_1.body)("customMessage")
        .optional()
        .isString()
        .withMessage("Custom message must be a string")
        .isLength({ max: 1000 })
        .withMessage("Custom message cannot exceed 1000 characters")
];
/**
 * Validation for reminder operations
 */
exports.validateSendReminder = [
    (0, express_validator_1.body)("eventId")
        .notEmpty()
        .withMessage("Event ID is required")
        .isString()
        .withMessage("Event ID must be a string")
        .matches(/^[a-zA-Z0-9\-_]+$/)
        .withMessage("Invalid event ID format"),
    (0, express_validator_1.body)("reminderType")
        .notEmpty()
        .withMessage("Reminder type is required")
        .isIn(['1_week', '24_hours', '1_day', '2_hours'])
        .withMessage("Invalid reminder type"),
    (0, express_validator_1.body)("customMessage")
        .optional()
        .isString()
        .withMessage("Custom message must be a string")
        .isLength({ max: 1000 })
        .withMessage("Custom message cannot exceed 1000 characters")
];
/**
 * Validation for resending RSVP emails
 */
exports.validateResendEmail = [
    (0, express_validator_1.param)("rsvpId")
        .notEmpty()
        .withMessage("RSVP ID is required")
        .isMongoId()
        .withMessage("Invalid RSVP ID format"),
    (0, express_validator_1.body)("emailType")
        .optional()
        .isIn(['confirmation', 'reminder'])
        .withMessage("Email type must be 'confirmation' or 'reminder'"),
    (0, express_validator_1.body)("customMessage")
        .optional()
        .isString()
        .withMessage("Custom message must be a string")
        .isLength({ max: 1000 })
        .withMessage("Custom message cannot exceed 1000 characters"),
    (0, express_validator_1.body)("force")
        .optional()
        .isBoolean()
        .withMessage("Force flag must be a boolean")
];
/**
 * Validation for analytics queries
 */
exports.validateAnalytics = [
    (0, express_validator_1.query)("startDate")
        .optional()
        .isISO8601()
        .withMessage("Start date must be a valid ISO 8601 date"),
    (0, express_validator_1.query)("endDate")
        .optional()
        .isISO8601()
        .withMessage("End date must be a valid ISO 8601 date"),
    (0, express_validator_1.query)("groupBy")
        .optional()
        .isIn(['day', 'week', 'month', 'year'])
        .withMessage("Group by must be one of: day, week, month, year"),
    (0, express_validator_1.query)("eventId")
        .optional()
        .isString()
        .withMessage("Event ID must be a string")
        .matches(/^[a-zA-Z0-9\-_]+$/)
        .withMessage("Invalid event ID format")
];
