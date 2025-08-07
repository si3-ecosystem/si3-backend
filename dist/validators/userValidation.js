"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePartialNotificationSettings = exports.validateEnhancedProfile = exports.validateWalletActivity = exports.validateWalletConnection = exports.validateNotificationSettings = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation for notification settings update
 */
exports.validateNotificationSettings = [
    (0, express_validator_1.body)("emailUpdates")
        .isBoolean()
        .withMessage("emailUpdates must be a boolean"),
    (0, express_validator_1.body)("sessionReminder")
        .isBoolean()
        .withMessage("sessionReminder must be a boolean"),
    (0, express_validator_1.body)("marketingEmails")
        .isBoolean()
        .withMessage("marketingEmails must be a boolean"),
    (0, express_validator_1.body)("weeklyDigest")
        .isBoolean()
        .withMessage("weeklyDigest must be a boolean"),
    (0, express_validator_1.body)("eventAnnouncements")
        .isBoolean()
        .withMessage("eventAnnouncements must be a boolean"),
];
/**
 * Validation for wallet connection
 */
exports.validateWalletConnection = [
    (0, express_validator_1.body)("address")
        .notEmpty()
        .withMessage("Wallet address is required")
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage("Please provide a valid Ethereum address"),
    (0, express_validator_1.body)("connectedWallet")
        .optional()
        .isIn(["Zerion", "MetaMask", "WalletConnect", "Other"])
        .withMessage("Invalid wallet type. Must be one of: Zerion, MetaMask, WalletConnect, Other"),
    (0, express_validator_1.body)("network")
        .optional()
        .isIn(["Mainnet", "Polygon", "Arbitrum", "Base", "Optimism"])
        .withMessage("Invalid network. Must be one of: Mainnet, Polygon, Arbitrum, Base, Optimism"),
];
/**
 * Validation for wallet activity update
 */
exports.validateWalletActivity = [
// No body validation needed for activity update
];
/**
 * Validation for user profile updates (enhanced)
 */
exports.validateEnhancedProfile = [
    (0, express_validator_1.body)("email")
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address")
        .custom((value) => {
        if (value && value.includes('@wallet.temp')) {
            throw new Error("Wallet temporary emails are not allowed. Please use a real email address.");
        }
        return true;
    }),
    (0, express_validator_1.body)("username")
        .optional()
        .isString()
        .withMessage("Username must be a string")
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be between 3 and 30 characters long")
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),
    (0, express_validator_1.body)("companyName")
        .optional()
        .isString()
        .withMessage("Company name must be a string")
        .isLength({ max: 200 })
        .withMessage("Company name cannot exceed 200 characters"),
    (0, express_validator_1.body)("companyAffiliation")
        .optional()
        .isString()
        .withMessage("Company affiliation must be a string")
        .isLength({ max: 200 })
        .withMessage("Company affiliation cannot exceed 200 characters"),
    (0, express_validator_1.body)("interests")
        .optional()
        .isArray()
        .withMessage("Interests must be an array"),
    (0, express_validator_1.body)("interests.*")
        .optional()
        .isString()
        .withMessage("Each interest must be a string")
        .isLength({ min: 1, max: 100 })
        .withMessage("Each interest must be between 1 and 100 characters"),
    (0, express_validator_1.body)("personalValues")
        .optional()
        .isArray()
        .withMessage("Personal values must be an array"),
    (0, express_validator_1.body)("personalValues.*")
        .optional()
        .isString()
        .withMessage("Each personal value must be a string")
        .isLength({ min: 1, max: 100 })
        .withMessage("Each personal value must be between 1 and 100 characters"),
    (0, express_validator_1.body)("details")
        .optional()
        .isString()
        .withMessage("Details must be a string")
        .isLength({ max: 2000 })
        .withMessage("Details cannot exceed 2000 characters"),
    (0, express_validator_1.body)("newsletter")
        .optional()
        .isBoolean()
        .withMessage("Newsletter preference must be a boolean"),
    (0, express_validator_1.body)("digitalLinks")
        .optional()
        .isArray()
        .withMessage("Digital links must be an array"),
    (0, express_validator_1.body)("digitalLinks.*.platform")
        .optional()
        .isIn(['other', 'github', 'twitter', 'website', 'linkedin', 'facebook', 'instagram', 'portfolio'])
        .withMessage("Invalid platform type"),
    (0, express_validator_1.body)("digitalLinks.*.url")
        .optional()
        .isURL()
        .withMessage("Digital link URL must be a valid URL"),
    // Notification settings validation (if included in profile update)
    (0, express_validator_1.body)("notificationSettings.emailUpdates")
        .optional()
        .isBoolean()
        .withMessage("emailUpdates must be a boolean"),
    (0, express_validator_1.body)("notificationSettings.sessionReminder")
        .optional()
        .isBoolean()
        .withMessage("sessionReminder must be a boolean"),
    (0, express_validator_1.body)("notificationSettings.marketingEmails")
        .optional()
        .isBoolean()
        .withMessage("marketingEmails must be a boolean"),
    (0, express_validator_1.body)("notificationSettings.weeklyDigest")
        .optional()
        .isBoolean()
        .withMessage("weeklyDigest must be a boolean"),
    (0, express_validator_1.body)("notificationSettings.eventAnnouncements")
        .optional()
        .isBoolean()
        .withMessage("eventAnnouncements must be a boolean"),
    // Wallet info validation (if included in profile update)
    (0, express_validator_1.body)("walletInfo.address")
        .optional()
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage("Please provide a valid Ethereum address"),
    (0, express_validator_1.body)("walletInfo.connectedWallet")
        .optional()
        .isIn(["Zerion", "MetaMask", "WalletConnect", "Other"])
        .withMessage("Invalid wallet type"),
    (0, express_validator_1.body)("walletInfo.network")
        .optional()
        .isIn(["Mainnet", "Polygon", "Arbitrum", "Base", "Optimism"])
        .withMessage("Invalid network"),
];
/**
 * Validation for partial notification settings update
 */
exports.validatePartialNotificationSettings = [
    (0, express_validator_1.body)("emailUpdates")
        .optional()
        .isBoolean()
        .withMessage("emailUpdates must be a boolean"),
    (0, express_validator_1.body)("sessionReminder")
        .optional()
        .isBoolean()
        .withMessage("sessionReminder must be a boolean"),
    (0, express_validator_1.body)("marketingEmails")
        .optional()
        .isBoolean()
        .withMessage("marketingEmails must be a boolean"),
    (0, express_validator_1.body)("weeklyDigest")
        .optional()
        .isBoolean()
        .withMessage("weeklyDigest must be a boolean"),
    (0, express_validator_1.body)("eventAnnouncements")
        .optional()
        .isBoolean()
        .withMessage("eventAnnouncements must be a boolean"),
];
