import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

import { sendTransactionalEmail } from "../utils/sendEthermail.js";
import { diversityTrackerEmailTemplate } from "../utils/emailTemplates.js";

import PartnerProgramModel from "../models/partnerProgramModel.js";
import DiversityTrackerModel from "../models/diversityTrackerModel.js";

export const sendBasicEmail = catchAsync(async (req, res, next) => {
  const { toEmail, toName, subject, htmlContent } = req.body;

  if (!toEmail || !toName || !subject || !htmlContent) {
    return next(new AppError("Missing required fieldes!", 400));
  }

  const result = await sendTransactionalEmail({
    senderName: "SI<3>",
    senderEmail: "members@si3.space",
    toName,
    toEmail,
    subject,
    htmlContent,
    mergeData: {},
  });

  res.status(200).json({
    status: "success",
    message: "Email sent successfully",
    result,
  });
});

// export const sendDiversityTrackerSubmissionEmail = catchAsync(
//   async (req, res, next) => {
//     const { toEmail, formData } = req.body;

//     if (!toEmail || !formData) {
//       return next(new AppError("Missing recipient email or form data", 400));
//     }

//     const htmlContent = diversityTrackerEmailTemplate(formData);

//     const result = await sendTransactionalEmail({
//       senderName: "SI<3>",
//       senderEmail: "members@si3.space",
//       toName: "Gautam",
//       toEmail,
//       subject: "New Diversity Tracker Submission",
//       htmlContent,
//       mergeData: {
//         username: "Gautam",
//         welcome_link: "https://si3.space/diversity-tracker",
//       },
//     });

//     res.status(200).json({
//       status: "success",
//       message: "Diversity tracker submission email sent successfully",
//       result,
//     });
//   }
// );

// export const sendPartnerProgramSubmissionEmail = catchAsync(
//   async (req, res, next) => {
//     const { toEmail, formData } = req.body;

//     if (!toEmail || !formData) {
//       return next(new AppError("Missing recipient email or form data", 400));
//     }

//     const htmlContent = partnerProgramEmailTemplate(formData);

//     const result = await sendTransactionalEmail({
//       senderName: "SI<3>",
//       senderEmail: "members@si3.space",
//       toName: "Kara!",
//       toEmail,
//       subject: "New Partner Program Submission",
//       htmlContent,
//       mergeData: {
//         username: "Kara!",
//         welcome_link: "https://si3.space/partner-program",
//       },
//     });

//     res.status(200).json({
//       status: "success",
//       message: "Partner program submission email sent successfully",
//       result,
//     });
//   }
// );

export const sendDiversityTrackerSubmissionEmail = catchAsync(
  async (req, res, next) => {
    const { toEmail, formData } = req.body;

    if (!toEmail || !formData) {
      return next(new AppError("Missing recipient email or form data", 400));
    }

    // 1. Save to MongoDB
    await DiversityTrackerModel.create(formData);

    // 2. Generate HTML content (after saving to DB)
    const htmlContent = diversityTrackerEmailTemplate(formData);

    // 3. Send the email
    await sendTransactionalEmail({
      senderName: "SI<3>",
      senderEmail: "members@si3.space",
      toName: "Gautam", //  Consider making this dynamic, if available
      toEmail,
      subject: "New Diversity Tracker Submission",
      htmlContent,
      mergeData: {
        username: "Gautam", // Consider making this dynamic
        welcome_link: "https://si3.space/diversity-tracker",
      },
    });

    res.status(200).json({
      status: "success",
      message: "Diversity tracker submission saved and email sent successfully",
    });
  }
);

export const sendPartnerProgramSubmissionEmail = catchAsync(
  async (req, res, next) => {
    const { toEmail, formData } = req.body;

    if (!toEmail || !formData) {
      return next(new AppError("Missing recipient email or form data", 400));
    }

    // 1. Save to MongoDB
    await PartnerProgramModel.create(formData);

    // 2. Generate HTML content (after saving to DB)
    const htmlContent = partnerProgramEmailTemplate(formData);

    // 3. Send the email
    await sendTransactionalEmail({
      senderName: "SI<3>",
      senderEmail: "members@si3.space",
      toName: "Kara!",
      toEmail,
      subject: "New Partner Program Submission",
      htmlContent,
      mergeData: {
        username: "Kara!",
        welcome_link: "https://si3.space/partner-program",
      },
    });

    res.status(200).json({
      status: "success",
      message: "Partner program submission saved and email sent successfully",
    });
  }
);
