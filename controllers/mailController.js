import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

import {
  tempMail,
  guideEmailTemplate,
  partnerProgramEmailTemplate,
  diversityTrackerEmailTemplate,
} from "../utils/emailTemplates.js";
import { sendTransactionalEmail } from "../utils/sendEthermail.js";

import PartnerProgramModel from "../models/partnerProgramModel.js";
import DiversityTrackerModel from "../models/diversityTrackerModel.js";

import Guide from "../models/guideModel.js";
import ScholarsProgram from "../models/scholarsProgramModel.js";
import { scholarsProgramEmailTemplate } from "../utils/emailTemplates.js";

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

export const sendDiversityTrackerSubmissionEmail = catchAsync(
  async (req, res, next) => {
    const { formData } = req.body;

    if (!formData) {
      return next(new AppError("Missing form data", 400));
    }

    await DiversityTrackerModel.create(formData);

    const htmlContent = diversityTrackerEmailTemplate(formData);

    // 3. Send the email
    // await sendTransactionalEmail({
    //   senderName: "SI<3>",
    //   senderEmail: "members@si3.space",
    //   toName: "Kara",
    //   toEmail: "kara@si3.space",
    //   subject: "New Diversity Tracker Submission",
    //   htmlContent,
    //   mergeData: {
    //     username: "Member",
    //     welcome_link: "https://si3.space/diversity-tracker",
    //   },
    // });

    res.status(200).json({
      status: "success",
      message: "Diversity tracker submission saved and email sent successfully",
    });
  }
);

export const sendGuideSubmissionEmail = catchAsync(async (req, res, next) => {
  const { formData } = req.body;

  if (!formData || !formData.email || !formData.name) {
    return next(new AppError("Missing form data or email or name", 400));
  }

  // 1. Save to MongoDB
  await Guide.create(formData);

  // 2. Generate HTML content
  const htmlContent = guideEmailTemplate(formData);

  // 3. Send the email
  // await sendTransactionalEmail({
  //   senderName: "SI<3>",
  //   senderEmail: "members@si3.space",
  //   toName: "Kara",
  //   toEmail: "kara@si3.space",
  //   subject: "New Guide Submission",
  //   htmlContent,
  //   mergeData: {
  //     username: formData.name,
  //     welcome_link: "https://si3.space/guides",
  //   },
  // });

  res.status(200).json({
    status: "success",
    message: "Guide submission saved and email sent successfully",
  });
});

export const sendPartnerProgramSubmissionEmail = catchAsync(
  async (req, res, next) => {
    const { formData } = req.body;

    if (!formData || !formData.email || !formData.name) {
      return next(new AppError("Missing form data or email or name", 400));
    }

    // 1. Save to MongoDB
    await PartnerProgramModel.create(formData);

    // 2. Generate HTML content (after saving to DB)
    const htmlContent = partnerProgramEmailTemplate(formData);

    // 3. Send the email
    // await sendTransactionalEmail({
    //   senderName: "SI<3>",
    //   senderEmail: "members@si3.space",
    //   toName: "Kara",
    //   toEmail: "kara@si3.space",
    //   subject: "New Partner Program Submission",
    //   htmlContent,
    //   mergeData: {
    //     username: formData.name,
    //     welcome_link: "https://si3.space/partner-program",
    //   },
    // });

    res.status(200).json({
      status: "success",
      message: "Partner program submission saved and email sent successfully",
    });
  }
);

export const sendScholarsProgramSubmissionEmail = catchAsync(
  async (req, res, next) => {
    const { formData } = req.body;

    if (!formData) {
      return next(new AppError("Missing form data", 400));
    }

    // Create a new scholar application
    const scholarData = {
      name: formData.name,
      email: formData.email,
      interests: formData.interests,
      details: formData.details || "",
      newsletter: formData.newsletter === "yes",
    };

    await ScholarsProgram.create(scholarData);

    // Send email notification
    const emailHtml = scholarsProgramEmailTemplate(scholarData);

    // await sendTransactionalEmail({
    //   senderName: "SI<3>",
    //   senderEmail: "members@si3.space",
    //   toName: "SI<3> Team",
    //   toEmail: "members@si3.space",
    //   subject: `New Scholars Program Application: ${formData.name}`,
    //   htmlContent: emailHtml,
    //   mergeData: {},
    // });

    // Send confirmation email to the applicant
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4C1192;">Thank you for your interest in the SI<3> Scholars Program!</h2>
        <p>We've received your application and will review it shortly. Our team will be in touch with you soon with more information about the next steps.</p>
        <p>In the meantime, feel free to explore our community resources and join our social channels:</p>
        <ul>
          <li><a href="https://twitter.com/si3_ecosystem" target="_blank">Follow us on Twitter</a></li>
          <li><a href="https://www.linkedin.com/company/si3ecosystem/" target="_blank">Connect on LinkedIn</a></li>
          <li><a href="https://www.si3.space/" target="_blank">Visit our website</a></li>
        </ul>
        <p>Best regards,<br>The SI<3> Team</p>
      </div>
    `;

    // await sendTransactionalEmail({
    //   senderName: "SI<3> Scholars Program",
    //   senderEmail: "scholars@si3.space",
    //   toName: formData.name,
    //   toEmail: formData.email,
    //   subject: "Your Scholars Program Application Has Been Received",
    //   htmlContent: confirmationHtml,
    //   mergeData: {},
    // });

    res.status(200).json({
      status: "success",
      message: "Application submitted successfully",
    });
  }
);

export const sendTempEmail = catchAsync(async (req, res, next) => {
  console.log("Sending temp email");
  // 2. Generate HTML content (after saving to DB)
  const htmlContent = tempMail();

  // 3. Send the email
  await sendTransactionalEmail({
    senderName: "SI<3>",
    senderEmail: "members@si3.space",
    toName: "Gautam",
    toEmail: "ashragautam25@gmail.com",
    bcc: [
      {
        name: "kara",
        email: "kara@si3.space",
      },
      {
        name: "Gautam",
        email: "ashragautam25@gmail.com",
      },
      {
        name: "Hamza",
        email: "hamzaali0854@gmail.com",
      },
      {
        name: "Dip",
        email: "dipistha012@gmail.com",
      },
      {
        name: "Kara",
        email: "karakrysthal@gmail.com",
      },
    ],
    subject: "New Template",
    htmlContent,
    mergeData: {
      username: "Member",
      welcome_link: "https://si3.space/partner-program",
    },
  });

  res.status(200).json({
    status: "success",
    message: "Partner program submission saved and email sent successfully",
  });
});
