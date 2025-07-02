// import AppError from "../utils/AppError.js";
// import catchAsync from "../utils/catchAsync.js";

// import {
//   tempMail,
//   guideEmailTemplate,
//   partnerProgramEmailTemplate,
//   diversityTrackerEmailTemplate,
// } from "../utils/emailTemplates.js";
// import { sendTransactionalEmail } from "../utils/sendEthermail.js";

// import PartnerProgramModel from "../models/partnerProgramModel.js";
// import DiversityTrackerModel from "../models/diversityTrackerModel.js";

// import Guide from "../models/guideModel.js";

// export const sendBasicEmail = catchAsync(async (req, res, next) => {
//   const { toEmail, toName, subject, htmlContent } = req.body;

//   if (!toEmail || !toName || !subject || !htmlContent) {
//     return next(new AppError("Missing required fieldes!", 400));
//   }

//   const result = await sendTransactionalEmail({
//     senderName: "SI<3>",
//     senderEmail: "members@si3.space",
//     toName,
//     toEmail,
//     subject,
//     htmlContent,
//     mergeData: {},
//   });

//   res.status(200).json({
//     status: "success",
//     message: "Email sent successfully",
//     result,
//   });
// });

// export const sendDiversityTrackerSubmissionEmail = catchAsync(
//   async (req, res, next) => {
//     const { formData } = req.body;

//     if (!formData) {
//       return next(new AppError("Missing form data", 400));
//     }

//     await DiversityTrackerModel.create(formData);

//     const htmlContent = diversityTrackerEmailTemplate(formData);

//     // 3. Send the email
//     await sendTransactionalEmail({
//       senderName: "SI<3>",
//       senderEmail: "members@si3.space",
//       toName: "Kara",
//       toEmail: "kara@si3.space",
//       subject: "New Diversity Tracker Submission",
//       htmlContent,
//       mergeData: {
//         username: "Member",
//         welcome_link: "https://si3.space/diversity-tracker",
//       },
//     });

//     res.status(200).json({
//       status: "success",
//       message: "Diversity tracker submission saved and email sent successfully",
//     });
//   }
// );

// export const sendGuideSubmissionEmail = catchAsync(async (req, res, next) => {
//   const { formData } = req.body;

//   if (!formData || !formData.email || !formData.name) {
//     return next(new AppError("Missing form data or email or name", 400));
//   }

//   // 1. Save to MongoDB
//   await Guide.create(formData);

//   // 2. Generate HTML content
//   const htmlContent = guideEmailTemplate(formData);

//   // 3. Send the email
//   await sendTransactionalEmail({
//     senderName: "SI<3>",
//     senderEmail: "members@si3.space",
//     toName: "Kara",
//     toEmail: "kara@si3.space",
//     subject: "New Guide Submission",
//     htmlContent,
//     mergeData: {
//       username: formData.name,
//       welcome_link: "https://si3.space/guides",
//     },
//   });

//   res.status(200).json({
//     status: "success",
//     message: "Guide submission saved and email sent successfully",
//   });
// });

// export const sendPartnerProgramSubmissionEmail = catchAsync(
//   async (req, res, next) => {
//     const { formData } = req.body;

//     if (!formData || !formData.email || !formData.name) {
//       return next(new AppError("Missing form data or email or name", 400));
//     }

//     // 1. Save to MongoDB
//     await PartnerProgramModel.create(formData);

//     // 2. Generate HTML content (after saving to DB)
//     const htmlContent = partnerProgramEmailTemplate(formData);

//     // 3. Send the email
//     await sendTransactionalEmail({
//       senderName: "SI<3>",
//       senderEmail: "members@si3.space",
//       toName: "Kara",
//       toEmail: "kara@si3.space",
//       subject: "New Partner Program Submission",
//       htmlContent,
//       mergeData: {
//         username: formData.name,
//         welcome_link: "https://si3.space/partner-program",
//       },
//     });

//     res.status(200).json({
//       status: "success",
//       message: "Partner program submission saved and email sent successfully",
//     });
//   }
// );

// export const sendTempEmail = catchAsync(async (req, res, next) => {
//   // 2. Generate HTML content (after saving to DB)
//   const htmlContent = tempMail();

//   // 3. Send the email
//   await sendTransactionalEmail({
//     senderName: "SI<3>",
//     senderEmail: "members@si3.space",
//     toName: "Kara Howard",
//     toEmail: "kara@si3.space",
//     bcc: [
//       { name: "Catie Romero-Finger", email: "catie@babslabs.io" },
//       { name: "Nastya Adamova", email: "nastya@babslabs.io" },
//       { name: "Sam", email: "notsamana@gmail.com" },
//       { name: "Carina Schuster", email: "schustercarina18@gmail.com" },
//       { name: "Sandy Martinez", email: "smarti1733@gmail.com" },
//       { name: "Pooja Ranjan", email: "pooja@ethcatherders.com" },
//       { name: "Paris Dufrayer", email: "paris.dufrayer@gmail.com" },
//       { name: "Brenda Hidalgo", email: "hidalgogeldresb@gmail.com" },
//       { name: "Lilian Santos", email: "liliop.eth@gmail.com" },
//       { name: "Raine", email: "raine.web3@gmail.com" },
//       { name: "V Divya vara Lakshmi", email: "vdivyavaralakshmi@gmail.com" },
//       { name: "Sabrina Goerlich", email: "Sabrina@designsprintstudio.com" },
//       { name: "Veets", email: "veets@BOOGLE.rip" },
//       { name: "Ashley Wright", email: "info@thewrightsuccess.com" },
//       { name: "Danielle Marie", email: "hello@daniellemarie.xyz" },
//       { name: "Kirsten", email: "Kirsten@evewealth.com" },
//       { name: "Sadie Raney", email: "sadie@evewealth.com" },
//       { name: "Laura Leparulo", email: "laura@futuristconference.com" },
//       { name: "Paula", email: "paula@onedegreeconsulting.net" },
//       { name: "Angele", email: "angele.disruptordao@proton.me" },
//       { name: "Maria Paolicelli", email: "Mariapia.paolicelli@gmail.com" },
//       { name: "Ana Lopez", email: "ana@cryptoconexion.com" },
//       { name: "Erin Vanderberg", email: "erin@cosmoscore.xyz" },
//       { name: "Kristie Immanuel", email: "immanuelkristie@gmail.com" },
//       { name: "Sena", email: "Sena@bitfiasi.org" },
//       { name: "Stella Achenbach", email: "contact@stellaachenbach.com" },
//       { name: "Wan Wei Soh", email: "wanwei.soh@gmail.com" },
//       { name: "Gnana Lakshmi", email: "gyanlakshmi@gmail.com" },
//       { name: "Jelena", email: "318solaris@gmail.com" },
//       { name: "Alexandra Overgaag", email: "alexandra@thrilldlabs.io" },
//       { name: "Maria", email: "maria@peace-keepers.io" },
//       { name: "Hilal", email: "hilal@globalb.com.tr" },
//       { name: "Krystelle Galano", email: "telggalano022@gmail.com" },
//       { name: "Emily", email: "emily@truestars-nft.com" },
//       { name: "Kara Howard", email: "kara@si3.space" },
//       { name: "Aizhanat Zhalilova", email: "aizhanat.zhalilova@gmail.com" },
//     ],
//     subject: "SI HER GUIDES",
//     htmlContent,
//     mergeData: {
//       username: "Member",
//       welcome_link: "https://si3.space/guides",
//     },
//   });

//   res.status(200).json({
//     status: "success",
//     message: "Partner program submission saved and email sent successfully",
//   });
// });

// import AppError from "../utils/AppError.js";
// import catchAsync from "../utils/catchAsync.js";

// import {
//   tempMail,
//   guideEmailTemplate,
//   partnerProgramEmailTemplate,
//   diversityTrackerEmailTemplate,
// } from "../utils/emailTemplates.js";
// import { sendTransactionalEmail } from "../utils/sendProtonMail.js";

// import PartnerProgramModel from "../models/partnerProgramModel.js";
// import DiversityTrackerModel from "../models/diversityTrackerModel.js";

// import Guide from "../models/guideModel.js";

// export const sendBasicEmail = catchAsync(async (req, res, next) => {
//   const { toEmail, toName, subject, htmlContent } = req.body;

//   if (!toEmail || !toName || !subject || !htmlContent) {
//     return next(new AppError("Missing required fields!", 400));
//   }

//   const result = await sendTransactionalEmail({
//     senderName: "SI<3>",
//     senderEmail: "partners@si3.space",
//     toName,
//     toEmail,
//     subject,
//     htmlContent,
//   });

//   res.status(200).json({
//     status: "success",
//     message: "Email sent successfully",
//     result,
//   });
// });

// export const sendDiversityTrackerSubmissionEmail = catchAsync(
//   async (req, res, next) => {
//     const { formData } = req.body;

//     if (!formData) {
//       return next(new AppError("Missing form data", 400));
//     }

//     await DiversityTrackerModel.create(formData);

//     const htmlContent = diversityTrackerEmailTemplate(formData);

//     // Send the email
//     await sendTransactionalEmail({
//       senderName: "SI<3>",
//       senderEmail: "members@si3.space",
//       toName: "Kara",
//       toEmail: "kara@si3.space",
//       subject: "New Diversity Tracker Submission",
//       htmlContent,
//     });

//     res.status(200).json({
//       status: "success",
//       message: "Diversity tracker submission saved and email sent successfully",
//     });
//   }
// );

// export const sendGuideSubmissionEmail = catchAsync(async (req, res, next) => {
//   const { formData } = req.body;

//   if (!formData || !formData.email || !formData.name) {
//     return next(new AppError("Missing form data or email or name", 400));
//   }

//   // Save to MongoDB
//   await Guide.create(formData);

//   // Generate HTML content
//   const htmlContent = guideEmailTemplate(formData);

//   // Send the email
//   await sendTransactionalEmail({
//     senderName: "SI<3>",
//     senderEmail: "members@si3.space",
//     toName: "Kara",
//     toEmail: "kara@si3.space",
//     subject: "New Guide Submission",
//     htmlContent,
//   });

//   res.status(200).json({
//     status: "success",
//     message: "Guide submission saved and email sent successfully",
//   });
// });

// export const sendPartnerProgramSubmissionEmail = catchAsync(
//   async (req, res, next) => {
//     const { formData } = req.body;

//     if (!formData || !formData.email || !formData.name) {
//       return next(new AppError("Missing form data or email or name", 400));
//     }

//     // Save to MongoDB
//     await PartnerProgramModel.create(formData);

//     // Generate HTML content
//     const htmlContent = partnerProgramEmailTemplate(formData);

//     // Send the email
//     await sendTransactionalEmail({
//       senderName: "SI<3>",
//       senderEmail: "members@si3.space",
//       toName: "Kara",
//       toEmail: "kara@si3.space",
//       subject: "New Partner Program Submission",
//       htmlContent,
//     });

//     res.status(200).json({
//       status: "success",
//       message: "Partner program submission saved and email sent successfully",
//     });
//   }
// );

// // export const sendTempEmail = catchAsync(async (req, res, next) => {
// //   console.log("Sending temp email");

// //   // Generate HTML content
// //   const htmlContent = tempMail();

// //   // Send the email with BCC recipients
// //   await sendTransactionalEmail({
// //     senderName: "SI<3>",
// //     senderEmail: "members@si3.space",
// //     toName: "Kara Howard",
// //     toEmail: "kara@si3.space",
// //     bcc: [
// //       "catie@babslabs.io",
// //       "nastya@babslabs.io",
// //       "notsamana@gmail.com",
// //       "schustercarina18@gmail.com",
// //       "smarti1733@gmail.com",
// //       "pooja@ethcatherders.com",
// //       "paris.dufrayer@gmail.com",
// //       "hidalgogeldresb@gmail.com",
// //       "liliop.eth@gmail.com",
// //       "raine.web3@gmail.com",
// //       "vdivyavaralakshmi@gmail.com",
// //       "Sabrina@designsprintstudio.com",
// //       "veets@BOOGLE.rip",
// //       "info@thewrightsuccess.com",
// //       "hello@daniellemarie.xyz",
// //       "Kirsten@evewealth.com",
// //       "sadie@evewealth.com",
// //       "laura@futuristconference.com",
// //       "paula@onedegreeconsulting.net",
// //       "angele.disruptordao@proton.me",
// //       "Mariapia.paolicelli@gmail.com",
// //       "ana@cryptoconexion.com",
// //       "erin@cosmoscore.xyz",
// //       "immanuelkristie@gmail.com",
// //       "Sena@bitfiasi.org",
// //       "contact@stellaachenbach.com",
// //       "wanwei.soh@gmail.com",
// //       "gyanlakshmi@gmail.com",
// //       "318solaris@gmail.com",
// //       "alexandra@thrilldlabs.io",
// //       "maria@peace-keepers.io",
// //       "hilal@globalb.com.tr",
// //       "telggalano022@gmail.com",
// //       "emily@truestars-nft.com",
// //       "kara@si3.space",
// //       "aizhanat.zhalilova@gmail.com",
// //     ],
// //     subject: "SI HER GUIDES",
// //     htmlContent,
// //   });

// //   res.status(200).json({
// //     status: "success",
// //     message: "Temp email sent successfully",
// //   });
// // });

// export const sendTempEmail = catchAsync(async (req, res, next) => {
//   // Generate HTML content
//   const htmlContent = tempMail();

//   // Send the email with BCC recipients
//   await sendTransactionalEmail({
//     senderName: "SI<3>",
//     senderEmail: "partners@si3.space",
//     toName: "Kara Howard",
//     toEmail: "kara@si3.space",
//     bcc: ["ashragautam25@gmail.com"],
//     subject: "SI HER GUIDES",
//     htmlContent,
//   });

//   res.status(200).json({
//     status: "success",
//     message: "Temp email sent successfully",
//   });
// });

import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

import {
  tempMail,
  guideEmailTemplate,
  partnerProgramEmailTemplate,
  scholarsProgramEmailTemplate,
  diversityTrackerEmailTemplate,
} from "../utils/emailTemplates.js";

import {
  getSMTPStatus,
  verifyConnection,
  sendTransactionalEmail,
} from "../utils/sendProtonMail.js";

import Guide from "../models/guideModel.js";
import PartnerProgramModel from "../models/partnerProgramModel.js";
import DiversityTrackerModel from "../models/diversityTrackerModel.js";

/**
 * Test SMTP connections for all email types
 *
 * @route   GET /api/mail/test-connections
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
 * GET /api/mail/test-connections
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

const testSMTPConnections = catchAsync(async (req, res, next) => {
  const results = {};
  const emailTypes = ["basic", "guide", "partner", "diversity"];

  // Test each SMTP configuration
  for (const type of emailTypes) {
    try {
      results[type] = await verifyConnection(type);
    } catch (error) {
      results[type] = false;
    }
  }

  // Get SMTP status
  const smtpStatus = getSMTPStatus();

  res.status(200).json({
    status: "success",
    message: "SMTP connection tests completed",
    results,
    smtpStatus,
  });
});

/**
 * Send basic email using Kara's SMTP
 *
 * @route   POST /api/mail/basic
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
 * POST /api/mail/basic
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

const sendBasicEmail = catchAsync(async (req, res, next) => {
  const { toEmail, toName, subject, htmlContent, cc, bcc } = req.body;

  if (!toEmail || !toName || !subject || !htmlContent) {
    return next(
      new AppError(
        "Missing required fields: toEmail, toName, subject, htmlContent",
        400
      )
    );
  }

  const result = await sendTransactionalEmail({
    senderName: "SI<3>",
    senderEmail: "kara@si3.space",
    toName,
    toEmail,
    subject,
    htmlContent,
    cc,
    bcc,
    emailType: "basic", // Uses Kara's SMTP
  });

  res.status(200).json({
    status: "success",
    message: "Email sent successfully",
    result,
  });
});

/**
 * Send diversity tracker submission email using Kara's SMTP
 *
 * @route   POST /api/mail/diversity-tracker
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
 * POST /api/mail/diversity-tracker
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

const sendDiversityTrackerSubmissionEmail = catchAsync(
  async (req, res, next) => {
    const { formData } = req.body;

    if (!formData) {
      return next(new AppError("Missing form data", 400));
    }

    // Save to database
    await DiversityTrackerModel.create(formData);

    // Generate email content
    const htmlContent = diversityTrackerEmailTemplate(formData);

    // Send email using Kara's SMTP
    const result = await sendTransactionalEmail({
      senderName: "SI<3>",
      senderEmail: "kara@si3.space",
      toName: "Kara",
      toEmail: "kara@si3.space",
      subject: "New Diversity Tracker Submission",
      htmlContent,
      emailType: "diversity", // Uses Kara's SMTP
    });

    res.status(200).json({
      status: "success",
      message: "Diversity tracker submission saved and email sent successfully",
      result,
    });
  }
);

/**
 * Send scholars program submission email using Scholars SMTP
 *
 * @route   POST /api/mail/scholars-program
 * @desc    Process scholars program form submission, save to database, and send notification + confirmation emails
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
 * POST /api/mail/scholars-program
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

export const sendScholarsProgramSubmissionEmail = catchAsync(
  async (req, res, next) => {
    const { formData } = req.body;

    if (!formData) {
      return next(new AppError("Missing form data", 400));
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.interests) {
      return next(
        new AppError("Missing required fields: name, email, interests", 400)
      );
    }

    // Create a new scholar application with normalized data
    const scholarData = {
      name: formData.name,
      email: formData.email,
      interests: formData.interests,
      details: formData.details || "",
      newsletter: formData.newsletter === "yes" || formData.newsletter === true,
    };

    // Save to database
    await ScholarsProgram.create(scholarData);

    // Generate notification email content for internal team
    const notificationHtml = scholarsProgramEmailTemplate(scholarData);

    // Send notification email to internal team using Scholars SMTP
    const notificationResult = await sendTransactionalEmail({
      senderName: "SI<3>",
      senderEmail: "scholars@si3.space",
      toName: "SI<3> Team",
      toEmail: "kara@si3.space", // Internal notification recipient
      subject: `New Scholars Program Application: ${formData.name}`,
      htmlContent: notificationHtml,
      emailType: "scholars", // Uses Scholars SMTP
    });

    // Generate confirmation email content for the applicant
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4C1192; margin: 0; font-size: 28px;">SI<3> Scholars Program</h1>
          </div>
          
          <h2 style="color: #4C1192; margin-bottom: 20px;">Thank you for your application, ${formData.name}!</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
            We've received your Scholars Program application and are excited about your interest in joining our community of researchers and academics.
          </p>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4C1192; margin-top: 0;">What happens next?</h3>
            <ul style="color: #333; line-height: 1.6;">
              <li>Our team will review your application within 5-7 business days</li>
              <li>We'll reach out with more information about the program structure</li>
              <li>Qualified candidates will be invited for a brief interview</li>
              <li>Selected scholars will receive program details and next steps</li>
            </ul>
          </div>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
            In the meantime, feel free to explore our community resources and connect with us:
          </p>
          
          <div style="margin: 25px 0;">
            <a href="https://twitter.com/si3_ecosystem" target="_blank" 
               style="display: inline-block; margin: 5px 10px; padding: 10px 20px; background-color: #1DA1F2; color: white; text-decoration: none; border-radius: 5px;">
              Follow us on Twitter
            </a>
            <a href="https://www.linkedin.com/company/si3ecosystem/" target="_blank"
               style="display: inline-block; margin: 5px 10px; padding: 10px 20px; background-color: #0077B5; color: white; text-decoration: none; border-radius: 5px;">
              Connect on LinkedIn
            </a>
            <a href="https://www.si3.space/" target="_blank"
               style="display: inline-block; margin: 5px 10px; padding: 10px 20px; background-color: #4C1192; color: white; text-decoration: none; border-radius: 5px;">
              Visit our website
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you have any questions, please don't hesitate to reach out to us at 
              <a href="mailto:scholars@si3.space" style="color: #4C1192;">scholars@si3.space</a>
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <p style="color: #333; margin: 0;">
              Best regards,<br>
              <strong style="color: #4C1192;">The SI<3> Scholars Team</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    // Send confirmation email to the applicant using Scholars SMTP
    const confirmationResult = await sendTransactionalEmail({
      senderName: "SI<3> Scholars Program",
      senderEmail: "scholars@si3.space",
      toName: formData.name,
      toEmail: formData.email,
      subject: "Your Scholars Program Application Has Been Received",
      htmlContent: confirmationHtml,
      emailType: "scholars", // Uses Scholars SMTP
    });

    res.status(200).json({
      status: "success",
      message:
        "Scholars program application submitted and emails sent successfully",
      result: {
        notification: notificationResult,
        confirmation: confirmationResult,
      },
    });
  }
);

/**
 * Send guide submission email using Guides SMTP
 *
 * @route   POST /api/mail/guides
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
 * POST /api/mail/guides
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

const sendGuideSubmissionEmail = catchAsync(async (req, res, next) => {
  const { formData } = req.body;

  if (!formData || !formData.email || !formData.name) {
    return next(new AppError("Missing form data, email, or name", 400));
  }

  // Save to database
  await Guide.create(formData);

  // Generate email content
  const htmlContent = guideEmailTemplate(formData);

  // Send email using Guides SMTP
  const result = await sendTransactionalEmail({
    senderName: "SI<3>",
    senderEmail: "guides@si3.space",
    toName: "Kara",
    toEmail: "kara@si3.space",
    subject: "New Guide Submission",
    htmlContent,
    emailType: "guide", // Uses Guides SMTP
  });

  res.status(200).json({
    status: "success",
    message: "Guide submission saved and email sent successfully",
    result,
  });
});

/**
 * Send partner program submission email using Partners SMTP
 *
 * @route   POST /api/mail/partners-program
 * @desc    Process partner program form submission, save to database, and send notification email
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
 * POST /api/mail/partners-program
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

const sendPartnerProgramSubmissionEmail = catchAsync(async (req, res, next) => {
  const { formData } = req.body;

  if (!formData || !formData.email || !formData.name) {
    return next(new AppError("Missing form data, email, or name", 400));
  }

  // Save to database
  await PartnerProgramModel.create(formData);

  // Generate email content
  const htmlContent = partnerProgramEmailTemplate(formData);

  // Send email using Partners SMTP
  const result = await sendTransactionalEmail({
    senderName: "SI<3>",
    senderEmail: "partners@si3.space",
    toName: "Kara",
    toEmail: "kara@si3.space",
    subject: "New Partner Program Submission",
    htmlContent,
    emailType: "partner", // Uses Partners SMTP
  });

  res.status(200).json({
    status: "success",
    message: "Partner program submission saved and email sent successfully",
    result,
  });
});

/**
 * Send temporary email using Partners SMTP
 *
 * @route   POST /api/mail/temp
 * @desc    Send temporary/promotional email using Partners SMTP with BCC recipients
 * @access  Private (Admin only)
 * @method  POST
 *
 * @returns {Object} Response object
 * @returns {string} returns.status - "success" or "error"
 * @returns {string} returns.message - Success message
 * @returns {Object} returns.result - Email sending result
 *
 * @throws  {AppError} 503 - Email service unavailable
 *
 * @example
 * // Request
 * POST /api/mail/temp
 *
 * // Response
 * {
 *   "status": "success",
 *   "message": "Temp email sent successfully",
 *   "result": {
 *     "success": true,
 *     "messageId": "temp789-ghi345",
 *     "smtpUsed": "partners"
 *   }
 * }
 */

const sendTempEmail = catchAsync(async (req, res, next) => {
  // Generate email content
  const htmlContent = tempMail();

  // Send email using Partners SMTP with BCC
  const result = await sendTransactionalEmail({
    senderName: "SI<3>",
    senderEmail: "partners@si3.space",
    toName: "Kara Howard",
    toEmail: "kara@si3.space",
    bcc: ["ashragautam25@gmail.com"], // You can add more emails here
    subject: "SI HER GUIDES",
    htmlContent,
    emailType: "temp", // Uses Partners SMTP
  });

  res.status(200).json({
    status: "success",
    message: "Temp email sent successfully",
    result,
  });
});

/**
 * Send bulk emails with specified SMTP configuration
 *
 * @route   POST /api/mail/bulk
 * @desc    Send emails to multiple recipients using specified SMTP configuration
 * @access  Private (Admin only)
 * @method  POST
 *
 * @param   {Object} req.body - Request body
 * @param   {Object[]} req.body.recipients - Array of recipient objects (required, max 100)
 * @param   {string} req.body.recipients[].email - Recipient email address (required)
 * @param   {string} [req.body.recipients[].name] - Recipient name (optional, defaults to "Recipient")
 * @param   {string} req.body.subject - Email subject (required, max 200 chars)
 * @param   {string} req.body.htmlContent - Email HTML content (required, max 50000 chars)
 * @param   {string} [req.body.senderName="SI<3>"] - Sender name (optional)
 * @param   {string} [req.body.emailType="basic"] - SMTP type: "basic"|"guide"|"partner"|"diversity"|"temp" (optional)
 *
 * @returns {Object} Response object
 * @returns {string} returns.status - "success" or "error"
 * @returns {string} returns.message - Summary message
 * @returns {Object[]} returns.results - Array of successful sends
 * @returns {Object[]} returns.errors - Array of failed sends
 * @returns {Object} returns.summary - Summary statistics
 * @returns {number} returns.summary.total - Total recipients
 * @returns {number} returns.summary.sent - Successfully sent
 * @returns {number} returns.summary.failed - Failed sends
 *
 * @throws  {AppError} 400 - Missing recipients array, subject, or htmlContent
 * @throws  {AppError} 503 - Email service unavailable
 *
 * @example
 * // Request
 * POST /api/mail/bulk
 * {
 *   "recipients": [
 *     { "email": "user1@example.com", "name": "User One" },
 *     { "email": "user2@example.com", "name": "User Two" },
 *     { "email": "user3@example.com" }
 *   ],
 *   "subject": "Newsletter Update",
 *   "htmlContent": "<h1>Monthly Newsletter</h1><p>Here are the latest updates...</p>",
 *   "senderName": "SI<3> Team",
 *   "emailType": "guide"
 * }
 *
 * // Response
 * {
 *   "status": "success",
 *   "message": "Bulk email completed. 2 sent, 1 failed",
 *   "results": [
 *     { "email": "user1@example.com", "success": true, "messageId": "bulk123-abc" },
 *     { "email": "user2@example.com", "success": true, "messageId": "bulk124-def" }
 *   ],
 *   "errors": [
 *     { "email": "user3@example.com", "success": false, "error": "Invalid email address" }
 *   ],
 *   "summary": {
 *     "total": 3,
 *     "sent": 2,
 *     "failed": 1
 *   }
 * }
 */

const sendBulkEmail = catchAsync(async (req, res, next) => {
  const {
    recipients,
    subject,
    htmlContent,
    senderName = "SI<3>",
    emailType = "basic",
  } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return next(new AppError("Recipients array is required", 400));
  }

  if (!subject || !htmlContent) {
    return next(new AppError("Subject and htmlContent are required", 400));
  }

  const results = [];
  const errors = [];

  // Determine sender email based on email type
  const senderEmails = {
    basic: "kara@si3.space",
    guide: "guides@si3.space",
    partner: "partners@si3.space",
    diversity: "kara@si3.space",
    temp: "partners@si3.space",
  };

  const senderEmail = senderEmails[emailType] || "kara@si3.space";

  // Send emails individually to avoid bulk spam issues
  for (const recipient of recipients) {
    try {
      const result = await sendTransactionalEmail({
        senderName,
        senderEmail,
        toName: recipient.name || "Recipient",
        toEmail: recipient.email,
        subject,
        htmlContent,
        emailType,
      });

      results.push({
        email: recipient.email,
        success: true,
        messageId: result.messageId,
      });
    } catch (error) {
      errors.push({
        email: recipient.email,
        success: false,
        error: error.message,
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: `Bulk email completed. ${results.length} sent, ${errors.length} failed`,
    results,
    errors,
    summary: {
      total: recipients.length,
      sent: results.length,
      failed: errors.length,
    },
  });
});

export {
  sendTempEmail,
  sendBulkEmail,
  sendBasicEmail,
  testSMTPConnections,
  sendGuideSubmissionEmail,
  sendPartnerProgramSubmissionEmail,
  sendDiversityTrackerSubmissionEmail,
};
