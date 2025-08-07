"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rsvpController_1 = require("../controllers/rsvpController");
const rsvpValidation_1 = require("../validators/rsvpValidation");
const protectMiddleware_1 = require("../middleware/protectMiddleware");
const validationMiddleware_1 = __importDefault(require("../middleware/validationMiddleware"));
const router = (0, express_1.Router)();
/**
 * @route   POST /api/rsvp
 * @desc    Create new RSVP
 * @access  Private
 */
router.post("/", protectMiddleware_1.protect, rsvpValidation_1.validateCreateRSVP, validationMiddleware_1.default, rsvpController_1.createRSVP);
/**
 * @route   GET /api/rsvp/my-rsvps
 * @desc    Get current user's RSVPs
 * @access  Private
 */
router.get("/my-rsvps", protectMiddleware_1.protect, rsvpValidation_1.validateGetUserRSVPs, validationMiddleware_1.default, rsvpController_1.getUserRSVPs);
/**
 * @route   GET /api/rsvp/:id
 * @desc    Get RSVP by ID
 * @access  Private
 */
router.get("/:id", protectMiddleware_1.protect, rsvpController_1.getRSVPById);
/**
 * @route   PUT /api/rsvp/:id
 * @desc    Update RSVP
 * @access  Private
 */
router.put("/:id", protectMiddleware_1.protect, rsvpValidation_1.validateUpdateRSVP, validationMiddleware_1.default, rsvpController_1.updateRSVP);
/**
 * @route   DELETE /api/rsvp/:id
 * @desc    Delete RSVP
 * @access  Private
 */
router.delete("/:id", protectMiddleware_1.protect, rsvpController_1.deleteRSVP);
/**
 * @route   GET /api/rsvp/event/:eventId/stats
 * @desc    Get event RSVP statistics
 * @access  Public
 */
router.get("/event/:eventId/stats", rsvpController_1.getEventRSVPStats);
/**
 * @route   GET /api/rsvp/event/:eventId/attendees
 * @desc    Get event attendees list
 * @access  Public
 */
router.get("/event/:eventId/attendees", rsvpValidation_1.validateGetEventAttendees, validationMiddleware_1.default, rsvpController_1.getEventAttendees);
/**
 * @route   GET /api/rsvp/event/:eventId/availability
 * @desc    Check event availability for RSVP
 * @access  Public
 */
router.get("/event/:eventId/availability", rsvpController_1.checkEventAvailability);
/**
 * @route   POST /api/rsvp/waitlist/join
 * @desc    Join event waitlist
 * @access  Private
 */
router.post("/waitlist/join", protectMiddleware_1.protect, rsvpValidation_1.validateJoinWaitlist, validationMiddleware_1.default, rsvpController_1.joinWaitlist);
/**
 * @route   GET /api/rsvp/waitlist/:eventId/position
 * @desc    Get user's waitlist position for event
 * @access  Private
 */
router.get("/waitlist/:eventId/position", protectMiddleware_1.protect, rsvpController_1.getWaitlistPosition);
/**
 * @route   POST /api/rsvp/send-email
 * @desc    Send RSVP email (confirmation, reminder)
 * @access  Private
 */
router.post("/send-email", protectMiddleware_1.protect, rsvpValidation_1.validateSendEmail, validationMiddleware_1.default, rsvpController_1.sendRSVPEmail);
/**
 * @route   POST /api/rsvp/send-reminder
 * @desc    Send reminder emails to all event attendees
 * @access  Private (Admin only)
 */
router.post("/send-reminder", protectMiddleware_1.protect, rsvpValidation_1.validateSendReminder, validationMiddleware_1.default, rsvpController_1.sendEventReminder);
/**
 * @route   GET /api/rsvp/:id/calendar/public
 * @desc    Download calendar invitation for RSVP (Public with token)
 * @access  Public
 */
router.get("/:id/calendar/public", rsvpController_1.downloadPublicCalendarInvitation);
/**
 * @route   GET /api/rsvp/:id/calendar
 * @desc    Download calendar invitation for RSVP
 * @access  Private
 */
router.get("/:id/calendar", protectMiddleware_1.protect, rsvpController_1.downloadCalendarInvitation);
/**
 * @route   GET /api/rsvp/:id/calendar-links
 * @desc    Get all calendar links for RSVP
 * @access  Private
 */
router.get("/:id/calendar-links", protectMiddleware_1.protect, rsvpController_1.getCalendarLinks);
/**
 * @route   GET /api/rsvp/:rsvpId/email-debug
 * @desc    Debug RSVP email status and configuration
 * @access  Private
 */
router.get("/:rsvpId/email-debug", protectMiddleware_1.protect, rsvpController_1.debugRSVPEmail);
/**
 * @route   POST /api/rsvp/:rsvpId/resend-email
 * @desc    Resend RSVP confirmation email for debugging
 * @access  Private
 */
router.post("/:rsvpId/resend-email", protectMiddleware_1.protect, rsvpValidation_1.validateResendEmail, validationMiddleware_1.default, rsvpController_1.resendRSVPEmail);
/**
 * @route   GET /api/rsvp/debug/current-user
 * @desc    Get current user info for debugging
 * @access  Private
 */
router.get("/debug/current-user", protectMiddleware_1.protect, rsvpController_1.debugCurrentUser);
exports.default = router;
