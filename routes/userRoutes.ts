import { Router } from "express";

// Controllers
import {
  getNotificationSettings,
  updateNotificationSettings,
  resetNotificationSettings,
  getNotificationSummary,
} from "../controllers/notificationController";

import {
  getWalletInfo,
  connectWallet,
  disconnectWallet,
  updateWalletActivity,
  getWalletHistory,
} from "../controllers/walletController";

// Middleware
import { protect } from "../middleware/protectMiddleware";
import { protectUnverified } from "../middleware/protectUnverifiedMiddleware";
import validationMiddleware from "../middleware/validationMiddleware";

// Validators
import {
  validateNotificationSettings,
  validateWalletConnection,
  validateWalletActivity,
  validatePartialNotificationSettings,
} from "../validators/userValidation";

const router = Router();

// ============================================================================
// NOTIFICATION SETTINGS ROUTES
// ============================================================================

/**
 * @route   GET /api/user/notification-settings
 * @desc    Get user notification settings
 * @access  Private
 */
router.get(
  "/notification-settings",
  protectUnverified,
  getNotificationSettings
);

/**
 * @route   PUT /api/user/notification-settings
 * @desc    Update user notification settings (full update)
 * @access  Private
 */
router.put(
  "/notification-settings",
  protectUnverified,
  validateNotificationSettings,
  validationMiddleware,
  updateNotificationSettings
);

/**
 * @route   PATCH /api/user/notification-settings
 * @desc    Update user notification settings (partial update)
 * @access  Private
 */
router.patch(
  "/notification-settings",
  protectUnverified,
  validatePartialNotificationSettings,
  validationMiddleware,
  updateNotificationSettings
);

/**
 * @route   POST /api/user/notification-settings/reset
 * @desc    Reset notification settings to defaults
 * @access  Private
 */
router.post(
  "/notification-settings/reset",
  protectUnverified,
  resetNotificationSettings
);

/**
 * @route   GET /api/user/notification-settings/summary
 * @desc    Get notification settings summary
 * @access  Private
 */
router.get(
  "/notification-settings/summary",
  protectUnverified,
  getNotificationSummary
);

// ============================================================================
// WALLET MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/user/wallet/info
 * @desc    Get user wallet information
 * @access  Private
 */
router.get(
  "/wallet/info",
  protectUnverified,
  getWalletInfo
);

/**
 * @route   POST /api/user/wallet/connect
 * @desc    Connect wallet to user account
 * @access  Private
 */
router.post(
  "/wallet/connect",
  protectUnverified,
  validateWalletConnection,
  validationMiddleware,
  connectWallet
);

/**
 * @route   DELETE /api/user/wallet/disconnect
 * @desc    Disconnect wallet from user account
 * @access  Private
 */
router.delete(
  "/wallet/disconnect",
  protectUnverified,
  disconnectWallet
);

/**
 * @route   PATCH /api/user/wallet/activity
 * @desc    Update wallet last used timestamp
 * @access  Private
 */
router.patch(
  "/wallet/activity",
  protectUnverified,
  validateWalletActivity,
  validationMiddleware,
  updateWalletActivity
);

/**
 * @route   GET /api/user/wallet/history
 * @desc    Get wallet connection history
 * @access  Private
 */
router.get(
  "/wallet/history",
  protectUnverified,
  getWalletHistory
);

export default router;
