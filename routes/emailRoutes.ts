import { Router } from "express";

import {
  sendBulkEmail,
  getSMTPStatus,
  sendBasicEmail,
  sendGuideSubmissionEmail,
  sendPartnerProgramSubmissionEmail,
  sendScholarsProgramSubmissionEmail,
  sendDiversityTrackerSubmissionEmail,
} from "../controllers/emailController";

import {
  validateBasicEmail,
  validateBulkEmail,
  validateGuideSubmission,
  validateDiversityTracker,
  validatePartnerSubmission,
  validateScholarsSubmission,
} from "../validators/emailValidation";

import validationMiddleware from "../middleware/validationMiddleware";

const router = Router();

/**
 * @route   GET /api/email/smtp-status
 * @desc    Get SMTP status for all email types
 * @access  Private (Admin only)
 */
router.get("/smtp-status", getSMTPStatus);

/**
 * @route   POST /api/email/basic
 * @desc    Send basic email
 * @access  Public
 */
router.post("/basic", validateBasicEmail, validationMiddleware, sendBasicEmail);

/**
 * @route   POST /api/email/partners
 * @desc    Process partner program form submission
 * @access  Public
 */
router.post(
  "/partners",
  validatePartnerSubmission,
  validationMiddleware,
  sendPartnerProgramSubmissionEmail
);

/**
 * @route   POST /api/email/scholars
 * @desc    Process scholars program form submission
 * @access  Public
 */
router.post(
  "/scholars",
  validateScholarsSubmission,
  validationMiddleware,
  sendScholarsProgramSubmissionEmail
);

/**
 * @route   POST /api/email/guides
 * @desc    Process guide form submission
 * @access  Public
 */
router.post(
  "/guides",
  validateGuideSubmission,
  validationMiddleware,
  sendGuideSubmissionEmail
);

/**
 * @route   POST /api/email/diversity-tracker
 * @desc    Process diversity tracker form submission
 * @access  Public
 */
router.post(
  "/diversity-tracker",
  validateDiversityTracker,
  validationMiddleware,
  sendDiversityTrackerSubmissionEmail
);

/**
 * @route   POST /api/email/bulk
 * @desc    Send bulk emails
 * @access  Private (Admin only)
 */
router.post("/bulk", validateBulkEmail, validationMiddleware, sendBulkEmail);

export default router;
