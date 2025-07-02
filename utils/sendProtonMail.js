// import axios from "axios";

// const ETHERMAIL_API_URL =
//   "https://hub-gateway.ethermail.io/v1/transactional-emails";

// export const sendTransactionalEmail = async ({
//   senderName,
//   senderEmail,
//   toName,
//   toEmail,
//   subject,
//   htmlContent,
//   cc,
//   bcc,
//   mergeData = {},
// }) => {
//   if (
//     !senderName ||
//     !senderEmail ||
//     !toName ||
//     !subject ||
//     !toEmail ||
//     !htmlContent ||
//     !mergeData
//   ) {
//     throw new Error("Missing required fields!");
//   }

//   const payload = {
//     sender_name: senderName,
//     sender_email: senderEmail,
//     to_name: toName,
//     to_email: toEmail,
//     cc: cc,
//     bcc: bcc,
//     subject,
//     html: htmlContent,
//     merge_data: mergeData,
//   };

//   try {
//     const response = await axios.post(ETHERMAIL_API_URL, payload, {
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-key": process.env.ETHERMAIL_API_KEY,
//         "x-api-secret": process.env.ETHERMAIL_API_SECRET,
//       },
//     });

//     return response.data;
//   } catch (err) {
//     console.error(
//       "Failed to send EtherMail:",
//       err.response?.data || err.message
//     );

//     throw err;
//   }
// };

// import nodemailer from "nodemailer";

// export const sendTransactionalEmail = async ({
//   senderName,
//   senderEmail,
//   toName,
//   toEmail,
//   subject,
//   htmlContent,
//   cc = [],
//   bcc = [],
// }) => {
//   if (
//     !senderName ||
//     !senderEmail ||
//     !toName ||
//     !subject ||
//     !toEmail ||
//     !htmlContent
//   ) {
//     throw new Error("Missing required fields!");
//   }

//   // Create transporter using Proton Mail SMTP
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_SERVER, // smtp.protonmail.ch
//     port: process.env.SMTP_PORT, // 587
//     secure: false, // Use STARTTLS
//     auth: {
//       user: process.env.SMTP_USERNAME, // Your Proton Mail email
//       pass: process.env.SMTP_TOKEN, // Your Proton Mail app password/token
//     },
//   });

//   // Prepare email options
//   const mailOptions = {
//     from: `"${senderName}" <${senderEmail}>`,
//     to: `"${toName}" <${toEmail}>`,
//     subject: subject,
//     html: htmlContent,
//   };

//   // Add CC if provided
//   if (cc && cc.length > 0) {
//     mailOptions.cc = Array.isArray(cc) ? cc.join(", ") : cc;
//   }

//   // Add BCC if provided
//   if (bcc && bcc.length > 0) {
//     mailOptions.bcc = Array.isArray(bcc) ? bcc.join(", ") : bcc;
//   }

//   try {
//     // Send the email
//     const info = await transporter.sendMail(mailOptions);

//     console.log("Email sent successfully:", info.messageId);

//     return {
//       success: true,
//       messageId: info.messageId,
//       response: info.response,
//     };
//   } catch (error) {
//     console.error("Failed to send email via Proton Mail:", error.message);
//     throw new Error(`Email sending failed: ${error.message}`);
//   }
// };

import nodemailer from "nodemailer";

// SMTP Configuration mapping
const SMTP_CONFIGS = {
  kara: {
    username: process.env.SMTP_USERNAME_KARA,
    token: process.env.SMTP_TOKEN_KARA,
  },
  partners: {
    username: process.env.SMTP_USERNAME_PARTNERS,
    token: process.env.SMTP_TOKEN_PARTNERS,
  },
  guides: {
    username: process.env.SMTP_USERNAME_GUIDES,
    token: process.env.SMTP_TOKEN_GUIDES,
  },
  scholars: {
    username: process.env.SMTP_USERNAME_SCHOLARS,
    token: process.env.SMTP_TOKEN_SCHOLARS,
  },
};

// Email type to SMTP mapping
const EMAIL_TYPE_MAPPING = {
  guide: "guides",
  partner: "partners",
  diversity: "kara",
  basic: "kara",
  temp: "partners",
};

/**
 * Get SMTP configuration for a specific email type
 */
const getSMTPConfig = (emailType = "basic") => {
  const smtpKey = EMAIL_TYPE_MAPPING[emailType] || "kara";
  const config = SMTP_CONFIGS[smtpKey];

  if (!config.username || !config.token) {
    throw new Error(
      `Missing SMTP credentials for ${smtpKey}. Please check environment variables.`
    );
  }

  return config;
};

/**
 * Create nodemailer transporter with dynamic SMTP config
 */
const createTransporter = (emailType) => {
  const smtpConfig = getSMTPConfig(emailType);

  return nodemailer.createTransporter({
    host: process.env.SMTP_SERVER, // smtp.protonmail.ch
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // Use STARTTLS
    auth: {
      user: smtpConfig.username,
      pass: smtpConfig.token,
    },
    // Additional options for better reliability
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  });
};

/**
 * Send transactional email with dynamic SMTP selection
 */
export const sendTransactionalEmail = async ({
  senderName,
  senderEmail,
  toName,
  toEmail,
  subject,
  htmlContent,
  cc = [],
  bcc = [],
  emailType = "basic", // New parameter to determine SMTP config
}) => {
  // Validation
  if (
    !senderName ||
    !senderEmail ||
    !toName ||
    !subject ||
    !toEmail ||
    !htmlContent
  ) {
    throw new Error(
      "Missing required fields: senderName, senderEmail, toName, toEmail, subject, htmlContent"
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(toEmail)) {
    throw new Error("Invalid recipient email format");
  }

  try {
    // Create transporter with appropriate SMTP config
    const transporter = createTransporter(emailType);

    // Prepare email options
    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to: `"${toName}" <${toEmail}>`,
      subject: subject,
      html: htmlContent,
    };

    // Add CC if provided
    if (cc && cc.length > 0) {
      const ccEmails = Array.isArray(cc) ? cc : [cc];
      mailOptions.cc = ccEmails
        .filter((email) => emailRegex.test(email))
        .join(", ");
    }

    // Add BCC if provided
    if (bcc && bcc.length > 0) {
      const bccEmails = Array.isArray(bcc) ? bcc : [bcc];
      mailOptions.bcc = bccEmails
        .filter((email) => emailRegex.test(email))
        .join(", ");
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully via ${emailType} SMTP:`, {
      messageId: info.messageId,
      to: toEmail,
      subject: subject,
    });

    // Close transporter
    transporter.close();

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      smtpUsed: EMAIL_TYPE_MAPPING[emailType] || "kara",
    };
  } catch (error) {
    console.error(`Failed to send email via ${emailType} SMTP:`, {
      error: error.message,
      to: toEmail,
      subject: subject,
    });
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Verify SMTP connection for a specific email type
 */
export const verifyConnection = async (emailType = "basic") => {
  try {
    const transporter = createTransporter(emailType);
    await transporter.verify();
    transporter.close();
    console.log(`SMTP connection verified for ${emailType}`);
    return true;
  } catch (error) {
    console.error(`SMTP connection failed for ${emailType}:`, error.message);
    return false;
  }
};

/**
 * Get available SMTP configurations status
 */
export const getSMTPStatus = () => {
  const status = {};

  Object.keys(SMTP_CONFIGS).forEach((key) => {
    const config = SMTP_CONFIGS[key];
    status[key] = {
      hasUsername: !!config.username,
      hasToken: !!config.token,
      isConfigured: !!(config.username && config.token),
    };
  });

  return status;
};
