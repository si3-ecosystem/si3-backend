"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailController_1 = require("../controllers/emailController");
const emailValidation_1 = require("../validators/emailValidation");
const validationMiddleware_1 = __importDefault(require("../middleware/validationMiddleware"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/email/smtp-status
 * @desc    Get SMTP status for all email types
 * @access  Private (Admin only)
 */
router.get("/smtp-status", emailController_1.getSMTPStatus);
/**
 * @route   POST /api/email/basic
 * @desc    Send basic email
 * @access  Public
 */
router.post("/basic", emailValidation_1.validateBasicEmail, validationMiddleware_1.default, emailController_1.sendBasicEmail);
/**
 * @route   POST /api/email/partners
 * @desc    Process partner program form submission
 * @access  Public
 */
router.post("/partners", emailValidation_1.validatePartnerSubmission, validationMiddleware_1.default, emailController_1.sendPartnerProgramSubmissionEmail);
/**
 * @route   POST /api/email/scholars
 * @desc    Process scholars program form submission
 * @access  Public
 */
router.post("/scholars", emailValidation_1.validateScholarsSubmission, validationMiddleware_1.default, emailController_1.sendScholarsProgramSubmissionEmail);
/**
 * @route   POST /api/email/guides
 * @desc    Process guide form submission
 * @access  Public
 */
router.post("/guides", emailValidation_1.validateGuideSubmission, validationMiddleware_1.default, emailController_1.sendGuideSubmissionEmail);
/**
 * @route   POST /api/email/diversity-tracker
 * @desc    Process diversity tracker form submission
 * @access  Public
 */
router.post("/diversity-tracker", emailValidation_1.validateDiversityTracker, validationMiddleware_1.default, emailController_1.sendDiversityTrackerSubmissionEmail);
/**
 * @route   POST /api/email/bulk
 * @desc    Send bulk emails
 * @access  Private (Admin only)
 */
router.post("/bulk", emailValidation_1.validateBulkEmail, validationMiddleware_1.default, emailController_1.sendBulkEmail);
exports.default = router;
