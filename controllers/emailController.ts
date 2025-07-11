import { Request, Response, NextFunction } from "express";

import Guide from "../models/guidesModel";
import PartnerProgramModel from "../models/partnersModel";
import ScholarsProgramModel from "../models/scholarsModel";

import catchAsync from "../utils/catchAsync";

import emailService, { EmailType } from "../config/protonMail";

import {
  guidesReplyTemplate,
  partnerReplyTemplate,
  scholarsReplyTemplate,
  guidesSubmissionTemplate,
  diversityTrackerTemplate,
  partnerSubmissionTemplate,
  scholarsSubmissionTemplate,
} from "../utils/emailTemplates";
import AppError from "../utils/AppError";

interface FormSubmissionRequest extends Request {
  body: {
    formData: any;
  };
}

interface ScholarsFormData {
  name: string;
  email: string;
  details?: string;
  interests: string[] | string;
  newsletter: string | boolean;
}

interface GuideFormData {
  name: string;
  email: string;
  interests: string[];
  digitalLink: string;
  daoInterests: string;
  personalValues: string;
}

interface PartnerFormData {
  name: string;
  email: string;
  details?: string;
  companyName: string;
  newsletter: boolean;
  interests: string[] | string;
}

interface DiversityFormData {
  ageRange: string;
  ethnicity: string;
  disability: string;
  equityScale: string;
  grantRound?: string;
  hasRoadmap: boolean;
  diverseTeam: string;
  uniqueValue: string;
  selfIdentity: string;
  suggestions?: string;
  marketImpact: string;
  grantProvider?: string;
  grantExperience?: string;
  sexualOrientation: string;
  reportsFinancials: boolean;
  runsGrantPrograms: boolean;
  selfIdentityCustom?: string;
  claritySuggestions?: string;
  engagementChannels: string[];
  diversityInitiatives: string;
  improvementSuggestions?: string;
  grantRoundParticipation?: string;
  activeGrantsParticipated?: string;
  underrepresentedLeadership: string;
  highlightsUnderrepresented: string;
  offeringClear: "Yes" | "No" | "Somewhat";
  decentralizedDecisionMaking: "Yes" | "No" | "Unsure";
}

interface BulkEmailRequest extends Request {
  body: {
    subject: string;
    htmlContent: string;
    senderName?: string;
    emailType?: EmailType;
    recipients: Array<{ email: string; name?: string }>;
  };
}

interface BasicEmailRequest extends Request {
  body: {
    cc?: string[];
    toName: string;
    bcc?: string[];
    toEmail: string;
    subject: string;
    htmlContent: string;
  };
}

/**
 * Test SMTP connections for all email types
 *
 * @route   GET /api/email/test-connections
 * @desc    Test SMTP connections for debugging and monitoring
 * @access  Private (Admin only)
 * @method  GET
 *
 * @returns {Object} Response object
 * @returns {string} returns.status - "success" or "error"
 * @returns {string} returns.message - Description message
 * @returns {Object} returns.results - Connection test results for each email type
 * @returns {Object} returns.smtpStatus - SMTP configuration status
 *
 * @example
 * // Request
 * GET /api/email/test-connections
 *
 * // Response
 * {
 *   "status": "success",
 *   "message": "SMTP connection tests completed",
 *   "results": {
 *     "basic": true,
 *     "guide": true,
 *     "partner": false,
 *     "diversity": true
 *   },
 *   "smtpStatus": {
 *     "kara": { "hasUsername": true, "hasToken": true, "isConfigured": true },
 *     "partners": { "hasUsername": true, "hasToken": false, "isConfigured": false }
 *   }
 * }
 */

export const getSMTPStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const smtpStatus = emailService.getSMTPStatus();

    res.status(200).json({
      status: "success",
      message: "SMTP status retrieved",
      smtpStatus,
      environmentCheck: {
        SMTP_USERNAME_KARA: !!process.env.SMTP_USERNAME_KARA,
        SMTP_TOKEN_KARA: !!process.env.SMTP_TOKEN_KARA,
        SMTP_USERNAME_SCHOLARS: !!process.env.SMTP_USERNAME_SCHOLARS,
        SMTP_TOKEN_SCHOLARS: !!process.env.SMTP_TOKEN_SCHOLARS,
        SMTP_SERVER: process.env.SMTP_SERVER,
        SMTP_PORT: process.env.SMTP_PORT,
      },
    });
  }
);

/**
 * Send basic email using Kara's SMTP
 *
 * @route   POST /api/email/basic
 * @desc    Send a basic email using Kara's SMTP configuration
 * @access  Public
 * @method  POST
 *
 * @param   {Object} req.body - Request body
 * @param   {string} req.body.toEmail - Recipient email address (required)
 * @param   {string} req.body.toName - Recipient name (required)
 * @param   {string} req.body.subject - Email subject (required)
 * @param   {string} req.body.htmlContent - Email HTML content (required)
 * @param   {string[]} [req.body.cc] - CC recipients (optional)
 * @param   {string[]} [req.body.bcc] - BCC recipients (optional)
 *
 * @returns {Object} Response object
 * @returns {string} returns.status - "success" or "error"
 * @returns {string} returns.message - Success message
 * @returns {Object} returns.result - Email sending result with messageId
 *
 * @throws  {AppError} 400 - Missing required fields
 * @throws  {AppError} 503 - Email service unavailable
 *
 * @example
 * // Request
 * POST /api/email/basic
 * {
 *   "toEmail": "recipient@example.com",
 *   "toName": "John Doe",
 *   "subject": "Welcome to SI<3>",
 *   "htmlContent": "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
 *   "cc": ["manager@example.com"],
 *   "bcc": ["admin@si3.space"]
 * }
 *
 * // Response
 * {
 *   "status": "success",
 *   "message": "Email sent successfully",
 *   "result": {
 *     "success": true,
 *     "messageId": "abc123-def456",
 *     "smtpUsed": "kara"
 *   }
 * }
 */

export const sendBasicEmail = catchAsync(
  async (req: BasicEmailRequest, res: Response, next: NextFunction) => {
    const { toEmail, toName, subject, htmlContent, cc, bcc } = req.body;

    const result = await emailService.sendEmail({
      senderName: "SI<3>",
      senderEmail: emailService.getSenderEmail("basic"),
      toName,
      toEmail,
      subject,
      htmlContent,
      cc,
      bcc,
      emailType: "basic",
    });

    res.status(200).json({
      status: "success",
      message: "Email sent successfully",
      result,
    });
  }
);

/**
 * Send bulk emails
 *
 * @route   POST /api/email/bulk
 * @desc    Send bulk emails
 * @access  Public
 * @method  POST
 *
 * @param   {Object} req.body - Request body
 * @param   {Array<{ email: string; name?: string }>} req.body.recipients - Array of recipients (required)
 * @param   {string} req.body.subject - Email subject (required)
 * @param   {string} req.body.htmlContent - Email HTML content (required)
 * @param   {string} [req.body.senderName] - Sender name (optional)
 * @param   {string} [req.body.emailType] - Email type (optional)
 *
 * @returns {Object} Response object
 * @returns {string} returns.status - "success" or "error"
 * @returns {string} returns.message - Success message
 * @returns {Object} returns.result - Email sending result with messageId
 *
 * @throws  {AppError} 400 - Missing required fields
 * @throws  {AppError} 503 - Email service unavailable
 */

export const sendBulkEmail = catchAsync(
  async (req: BulkEmailRequest, res: Response, next: NextFunction) => {
    const {
      recipients,
      subject,
      htmlContent,
      senderName = "SI<3>",
      emailType = "basic",
    } = req.body;

    const bulkResult = await emailService.sendBulkEmails(
      recipients,
      subject,
      htmlContent,
      emailType,
      senderName
    );

    res.status(200).json({
      status: "success",
      message: `Bulk email completed. ${bulkResult.summary.sent} sent, ${bulkResult.summary.failed} failed`,
      ...bulkResult,
    });
  }
);

/**
 * Send diversity tracker submission email using Kara's SMTP
 *
 * @route   POST /api/email/diversity-tracker
 * @desc    Process diversity tracker form submission, save to database, and send notification email
 * @access  Public
 * @method  POST
 * @validation Uses validateDiversityMail middleware
 *
 * @param   {Object} req.body - Request body
 * @param   {Object} req.body.formData - Form data object (required)
 * @param   {string} req.body.formData.selfIdentity - Self identity (required)
 * @param   {string} [req.body.formData.selfIdentityCustom] - Custom identity (optional)
 * @param   {string} req.body.formData.ageRange - Age range (required)
 * @param   {string|string[]} req.body.formData.ethnicity - Ethnicity (required)
 * @param   {string|string[]} req.body.formData.disability - Disability status (required)
 * @param   {string} req.body.formData.sexualOrientation - Sexual orientation (required)
 * @param   {number} req.body.formData.equityScale - Equity scale 1-10 (required)
 * @param   {string} [req.body.formData.improvementSuggestions] - Improvement suggestions (optional)
 * @param   {string} [req.body.formData.grantProvider] - Grant provider (optional)
 * @param   {string} [req.body.formData.grantRound] - Grant round (optional)
 * @param   {string} req.body.formData.offeringClear - Organization clarity: "Yes"|"No"|"Somewhat" (required)
 * @param   {string} req.body.formData.decentralizedDecisionMaking - Decision making: "Yes"|"No"|"Unsure" (required)
 * @param   {string} req.body.formData.uniqueValue - Unique value proposition (required, 10-1000 chars)
 * @param   {string} req.body.formData.marketImpact - Market impact description (required, 10-1000 chars)
 *
 * @returns {Object} Response object
 * @returns {string} returns.status - "success" or "error"
 * @returns {string} returns.message - Success message
 * @returns {Object} returns.result - Email sending result
 *
 * @throws  {AppError} 400 - Missing form data or validation errors
 * @throws  {AppError} 500 - Database save error
 * @throws  {AppError} 503 - Email service unavailable
 *
 * @example
 * // Request
 * POST /api/email/diversity-tracker
 * {
 *   "formData": {
 *     "selfIdentity": "Woman",
 *     "ageRange": "25-34",
 *     "ethnicity": ["Asian", "Hispanic"],
 *     "disability": "No",
 *     "sexualOrientation": "Heterosexual",
 *     "equityScale": 7,
 *     "offeringClear": "Yes",
 *     "decentralizedDecisionMaking": "Unsure",
 *     "uniqueValue": "We provide innovative solutions for...",
 *     "marketImpact": "Our impact on the market includes..."
 *   }
 * }
 *
 * // Response
 * {
 *   "status": "success",
 *   "message": "Diversity tracker submission saved and email sent successfully",
 *   "result": {
 *     "success": true,
 *     "messageId": "xyz789-abc123",
 *     "smtpUsed": "kara"
 *   }
 * }
 */

export const sendDiversityTrackerSubmissionEmail = catchAsync(
  async (req: FormSubmissionRequest, res: Response, next: NextFunction) => {
    const { formData } = req.body;

    if (!formData) {
      return next(new AppError("Missing form data", 400));
    }

    const data = formData as DiversityFormData;

    // await DiversityTrackerModel.create(data);

    // Convert DiversityFormData to DiversityFormData format for the template
    const templateData: DiversityFormData = {
      selfIdentity: data.selfIdentity,
      selfIdentityCustom: data.selfIdentityCustom,
      ageRange: data.ageRange,
      ethnicity: data.ethnicity,
      disability: data.disability,
      sexualOrientation: data.sexualOrientation,
      equityScale: data.equityScale,
      improvementSuggestions: data.improvementSuggestions,
      grantProvider: data.grantProvider,
      grantRound: data.grantRound,
      suggestions: data.suggestions,
      activeGrantsParticipated: data.activeGrantsParticipated,
      offeringClear: data.offeringClear,
      claritySuggestions: data.claritySuggestions,
      engagementChannels: data.engagementChannels,
      decentralizedDecisionMaking: data.decentralizedDecisionMaking,
      hasRoadmap: data.hasRoadmap,
      reportsFinancials: data.reportsFinancials,
      runsGrantPrograms: data.runsGrantPrograms,
      grantRoundParticipation: data.grantRoundParticipation,
      grantExperience: data.grantExperience,
      diversityInitiatives: data.diversityInitiatives,
      diverseTeam: data.diverseTeam,
      underrepresentedLeadership: data.underrepresentedLeadership,
      highlightsUnderrepresented: data.highlightsUnderrepresented,
      uniqueValue: data.uniqueValue,
      marketImpact: data.marketImpact,
    };

    // Generate notification email content for internal team (admin)
    const adminNotificationHtml = diversityTrackerTemplate(templateData);

    // Send notification email to admin using Kara's SMTP (diversity uses basic)
    const adminNotificationResult = await emailService.sendEmail({
      senderName: "SI<3>",
      senderEmail: emailService.getSenderEmail("diversity"),
      toName: "SI<3> Team",
      toEmail: "kara@si3.space",
      subject: "New Diversity Tracker Submission",
      htmlContent: adminNotificationHtml,
      emailType: "diversity", // Uses Kara's SMTP
    });

    res.status(200).json({
      status: "success",
      message: "Diversity tracker submission processed successfully",
      result: {
        adminNotification: adminNotificationResult,
      },
      note: "Database save was skipped due to connection issues. No confirmation email sent (anonymous form).",
    });
  }
);

/**
 * Send scholars submission email using Scholars SMTP
 *
 * @route   POST /api/email/scholars
 * @desc    Process scholars form submission, save to database, and send notification + confirmation emails
 * @access  Public
 * @method  POST
 * @validation Uses validateScholarsSubmission middleware
 *
 * @param   {Object} req.body - Request body
 * @param   {Object} req.body.formData - Form data object (required)
 * @param   {string} req.body.formData.name - Full name (required, 2-100 chars)
 * @param   {string} req.body.formData.email - Email address (required, valid email)
 * @param   {string[]|string} req.body.formData.interests - Interests array or string (required)
 * @param   {string} [req.body.formData.details] - Additional details (optional, max 1000 chars)
 * @param   {string|boolean} req.body.formData.newsletter - Newsletter subscription: "yes"|"no" or boolean (required)
 *
 * @returns {Object} Response object
 * @returns {string} returns.status - "success" or "error"
 * @returns {string} returns.message - Success message
 * @returns {Object} returns.result - Email sending results for both notification and confirmation
 *
 * @throws  {AppError} 400 - Missing form data or validation errors
 * @throws  {AppError} 500 - Database save error
 * @throws  {AppError} 503 - Email service unavailable
 *
 * @example
 * // Request
 * POST /api/email/scholars
 * {
 *   "formData": {
 *     "name": "Sarah Johnson",
 *     "email": "sarah.johnson@university.edu",
 *     "interests": ["Research", "Blockchain Technology", "Academic Writing"],
 *     "details": "I am a PhD student interested in blockchain research and would love to contribute to the SI<3> scholars program...",
 *     "newsletter": "yes"
 *   }
 * }
 *
 * // Response
 * {
 *   "status": "success",
 *   "message": "Scholars program application submitted and emails sent successfully",
 *   "result": {
 *     "notification": {
 *       "success": true,
 *       "messageId": "scholars123-notify",
 *       "smtpUsed": "scholars"
 *     },
 *     "confirmation": {
 *       "success": true,
 *       "messageId": "scholars123-confirm",
 *       "smtpUsed": "scholars"
 *     }
 *   }
 * }
 */

export const sendScholarsSubmissionEmail = catchAsync(
  async (req: FormSubmissionRequest, res: Response, next: NextFunction) => {
    const { formData } = req.body;

    if (!formData) {
      return next(new AppError("Missing form data", 400));
    }

    const data = formData as ScholarsFormData;

    // Validate required fields
    if (!data.name || !data.email || !data.interests) {
      return next(
        new AppError("Missing required fields: name, email, interests", 400)
      );
    }

    // Create a new scholar application with normalized data
    const scholarData = {
      name: data.name,
      email: data.email,
      details: data.details || "",
      newsletter: data.newsletter === "yes" || data.newsletter === true,
      interests: Array.isArray(data.interests)
        ? data.interests
        : [data.interests],
    };

    // Save to database
    await ScholarsProgramModel.create(scholarData);

    // Generate notification email content for internal team (admin)
    const adminNotificationHtml = scholarsSubmissionTemplate(scholarData);

    // Send notification email to admin using Scholars SMTP
    const adminNotificationResult = await emailService.sendEmail({
      senderName: "SI U Scholars",
      senderEmail: emailService.getSenderEmail("scholars"),
      toName: "SI U Team",
      toEmail: "kara@si3.space",
      subject: `New SI U Scholar Submission: ${data.name}`,
      htmlContent: adminNotificationHtml,
      emailType: "scholars",
    });

    // Generate confirmation email content for the applicant
    const applicantConfirmationHtml = scholarsReplyTemplate(scholarData);

    // Send confirmation email to the applicant using Scholars SMTP
    const applicantConfirmationResult = await emailService.sendEmail({
      senderName: "SI U Scholars",
      senderEmail: emailService.getSenderEmail("scholars"),
      toName: data.name,
      toEmail: data.email,
      subject: "Thank you for joining our waitlist as a Scholar!",
      htmlContent: applicantConfirmationHtml,
      emailType: "scholars",
    });

    res.status(200).json({
      status: "success",
      message:
        "Scholars program application submitted and emails sent successfully",
      result: {
        adminNotification: adminNotificationResult,
        applicantConfirmation: applicantConfirmationResult,
      },
    });
  }
);

/**
 * Send partner submission email using Partners SMTP
 *
 * @route   POST /api/email/partners
 * @desc    Process partner form submission, save to database, and send notification email
 * @access  Public
 * @method  POST
 * @validation Uses validatePartnerSubmission middleware
 *
 * @param   {Object} req.body - Request body
 * @param   {Object} req.body.formData - Form data object (required)
 * @param   {string} req.body.formData.name - Full name (required, 2-100 chars)
 * @param   {string} req.body.formData.email - Email address (required, valid email)
 * @param   {string} req.body.formData.companyName - Company name (required, 2-200 chars)
 * @param   {string[]|string} req.body.formData.interests - Interests array or string (required)
 * @param   {string} [req.body.formData.details] - Additional details (optional, max 1000 chars)
 * @param   {boolean} req.body.formData.newsletter - Newsletter subscription preference (required)
 *
 * @returns {Object} Response object
 * @returns {string} returns.status - "success" or "error"
 * @returns {string} returns.message - Success message
 * @returns {Object} returns.result - Email sending result
 *
 * @throws  {AppError} 400 - Missing form data, email, name, or validation errors
 * @throws  {AppError} 500 - Database save error
 * @throws  {AppError} 503 - Email service unavailable
 *
 * @example
 * // Request
 * POST /api/email/partners
 * {
 *   "formData": {
 *     "name": "Alex Johnson",
 *     "email": "alex@techcorp.com",
 *     "companyName": "TechCorp Solutions",
 *     "interests": ["Partnership", "Collaboration", "Innovation"],
 *     "details": "We are interested in exploring partnership opportunities...",
 *     "newsletter": true
 *   }
 * }
 *
 * // Response
 * {
 *   "status": "success",
 *   "message": "Partner program submission saved and email sent successfully",
 *   "result": {
 *     "success": true,
 *     "messageId": "partner456-def012",
 *     "smtpUsed": "partners"
 *   }
 * }
 */

export const sendPartnerSubmissionEmail = catchAsync(
  async (req: FormSubmissionRequest, res: Response, next: NextFunction) => {
    const { formData } = req.body;

    if (!formData || !formData.email || !formData.name) {
      return next(new AppError("Missing form data, email, or name", 400));
    }

    const data = formData as PartnerFormData;

    await PartnerProgramModel.create(data);

    // Generate notification email content for internal team (admin)
    const adminNotificationHtml = partnerSubmissionTemplate(data);

    // Send notification email to admin using Partners SMTP
    const adminNotificationResult = await emailService.sendEmail({
      senderName: "SI<3>",
      senderEmail: emailService.getSenderEmail("partner"),
      toName: "SI<3> Team",
      toEmail: "kara@si3.space",
      subject: `New SI<3> Partner Inquiry: ${data.name} - ${
        data.companyName || "Company Name"
      }`,
      htmlContent: adminNotificationHtml,
      emailType: "partner",
    });

    // Generate confirmation email content for the applicant
    const applicantConfirmationHtml = partnerReplyTemplate(data);

    // Send confirmation email to the applicant using Partners SMTP
    const applicantConfirmationResult = await emailService.sendEmail({
      senderName: "SI<3> Partners",
      senderEmail: emailService.getSenderEmail("partner"),
      toName: data.name,
      toEmail: data.email,
      subject: "Thank you for your inquiry!",
      htmlContent: applicantConfirmationHtml,
      emailType: "partner",
    });

    res.status(200).json({
      status: "success",
      message: "Partner program submission saved and emails sent successfully",
      result: {
        adminNotification: adminNotificationResult,
        applicantConfirmation: applicantConfirmationResult,
      },
      note: "Database save was skipped due to connection issues",
    });
  }
);

/**
 * Send guide submission email using Guides SMTP
 *
 * @route   POST /api/email/guides
 * @desc    Process guide form submission, save to database, and send notification email
 * @access  Public
 * @method  POST
 * @validation Uses validateGuideSubmission middleware
 *
 * @param   {Object} req.body - Request body
 * @param   {Object} req.body.formData - Form data object (required)
 * @param   {string} req.body.formData.name - Full name (required, 1-100 chars)
 * @param   {string} req.body.formData.email - Email address (required, valid email)
 * @param   {string} req.body.formData.daoInterests - DAO interests (required, 1-100 chars)
 * @param   {string[]} req.body.formData.interests - Array of interests (required, min 1 item)
 * @param   {string} req.body.formData.personalValues - Personal values (required, 1-2000 chars)
 * @param   {string} req.body.formData.digitalLink - Digital profile link (required, valid URL)
 *
 * @returns {Object} Response object
 * @returns {string} returns.status - "success" or "error"
 * @returns {string} returns.message - Success message
 * @returns {Object} returns.result - Email sending result
 *
 * @throws  {AppError} 400 - Missing form data, email, name, or validation errors
 * @throws  {AppError} 500 - Database save error
 * @throws  {AppError} 503 - Email service unavailable
 *
 * @example
 * // Request
 * POST /api/email/guides
 * {
 *   "formData": {
 *     "name": "Jane Smith",
 *     "email": "jane.smith@example.com",
 *     "daoInterests": "DeFi and Governance",
 *     "interests": ["Blockchain", "Community Building", "Education"],
 *     "personalValues": "I believe in transparency, inclusivity, and innovation...",
 *     "digitalLink": "https://linkedin.com/in/janesmith"
 *   }
 * }
 *
 * // Response
 * {
 *   "status": "success",
 *   "message": "Guide submission saved and email sent successfully",
 *   "result": {
 *     "success": true,
 *     "messageId": "guide123-abc789",
 *     "smtpUsed": "guides"
 *   }
 * }
 */

export const sendGuideSubmissionEmail = catchAsync(
  async (req: FormSubmissionRequest, res: Response, next: NextFunction) => {
    const { formData } = req.body;

    if (!formData || !formData.email || !formData.name) {
      return next(new AppError("Missing form data, email, or name", 400));
    }

    const data = formData as GuideFormData;

    // Save to database
    await Guide.create(formData);

    // Generate notification email content for internal team (admin)
    const adminNotificationHtml = guidesSubmissionTemplate(data);

    // Send notification email to admin using Guides SMTP
    const adminNotificationResult = await emailService.sendEmail({
      senderName: "SI Her Guides",
      senderEmail: emailService.getSenderEmail("guide"),
      toName: "SI Her Team",
      toEmail: "kara@si3.space",
      subject: `New Si Her Guide Application: ${data.name}`,
      htmlContent: adminNotificationHtml,
      emailType: "guide",
    });

    // Generate confirmation email content for the applicant
    const applicantConfirmationHtml = guidesReplyTemplate(data);

    // Send confirmation email to the applicant using Guides SMTP
    const applicantConfirmationResult = await emailService.sendEmail({
      senderName: "SI Her Guides",
      senderEmail: emailService.getSenderEmail("guide"),
      toName: data.name,
      toEmail: data.email,
      subject: "Thank you for your applying to be a Si Her Guide!",
      htmlContent: applicantConfirmationHtml,
      emailType: "guide",
    });

    res.status(200).json({
      status: "success",
      message: "Guide submission saved and emails sent successfully",
      result: {
        adminNotification: adminNotificationResult,
        applicantConfirmation: applicantConfirmationResult,
      },
    });
  }
);
