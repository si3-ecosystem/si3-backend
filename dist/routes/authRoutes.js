"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authValidation_1 = require("../validators/authValidation");
const protectMiddleware_1 = require("../middleware/protectMiddleware");
const protectUnverifiedMiddleware_1 = require("../middleware/protectUnverifiedMiddleware");
const validationMiddleware_1 = __importDefault(require("../middleware/validationMiddleware"));
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/email/send-otp
 * @desc    Send OTP to email for passwordless login
 * @access  Public
 */
router.post("/email/send-otp", authValidation_1.validateEmailOTP, validationMiddleware_1.default, authController_1.sendEmailOTP);
/**
 * @route   POST /api/auth/email/verify-otp
 * @desc    Verify OTP and login/register user
 * @access  Public
 */
router.post("/email/verify-otp", authValidation_1.validateOTPVerification, validationMiddleware_1.default, authController_1.verifyEmailOTP);
/**
 * @route   POST /api/auth/wallet/request-signature
 * @desc    Request wallet signature message for authentication
 * @access  Public
 */
router.post("/wallet/request-signature", authValidation_1.validateWalletSignatureRequest, validationMiddleware_1.default, authController_1.requestWalletSignature);
/**
 * @route   POST /api/auth/wallet/verify-signature
 * @desc    Verify wallet signature and login/register user
 * @access  Public
 */
router.post("/wallet/verify-signature", authValidation_1.validateWalletSignatureVerification, validationMiddleware_1.default, authController_1.verifyWalletSignature);
/**
 * @route   POST /api/auth/wallet/connect
 * @desc    Connect wallet to existing user account
 * @access  Private
 */
router.post("/wallet/connect", protectMiddleware_1.protect, authValidation_1.validateConnectWallet, validationMiddleware_1.default, authController_1.connectWallet);
/**
 * @route   DELETE /api/auth/wallet/disconnect
 * @desc    Disconnect wallet from user account
 * @access  Private
 */
router.delete("/wallet/disconnect", protectMiddleware_1.protect, authController_1.disconnectWallet);
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear cookies)
 * @access  Public
 */
router.post("/logout", authController_1.logout);
/**
 * @route   GET /api/auth/check
 * @desc    Check authentication status
 * @access  Public
 */
router.get("/check", authController_1.checkAuth);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh authentication token
 * @access  Private
 */
router.post("/refresh", protectMiddleware_1.protect, authController_1.refreshToken);
/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", protectMiddleware_1.protect, authController_1.getMe);
/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile (partial update)
 * @access  Private
 */
router.patch("/profile", protectMiddleware_1.protect, authValidation_1.validateProfileUpdate, validationMiddleware_1.default, authController_1.updateProfile);
/**
 * @route   POST /api/auth/send-verification
 * @desc    Send email verification OTP to current user
 * @access  Private (allows unverified users)
 */
router.post("/send-verification", protectUnverifiedMiddleware_1.protectUnverified, authController_1.sendEmailVerification);
/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with OTP for current user
 * @access  Private (allows unverified users)
 */
router.post("/verify-email", protectUnverifiedMiddleware_1.protectUnverified, authValidation_1.validateEmailVerification, validationMiddleware_1.default, authController_1.verifyEmailVerification);
exports.default = router;
