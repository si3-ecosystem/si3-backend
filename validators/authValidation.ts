import { ethers } from "ethers";
import { body } from "express-validator";

// Email validation for OTP request
export const validateEmailOTP = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .isLength({ max: 254 })
    .withMessage("Email address is too long"),
];
// OTP verification validation
export const validateOTPVerification = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),
];

// Wallet signature request validation
export const validateWalletSignatureRequest = [
  body("wallet_address")
    .custom((value) => {
      if (!value || !ethers.utils.isAddress(value)) {
        throw new Error("Please provide a valid wallet address");
      }
      return true;
    })
    .customSanitizer((value) => value.toLowerCase()),
];

// Wallet signature verification validation
export const validateWalletSignatureVerification = [
  body("wallet_address")
    .custom((value) => {
      if (!value || !ethers.utils.isAddress(value)) {
        throw new Error("Please provide a valid wallet address");
      }
      return true;
    })
    .customSanitizer((value) => value.toLowerCase()),

  body("signature")
    .notEmpty()
    .withMessage("Signature is required")
    .isLength({ min: 130, max: 132 })
    .withMessage("Invalid signature format")
    .matches(/^0x[a-fA-F0-9]+$/)
    .withMessage("Signature must be a valid hex string"),
];

// Connect wallet validation
export const validateConnectWallet = [
  body("wallet_address")
    .custom((value) => {
      if (!value || !ethers.utils.isAddress(value)) {
        throw new Error("Please provide a valid wallet address");
      }
      return true;
    })
    .customSanitizer((value) => value.toLowerCase()),

  body("signature")
    .notEmpty()
    .withMessage("Signature is required")
    .isLength({ min: 130, max: 132 })
    .withMessage("Invalid signature format")
    .matches(/^0x[a-fA-F0-9]+$/)
    .withMessage("Signature must be a valid hex string"),
];

// User profile update validation (optional fields for registration)
export const validateUserProfile = [
  body("companyName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Company name cannot exceed 200 characters"),

  body("companyAffiliation")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Company affiliation cannot exceed 200 characters"),

  body("details")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Details cannot exceed 1000 characters"),

  body("interests")
    .optional()
    .isArray()
    .withMessage("Interests must be an array")
    .custom((interests) => {
      if (Array.isArray(interests)) {
        return interests.every(
          (interest: any) =>
            typeof interest === "string" && interest.trim().length > 0
        );
      }
      return true;
    })
    .withMessage("All interests must be non-empty strings"),

  body("personalValues")
    .optional()
    .isArray()
    .withMessage("Personal values must be an array")
    .custom((values) => {
      if (Array.isArray(values)) {
        return values.every(
          (value: any) => typeof value === "string" && value.trim().length > 0
        );
      }
      return true;
    })
    .withMessage("All personal values must be non-empty strings"),

  body("digitalLinks")
    .optional()
    .isArray()
    .withMessage("Digital links must be an array")
    .custom((links) => {
      if (Array.isArray(links)) {
        return links.every((link: any) => {
          if (typeof link !== "object" || !link.platform || !link.url) {
            return false;
          }

          // Validate URL format
          try {
            new URL(
              link.url.startsWith("http") ? link.url : `https://${link.url}`
            );
            return true;
          } catch {
            return false;
          }
        });
      }
      return true;
    })
    .withMessage("All digital links must have valid platform and URL"),

  body("roles")
    .optional()
    .isArray()
    .withMessage("Roles must be an array")
    .custom((roles) => {
      if (Array.isArray(roles)) {
        const validRoles = ["admin", "guide", "scholar", "partner"];
        return roles.every((role: string) => validRoles.includes(role));
      }
      return true;
    })
    .withMessage("Invalid role provided"),

  body("newsletter")
    .optional()
    .isBoolean()
    .withMessage("Newsletter must be a boolean value"),
];

// Rate limiting validation helper
export const validateRateLimit = [
  body("email").optional().isEmail().normalizeEmail(),

  body("wallet_address")
    .optional()
    .custom((value) => {
      if (value && !ethers.utils.isAddress(value)) {
        throw new Error("Invalid wallet address format");
      }
      return true;
    }),
];

// Profile update validation
export const validateProfileUpdate = [
  body("email")
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

  body("companyName")
    .optional()
    .isString()
    .withMessage("Company name must be a string")
    .isLength({ max: 200 })
    .withMessage("Company name cannot exceed 200 characters"),

  body("companyAffiliation")
    .optional()
    .isString()
    .withMessage("Company affiliation must be a string")
    .isLength({ max: 200 })
    .withMessage("Company affiliation cannot exceed 200 characters"),

  body("interests")
    .optional()
    .isArray()
    .withMessage("Interests must be an array"),

  body("interests.*")
    .optional()
    .isString()
    .withMessage("Each interest must be a string")
    .isLength({ min: 1, max: 100 })
    .withMessage("Each interest must be between 1 and 100 characters"),

  body("personalValues")
    .optional()
    .isArray()
    .withMessage("Personal values must be an array"),

  body("personalValues.*")
    .optional()
    .isString()
    .withMessage("Each personal value must be a string")
    .isLength({ min: 1, max: 100 })
    .withMessage("Each personal value must be between 1 and 100 characters"),

  body("details")
    .optional()
    .isString()
    .withMessage("Details must be a string")
    .isLength({ max: 2000 })
    .withMessage("Details cannot exceed 2000 characters"),

  body("newsletter")
    .optional()
    .isBoolean()
    .withMessage("Newsletter preference must be a boolean"),

  body("digitalLinks")
    .optional()
    .isArray()
    .withMessage("Digital links must be an array"),

  body("digitalLinks.*.platform")
    .optional()
    .isIn(['other', 'github', 'twitter', 'website', 'linkedin', 'facebook', 'instagram', 'portfolio'])
    .withMessage("Invalid platform type"),

  body("digitalLinks.*.url")
    .optional()
    .isURL()
    .withMessage("Digital link URL must be a valid URL"),
];
