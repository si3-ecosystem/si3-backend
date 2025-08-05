"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProfileUpdate = exports.validateRateLimit = exports.validateUserProfile = exports.validateConnectWallet = exports.validateWalletSignatureVerification = exports.validateWalletSignatureRequest = exports.validateOTPVerification = exports.validateEmailOTP = void 0;
const ethers_1 = require("ethers");
const express_validator_1 = require("express-validator");
// Email validation for OTP request
exports.validateEmailOTP = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address")
        .isLength({ max: 254 })
        .withMessage("Email address is too long"),
];
// OTP verification validation
exports.validateOTPVerification = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("otp")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be exactly 6 digits")
        .isNumeric()
        .withMessage("OTP must contain only numbers"),
];
// Wallet signature request validation
exports.validateWalletSignatureRequest = [
    (0, express_validator_1.body)("wallet_address")
        .custom((value) => {
        if (!value || !ethers_1.ethers.utils.isAddress(value)) {
            throw new Error("Please provide a valid wallet address");
        }
        return true;
    })
        .customSanitizer((value) => value.toLowerCase()),
];
// Wallet signature verification validation
exports.validateWalletSignatureVerification = [
    (0, express_validator_1.body)("wallet_address")
        .custom((value) => {
        if (!value || !ethers_1.ethers.utils.isAddress(value)) {
            throw new Error("Please provide a valid wallet address");
        }
        return true;
    })
        .customSanitizer((value) => value.toLowerCase()),
    (0, express_validator_1.body)("signature")
        .notEmpty()
        .withMessage("Signature is required")
        .isLength({ min: 130, max: 132 })
        .withMessage("Invalid signature format")
        .matches(/^0x[a-fA-F0-9]+$/)
        .withMessage("Signature must be a valid hex string"),
];
// Connect wallet validation
exports.validateConnectWallet = [
    (0, express_validator_1.body)("wallet_address")
        .custom((value) => {
        if (!value || !ethers_1.ethers.utils.isAddress(value)) {
            throw new Error("Please provide a valid wallet address");
        }
        return true;
    })
        .customSanitizer((value) => value.toLowerCase()),
    (0, express_validator_1.body)("signature")
        .notEmpty()
        .withMessage("Signature is required")
        .isLength({ min: 130, max: 132 })
        .withMessage("Invalid signature format")
        .matches(/^0x[a-fA-F0-9]+$/)
        .withMessage("Signature must be a valid hex string"),
];
// User profile update validation (optional fields for registration)
exports.validateUserProfile = [
    (0, express_validator_1.body)("companyName")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Company name cannot exceed 200 characters"),
    (0, express_validator_1.body)("companyAffiliation")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Company affiliation cannot exceed 200 characters"),
    (0, express_validator_1.body)("details")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Details cannot exceed 1000 characters"),
    (0, express_validator_1.body)("interests")
        .optional()
        .isArray()
        .withMessage("Interests must be an array")
        .custom((interests) => {
        if (Array.isArray(interests)) {
            return interests.every((interest) => typeof interest === "string" && interest.trim().length > 0);
        }
        return true;
    })
        .withMessage("All interests must be non-empty strings"),
    (0, express_validator_1.body)("personalValues")
        .optional()
        .isArray()
        .withMessage("Personal values must be an array")
        .custom((values) => {
        if (Array.isArray(values)) {
            return values.every((value) => typeof value === "string" && value.trim().length > 0);
        }
        return true;
    })
        .withMessage("All personal values must be non-empty strings"),
    (0, express_validator_1.body)("digitalLinks")
        .optional()
        .isArray()
        .withMessage("Digital links must be an array")
        .custom((links) => {
        if (Array.isArray(links)) {
            return links.every((link) => {
                if (typeof link !== "object" || !link.platform || !link.url) {
                    return false;
                }
                // Validate URL format
                try {
                    new URL(link.url.startsWith("http") ? link.url : `https://${link.url}`);
                    return true;
                }
                catch (_a) {
                    return false;
                }
            });
        }
        return true;
    })
        .withMessage("All digital links must have valid platform and URL"),
    (0, express_validator_1.body)("roles")
        .optional()
        .isArray()
        .withMessage("Roles must be an array")
        .custom((roles) => {
        if (Array.isArray(roles)) {
            const validRoles = ["admin", "guide", "scholar", "partner"];
            return roles.every((role) => validRoles.includes(role));
        }
        return true;
    })
        .withMessage("Invalid role provided"),
    (0, express_validator_1.body)("newsletter")
        .optional()
        .isBoolean()
        .withMessage("Newsletter must be a boolean value"),
];
// Rate limiting validation helper
exports.validateRateLimit = [
    (0, express_validator_1.body)("email").optional().isEmail().normalizeEmail(),
    (0, express_validator_1.body)("wallet_address")
        .optional()
        .custom((value) => {
        if (value && !ethers_1.ethers.utils.isAddress(value)) {
            throw new Error("Invalid wallet address format");
        }
        return true;
    }),
];
// Profile update validation
exports.validateProfileUpdate = [
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
];
