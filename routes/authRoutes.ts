import { Router } from "express";

import {
  getMe,
  logout,
  checkAuth,
  refreshToken,
  sendEmailOTP,
  connectWallet,
  verifyEmailOTP,
  updateProfile,
  disconnectWallet,
  sendEmailVerification,
  sendEmailVerificationToNewEmail,
  debugEmailRequest,
  verifyEmailVerification,
  verifyWalletSignature,
  requestWalletSignature,
} from "../controllers/authController";

import {
  validateEmailOTP,
  validateConnectWallet,
  validateOTPVerification,
  validateProfileUpdate,
  validateEmailVerification,
  validateNewEmailVerification,
  validateWalletSignatureRequest,
  validateWalletSignatureVerification,
} from "../validators/authValidation";

import { protect } from "../middleware/protectMiddleware";
import { protectUnverified } from "../middleware/protectUnverifiedMiddleware";
import validationMiddleware from "../middleware/validationMiddleware";

const router = Router();

/**
 * @route   POST /api/auth/email/send-otp
 * @desc    Send OTP to email for passwordless login
 * @access  Public
 */

router.post(
  "/email/send-otp",
  validateEmailOTP,
  validationMiddleware,
  sendEmailOTP
);

/**
 * @route   POST /api/auth/email/verify-otp
 * @desc    Verify OTP and login/register user
 * @access  Public
 */

router.post(
  "/email/verify-otp",
  validateOTPVerification,
  validationMiddleware,
  verifyEmailOTP
);

/**
 * @route   POST /api/auth/wallet/request-signature
 * @desc    Request wallet signature message for authentication
 * @access  Public
 */

router.post(
  "/wallet/request-signature",
  validateWalletSignatureRequest,
  validationMiddleware,
  requestWalletSignature
);

/**
 * @route   POST /api/auth/wallet/verify-signature
 * @desc    Verify wallet signature and login/register user
 * @access  Public
 */

router.post(
  "/wallet/verify-signature",
  validateWalletSignatureVerification,
  validationMiddleware,
  verifyWalletSignature
);

/**
 * @route   POST /api/auth/wallet/connect
 * @desc    Connect wallet to existing user account
 * @access  Private
 */

router.post(
  "/wallet/connect",
  protect,
  validateConnectWallet,
  validationMiddleware,
  connectWallet
);

/**
 * @route   DELETE /api/auth/wallet/disconnect
 * @desc    Disconnect wallet from user account
 * @access  Private
 */

router.delete("/wallet/disconnect", protect, disconnectWallet);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear cookies)
 * @access  Public
 */

router.post("/logout", logout);

/**
 * @route   GET /api/auth/check
 * @desc    Check authentication status
 * @access  Public
 */

router.get("/check", checkAuth);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh authentication token
 * @access  Private
 */

router.post("/refresh", protect, refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */

router.get("/me", protect, getMe);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile (partial update)
 * @access  Private
 */

router.patch("/profile", protect, validateProfileUpdate, validationMiddleware, updateProfile);

/**
 * @route   POST /api/auth/send-verification
 * @desc    Send email verification OTP to current user
 * @access  Private (allows unverified users)
 */

router.post("/send-verification", protectUnverified, sendEmailVerification);

/**
 * @route   POST /api/auth/send-verification-new-email
 * @desc    Send email verification to a new email address for email update
 * @access  Private (allows unverified users)
 */

router.post("/send-verification-new-email", protectUnverified, validateNewEmailVerification, validationMiddleware, sendEmailVerificationToNewEmail);

/**
 * @route   POST /api/auth/debug-email
 * @desc    Debug endpoint to test request parsing
 * @access  Private
 */

router.post("/debug-email", protectUnverified, debugEmailRequest);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with OTP for current user
 * @access  Private (allows unverified users)
 */

router.post("/verify-email", protectUnverified, validateEmailVerification, validationMiddleware, verifyEmailVerification);

export default router;
