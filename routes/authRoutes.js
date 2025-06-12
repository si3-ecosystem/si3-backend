// routes/authRoutes.js (UPDATED)
import express from "express";
import rateLimit from "express-rate-limit";

import { protect } from "../middleware/protectMiddleware.js";
import validationMiddleware from "../middleware/validationMiddleware.js";

import {
  getMe,
  logout,
  verifyOTP,
  checkAuth,
  requestOTP,
} from "../controllers/authController.js";
import {
  validateOTPRequest,
  validateOTPVerification,
} from "../middleware/validators/authValidators.js";

const router = express.Router();

// Rate limiting for OTP requests
const otpRequestLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 requests per window per IP
  message: {
    status: "error",
    message:
      "Too many OTP requests from this IP. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for OTP verification
const otpVerifyLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per window per IP
  message: {
    status: "error",
    message:
      "Too many verification attempts from this IP. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post(
  "/verify-otp",
  otpVerifyLimit,
  validateOTPVerification,
  validationMiddleware,
  verifyOTP
);
router.post(
  "/request-otp",
  otpRequestLimit,
  validateOTPRequest,
  validationMiddleware,
  requestOTP
);

router.get("/check", checkAuth); // Check if user is authenticated
router.post("/logout", logout); // Can be called without auth

// Protected routes
router.get("/me", protect, getMe);

export default router;
