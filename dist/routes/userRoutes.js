"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Controllers
const notificationController_1 = require("../controllers/notificationController");
const walletController_1 = require("../controllers/walletController");
const protectUnverifiedMiddleware_1 = require("../middleware/protectUnverifiedMiddleware");
const validationMiddleware_1 = __importDefault(require("../middleware/validationMiddleware"));
// Validators
const userValidation_1 = require("../validators/userValidation");
const router = (0, express_1.Router)();
// ============================================================================
// NOTIFICATION SETTINGS ROUTES
// ============================================================================
/**
 * @route   GET /api/user/notification-settings
 * @desc    Get user notification settings
 * @access  Private
 */
router.get("/notification-settings", protectUnverifiedMiddleware_1.protectUnverified, notificationController_1.getNotificationSettings);
/**
 * @route   PUT /api/user/notification-settings
 * @desc    Update user notification settings (full update)
 * @access  Private
 */
router.put("/notification-settings", protectUnverifiedMiddleware_1.protectUnverified, userValidation_1.validateNotificationSettings, validationMiddleware_1.default, notificationController_1.updateNotificationSettings);
/**
 * @route   PATCH /api/user/notification-settings
 * @desc    Update user notification settings (partial update)
 * @access  Private
 */
router.patch("/notification-settings", protectUnverifiedMiddleware_1.protectUnverified, userValidation_1.validatePartialNotificationSettings, validationMiddleware_1.default, notificationController_1.updateNotificationSettings);
/**
 * @route   POST /api/user/notification-settings/reset
 * @desc    Reset notification settings to defaults
 * @access  Private
 */
router.post("/notification-settings/reset", protectUnverifiedMiddleware_1.protectUnverified, notificationController_1.resetNotificationSettings);
/**
 * @route   GET /api/user/notification-settings/summary
 * @desc    Get notification settings summary
 * @access  Private
 */
router.get("/notification-settings/summary", protectUnverifiedMiddleware_1.protectUnverified, notificationController_1.getNotificationSummary);
// ============================================================================
// WALLET MANAGEMENT ROUTES
// ============================================================================
/**
 * @route   GET /api/user/wallet/info
 * @desc    Get user wallet information
 * @access  Private
 */
router.get("/wallet/info", protectUnverifiedMiddleware_1.protectUnverified, walletController_1.getWalletInfo);
/**
 * @route   POST /api/user/wallet/connect
 * @desc    Connect wallet to user account
 * @access  Private
 */
router.post("/wallet/connect", protectUnverifiedMiddleware_1.protectUnverified, userValidation_1.validateWalletConnection, validationMiddleware_1.default, walletController_1.connectWallet);
/**
 * @route   DELETE /api/user/wallet/disconnect
 * @desc    Disconnect wallet from user account
 * @access  Private
 */
router.delete("/wallet/disconnect", protectUnverifiedMiddleware_1.protectUnverified, walletController_1.disconnectWallet);
/**
 * @route   PATCH /api/user/wallet/activity
 * @desc    Update wallet last used timestamp
 * @access  Private
 */
router.patch("/wallet/activity", protectUnverifiedMiddleware_1.protectUnverified, userValidation_1.validateWalletActivity, validationMiddleware_1.default, walletController_1.updateWalletActivity);
/**
 * @route   GET /api/user/wallet/history
 * @desc    Get wallet connection history
 * @access  Private
 */
router.get("/wallet/history", protectUnverifiedMiddleware_1.protectUnverified, walletController_1.getWalletHistory);
exports.default = router;
