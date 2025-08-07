import { Router } from "express";

import {
  createRSVP,
  getUserRSVPs,
  getRSVPById,
  updateRSVP,
  deleteRSVP,
  getEventRSVPStats,
  getEventAttendees,
  checkEventAvailability,
  joinWaitlist,
  getWaitlistPosition,
  sendRSVPEmail,
  sendEventReminder,
  downloadCalendarInvitation,
  downloadPublicCalendarInvitation,
  getCalendarLinks,
  debugRSVPEmail,
  resendRSVPEmail,
  debugCurrentUser
} from "../controllers/rsvpController";

import {
  validateCreateRSVP,
  validateUpdateRSVP,
  validateJoinWaitlist,
  validateGetUserRSVPs,
  validateGetEventAttendees,
  validateSendEmail,
  validateSendReminder,
  validateResendEmail
} from "../validators/rsvpValidation";

import { protect } from "../middleware/protectMiddleware";
import validationMiddleware from "../middleware/validationMiddleware";

const router = Router();

/**
 * @route   POST /api/rsvp
 * @desc    Create new RSVP
 * @access  Private
 */
router.post(
  "/",
  protect,
  validateCreateRSVP,
  validationMiddleware,
  createRSVP
);

/**
 * @route   GET /api/rsvp/my-rsvps
 * @desc    Get current user's RSVPs
 * @access  Private
 */
router.get(
  "/my-rsvps",
  protect,
  validateGetUserRSVPs,
  validationMiddleware,
  getUserRSVPs
);

/**
 * @route   GET /api/rsvp/:id
 * @desc    Get RSVP by ID
 * @access  Private
 */
router.get(
  "/:id",
  protect,
  getRSVPById
);

/**
 * @route   PUT /api/rsvp/:id
 * @desc    Update RSVP
 * @access  Private
 */
router.put(
  "/:id",
  protect,
  validateUpdateRSVP,
  validationMiddleware,
  updateRSVP
);

/**
 * @route   DELETE /api/rsvp/:id
 * @desc    Delete RSVP
 * @access  Private
 */
router.delete(
  "/:id",
  protect,
  deleteRSVP
);

/**
 * @route   GET /api/rsvp/event/:eventId/stats
 * @desc    Get event RSVP statistics
 * @access  Public
 */
router.get(
  "/event/:eventId/stats",
  getEventRSVPStats
);

/**
 * @route   GET /api/rsvp/event/:eventId/attendees
 * @desc    Get event attendees list
 * @access  Public
 */
router.get(
  "/event/:eventId/attendees",
  validateGetEventAttendees,
  validationMiddleware,
  getEventAttendees
);

/**
 * @route   GET /api/rsvp/event/:eventId/availability
 * @desc    Check event availability for RSVP
 * @access  Public
 */
router.get(
  "/event/:eventId/availability",
  checkEventAvailability
);

/**
 * @route   POST /api/rsvp/waitlist/join
 * @desc    Join event waitlist
 * @access  Private
 */
router.post(
  "/waitlist/join",
  protect,
  validateJoinWaitlist,
  validationMiddleware,
  joinWaitlist
);

/**
 * @route   GET /api/rsvp/waitlist/:eventId/position
 * @desc    Get user's waitlist position for event
 * @access  Private
 */
router.get(
  "/waitlist/:eventId/position",
  protect,
  getWaitlistPosition
);

/**
 * @route   POST /api/rsvp/send-email
 * @desc    Send RSVP email (confirmation, reminder)
 * @access  Private
 */
router.post(
  "/send-email",
  protect,
  validateSendEmail,
  validationMiddleware,
  sendRSVPEmail
);

/**
 * @route   POST /api/rsvp/send-reminder
 * @desc    Send reminder emails to all event attendees
 * @access  Private (Admin only)
 */
router.post(
  "/send-reminder",
  protect,
  validateSendReminder,
  validationMiddleware,
  sendEventReminder
);

/**
 * @route   GET /api/rsvp/:id/calendar/public
 * @desc    Download calendar invitation for RSVP (Public with token)
 * @access  Public
 */
router.get(
  "/:id/calendar/public",
  downloadPublicCalendarInvitation
);

/**
 * @route   GET /api/rsvp/:id/calendar
 * @desc    Download calendar invitation for RSVP
 * @access  Private
 */
router.get(
  "/:id/calendar",
  protect,
  downloadCalendarInvitation
);

/**
 * @route   GET /api/rsvp/:id/calendar-links
 * @desc    Get all calendar links for RSVP
 * @access  Private
 */
router.get(
  "/:id/calendar-links",
  protect,
  getCalendarLinks
);

/**
 * @route   GET /api/rsvp/:rsvpId/email-debug
 * @desc    Debug RSVP email status and configuration
 * @access  Private
 */
router.get(
  "/:rsvpId/email-debug",
  protect,
  debugRSVPEmail
);

/**
 * @route   POST /api/rsvp/:rsvpId/resend-email
 * @desc    Resend RSVP confirmation email for debugging
 * @access  Private
 */
router.post(
  "/:rsvpId/resend-email",
  protect,
  validateResendEmail,
  validationMiddleware,
  resendRSVPEmail
);

/**
 * @route   GET /api/rsvp/debug/current-user
 * @desc    Get current user info for debugging
 * @access  Private
 */
router.get(
  "/debug/current-user",
  protect,
  debugCurrentUser
);

export default router;
