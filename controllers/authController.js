// import bcrypt from "bcryptjs";

// import User from "../models/userModel.js";
// import OTP from "../models/otpModel.js";

// import AppError from "../utils/AppError.js";
// import catchAsync from "../utils/catchAsync.js";
// import { sendTransactionalEmail } from "../utils/sendEthermail.js";

// import {
//   verifyToken,
//   generateOTP,
//   createSendToken,
// } from "../utils/authUtils.js";
// import { otpEmailTemplate } from "../utils/emailTemplates.js";

// // Request OTP
// const requestOTP = catchAsync(async (req, res, next) => {
//   const { email } = req.body;

//   if (!email) {
//     return next(new AppError("Email is required", 400));
//   }

//   // Email validation
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//   if (!emailRegex.test(email)) {
//     return next(new AppError("Please provide a valid email address", 400));
//   }

//   // Check for existing active OTP
//   const existingOTP = await OTP.findOne({
//     email,
//     expiresAt: { $gt: new Date() },
//     isUsed: false,
//   });

//   if (existingOTP) {
//     const retryAfter = Math.ceil((existingOTP.expiresAt - new Date()) / 1000);
//     const minutesLeft = Math.ceil(retryAfter / 60);

//     return next(
//       new AppError(
//         `OTP already sent. Please wait ${minutesLeft} minute${
//           minutesLeft !== 1 ? "s" : ""
//         } before requesting a new one.`,
//         429
//       )
//     );
//   }

//   // Generate new OTP
//   const otp = generateOTP();
//   const hashedOTP = await bcrypt.hash(otp, parseInt(process.env.BCRYPT_ROUNDS));

//   // Save OTP to database
//   await OTP.create({
//     email,
//     hashedOTP,
//     expiresAt: new Date(
//       Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES) * 60 * 1000
//     ),
//   });

//   // Send OTP via email using your existing email service
//   try {
//     await sendTransactionalEmail({
//       senderName: "SI<3>",
//       senderEmail: "members@si3.space",
//       toName: email.split("@")[0], // Use email prefix as name
//       toEmail: email,
//       subject: "Your SI<3> Login Code",
//       htmlContent: otpEmailTemplate(otp, email),
//       mergeData: {},
//     });

//     res.status(200).json({
//       status: "success",
//       message: "OTP sent successfully to your email",
//       data: {
//         email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email for privacy
//         expiresIn: `${process.env.OTP_EXPIRY_MINUTES} minutes`,
//         nextRequestIn: `${process.env.OTP_EXPIRY_MINUTES} minutes`,
//       },
//     });
//   } catch (error) {
//     console.error("Email sending failed:", error);

//     // Clean up OTP if email fails
//     await OTP.deleteOne({ email, hashedOTP });

//     return next(
//       new AppError("Failed to send OTP email. Please try again.", 500)
//     );
//   }
// });

// // Verify OTP and Login
// const verifyOTP = catchAsync(async (req, res, next) => {
//   const { email, otp } = req.body;

//   if (!email || !otp) {
//     return next(new AppError("Email and OTP are required", 400));
//   }

//   // Validate OTP format (6 digits)
//   if (!/^\d{6}$/.test(otp)) {
//     return next(new AppError("OTP must be 6 digits", 400));
//   }

//   // Find OTP record
//   const otpRecord = await OTP.findOne({
//     email,
//     expiresAt: { $gt: new Date() },
//     isUsed: false,
//   });

//   if (!otpRecord) {
//     return next(
//       new AppError("Invalid or expired OTP. Please request a new one.", 400)
//     );
//   }

//   // Check max attempts
//   if (otpRecord.attempts >= parseInt(process.env.MAX_OTP_ATTEMPTS)) {
//     await OTP.deleteOne({ _id: otpRecord._id });

//     return next(
//       new AppError("Too many failed attempts. Please request a new OTP.", 429)
//     );
//   }

//   // Verify OTP
//   const isValid = await bcrypt.compare(otp, otpRecord.hashedOTP);

//   if (!isValid) {
//     otpRecord.attempts += 1;
//     await otpRecord.save();

//     const attemptsLeft =
//       parseInt(process.env.MAX_OTP_ATTEMPTS) - otpRecord.attempts;

//     return next(
//       new AppError(
//         `Invalid OTP. ${attemptsLeft} attempt${
//           attemptsLeft !== 1 ? "s" : ""
//         } remaining.`,
//         400
//       )
//     );
//   }

//   // Mark OTP as used
//   otpRecord.isUsed = true;
//   await otpRecord.save();

//   // Find or create user
//   let user = await User.findOne({ email });
//   const isNewUser = !user;

//   if (!user) {
//     user = await User.create({
//       email,
//       isVerified: true,
//       lastLogin: new Date(),
//       roles: ["scholar"], // Default role for new users
//     });
//   } else {
//     user.lastLogin = new Date();
//     user.isVerified = true;
//     await user.save();
//   }

//   // Create and send token via cookie
//   const message = isNewUser
//     ? "Welcome to SI<3>! Your account has been created successfully."
//     : "Login successful! Welcome back to SI<3>.";

//   createSendToken(user, 200, res, message);
// });

// // Logout
// const logout = catchAsync(async (req, res) => {
//   res.cookie("jwt", "loggedout", {
//     expires: new Date(Date.now() + 10 * 1000),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//   });

//   res.status(200).json({
//     status: "success",
//     message: "Logged out successfully",
//   });
// });

// // Get current user
// const getMe = catchAsync(async (req, res, next) => {
//   const user = await User.findById(req.user.id).select("-__v");

//   res.status(200).json({
//     status: "success",
//     data: {
//       user,
//     },
//   });
// });

// // Check authentication status (for frontend)
// const checkAuth = catchAsync(async (req, res, next) => {
//   let token;

//   if (req.cookies.jwt && req.cookies.jwt !== "loggedout") {
//     token = req.cookies.jwt;
//   }

//   if (!token) {
//     return res.status(200).json({
//       status: "success",
//       authenticated: false,
//       message: "Not authenticated",
//     });
//   }

//   try {
//     const decoded = verifyToken(token);

//     const currentUser = await User.findById(decoded.id).select("-__v");

//     if (!currentUser) {
//       return res.status(200).json({
//         status: "success",
//         authenticated: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       status: "success",
//       authenticated: true,
//       data: {
//         user: currentUser,
//       },
//     });
//   } catch (error) {
//     res.status(200).json({
//       status: "success",
//       authenticated: false,
//       message: "Invalid token",
//     });
//   }
// });

// export { getMe, logout, verifyOTP, checkAuth, requestOTP };

import bcrypt from "bcryptjs";

import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";

import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import { sendTransactionalEmail } from "../utils/sendProtonMail.js";

import {
  verifyToken,
  generateOTP,
  createSendToken,
} from "../utils/authUtils.js";
import { otpEmailTemplate } from "../utils/emailTemplates.js";

// Request OTP
const requestOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return next(new AppError("Please provide a valid email address", 400));
  }

  // Check for existing active OTP
  const existingOTP = await OTP.findOne({
    email,
    expiresAt: { $gt: new Date() },
    isUsed: false,
  });

  if (existingOTP) {
    const retryAfter = Math.ceil((existingOTP.expiresAt - new Date()) / 1000);
    const minutesLeft = Math.ceil(retryAfter / 60);

    return next(
      new AppError(
        `OTP already sent. Please wait ${minutesLeft} minute${
          minutesLeft !== 1 ? "s" : ""
        } before requesting a new one.`,
        429
      )
    );
  }

  // Generate new OTP
  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, parseInt(process.env.BCRYPT_ROUNDS));

  // Save OTP to database
  await OTP.create({
    email,
    hashedOTP,
    expiresAt: new Date(
      Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES) * 60 * 1000
    ),
  });

  // Send OTP via email using Proton Mail service
  try {
    await sendTransactionalEmail({
      senderName: "SI<3>",
      senderEmail: "members@si3.space",
      toName: email.split("@")[0], // Use email prefix as name
      toEmail: email,
      subject: "Your SI<3> Login Code",
      htmlContent: otpEmailTemplate(otp, email),
    });

    res.status(200).json({
      status: "success",
      message: "OTP sent successfully to your email",
      data: {
        email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email for privacy
        expiresIn: `${process.env.OTP_EXPIRY_MINUTES} minutes`,
        nextRequestIn: `${process.env.OTP_EXPIRY_MINUTES} minutes`,
      },
    });
  } catch (error) {
    console.error("Email sending failed:", error);

    // Clean up OTP if email fails
    await OTP.deleteOne({ email, hashedOTP });

    return next(
      new AppError("Failed to send OTP email. Please try again.", 500)
    );
  }
});

// Verify OTP and Login
const verifyOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError("Email and OTP are required", 400));
  }

  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    return next(new AppError("OTP must be 6 digits", 400));
  }

  // Find OTP record
  const otpRecord = await OTP.findOne({
    email,
    expiresAt: { $gt: new Date() },
    isUsed: false,
  });

  if (!otpRecord) {
    return next(
      new AppError("Invalid or expired OTP. Please request a new one.", 400)
    );
  }

  // Check max attempts
  if (otpRecord.attempts >= parseInt(process.env.MAX_OTP_ATTEMPTS)) {
    await OTP.deleteOne({ _id: otpRecord._id });

    return next(
      new AppError("Too many failed attempts. Please request a new OTP.", 429)
    );
  }

  // Verify OTP
  const isValid = await bcrypt.compare(otp, otpRecord.hashedOTP);

  if (!isValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    const attemptsLeft =
      parseInt(process.env.MAX_OTP_ATTEMPTS) - otpRecord.attempts;

    return next(
      new AppError(
        `Invalid OTP. ${attemptsLeft} attempt${
          attemptsLeft !== 1 ? "s" : ""
        } remaining.`,
        400
      )
    );
  }

  // Mark OTP as used
  otpRecord.isUsed = true;
  await otpRecord.save();

  // Find or create user
  let user = await User.findOne({ email });
  const isNewUser = !user;

  if (!user) {
    user = await User.create({
      email,
      isVerified: true,
      lastLogin: new Date(),
      roles: ["scholar"], // Default role for new users
    });
  } else {
    user.lastLogin = new Date();
    user.isVerified = true;
    await user.save();
  }

  // Create and send token via cookie
  const message = isNewUser
    ? "Welcome to SI<3>! Your account has been created successfully."
    : "Login successful! Welcome back to SI<3>.";

  createSendToken(user, 200, res, message);
});

// Logout
const logout = catchAsync(async (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

// Get current user
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-__v");

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Check authentication status (for frontend)
const checkAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.cookies.jwt && req.cookies.jwt !== "loggedout") {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(200).json({
      status: "success",
      authenticated: false,
      message: "Not authenticated",
    });
  }

  try {
    const decoded = verifyToken(token);

    const currentUser = await User.findById(decoded.id).select("-__v");

    if (!currentUser) {
      return res.status(200).json({
        status: "success",
        authenticated: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      authenticated: true,
      data: {
        user: currentUser,
      },
    });
  } catch (error) {
    res.status(200).json({
      status: "success",
      authenticated: false,
      message: "Invalid token",
    });
  }
});

export { getMe, logout, verifyOTP, checkAuth, requestOTP };
