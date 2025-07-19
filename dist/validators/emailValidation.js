"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePartnerSubmission = exports.validateGuideSubmission = exports.validateScholarsSubmission = exports.validateDiversityTracker = exports.validateBulkEmail = exports.validateBasicEmail = void 0;
const express_validator_1 = require("express-validator");
// Basic email validation
exports.validateBasicEmail = [
    (0, express_validator_1.body)("toEmail")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Must be a valid email address")
        .normalizeEmail(),
    (0, express_validator_1.body)("toName")
        .notEmpty()
        .withMessage("Name is required")
        .isString()
        .withMessage("Name must be a string")
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Name must be between 1 and 100 characters"),
    (0, express_validator_1.body)("subject")
        .notEmpty()
        .withMessage("Subject is required")
        .isString()
        .withMessage("Subject must be a string")
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage("Subject must be between 1 and 200 characters"),
    (0, express_validator_1.body)("htmlContent")
        .notEmpty()
        .withMessage("HTML content is required")
        .isString()
        .withMessage("HTML content must be a string")
        .trim()
        .isLength({ min: 1, max: 50000 })
        .withMessage("HTML content must be between 1 and 50000 characters"),
    (0, express_validator_1.body)("cc").optional().isArray().withMessage("CC must be an array"),
    (0, express_validator_1.body)("cc.*")
        .optional()
        .isEmail()
        .withMessage("Each CC email must be valid")
        .normalizeEmail(),
    (0, express_validator_1.body)("bcc").optional().isArray().withMessage("BCC must be an array"),
    (0, express_validator_1.body)("bcc.*")
        .optional()
        .isEmail()
        .withMessage("Each BCC email must be valid")
        .normalizeEmail(),
];
// Bulk email validation
exports.validateBulkEmail = [
    (0, express_validator_1.body)("recipients")
        .isArray({ min: 1, max: 100 })
        .withMessage("Recipients must be an array with 1-100 items"),
    (0, express_validator_1.body)("recipients.*.email")
        .isEmail()
        .withMessage("Each recipient must have a valid email")
        .normalizeEmail(),
    (0, express_validator_1.body)("recipients.*.name")
        .optional()
        .isString()
        .withMessage("Recipient name must be a string")
        .trim()
        .isLength({ max: 100 })
        .withMessage("Recipient name must be at most 100 characters"),
    (0, express_validator_1.body)("subject")
        .notEmpty()
        .withMessage("Subject is required")
        .isString()
        .withMessage("Subject must be a string")
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage("Subject must be between 1 and 200 characters"),
    (0, express_validator_1.body)("htmlContent")
        .notEmpty()
        .withMessage("Email content is required")
        .isString()
        .withMessage("Email content must be a string")
        .trim()
        .isLength({ min: 1, max: 50000 })
        .withMessage("Email content must be between 1 and 50000 characters"),
    (0, express_validator_1.body)("senderName")
        .optional()
        .isString()
        .withMessage("Sender name must be a string")
        .trim()
        .isLength({ max: 100 })
        .withMessage("Sender name must be at most 100 characters"),
    (0, express_validator_1.body)("emailType")
        .optional()
        .isIn(["basic", "guides", "partners", "diversity", "scholars", "temp"])
        .withMessage("Email type must be one of: basic, guides, partners, diversity, scholars, temp"),
];
// Diversity tracker validation
exports.validateDiversityTracker = [
    (0, express_validator_1.body)("formData").isObject().withMessage("formData must be an object"),
    // Personal Information
    (0, express_validator_1.body)("formData.selfIdentity")
        .notEmpty()
        .withMessage("Self Identity is required")
        .isString()
        .withMessage("Self Identity must be a string")
        .trim()
        .isLength({ max: 100 })
        .withMessage("Self Identity must be at most 100 characters"),
    (0, express_validator_1.body)("formData.selfIdentityCustom")
        .optional()
        .isString()
        .withMessage("Custom Identity must be a string")
        .trim()
        .isLength({ max: 100 })
        .withMessage("Custom Identity must be at most 100 characters"),
    (0, express_validator_1.body)("formData.ageRange")
        .notEmpty()
        .withMessage("Age Range is required")
        .isString()
        .withMessage("Age Range must be a string")
        .trim()
        .isLength({ max: 50 })
        .withMessage("Age Range must be at most 50 characters"),
    (0, express_validator_1.body)("formData.ethnicity")
        .notEmpty()
        .withMessage("Ethnicity is required")
        .custom((value) => {
        if (typeof value === "string")
            return value.trim().length > 0;
        if (Array.isArray(value))
            return value.length > 0;
        return false;
    })
        .withMessage("Ethnicity must be provided"),
    (0, express_validator_1.body)("formData.disability")
        .notEmpty()
        .withMessage("Disability status is required")
        .custom((value) => {
        if (typeof value === "string")
            return value.trim().length > 0;
        if (Array.isArray(value))
            return value.length > 0;
        return false;
    })
        .withMessage("Disability status must be provided"),
    (0, express_validator_1.body)("formData.sexualOrientation")
        .notEmpty()
        .withMessage("Sexual Orientation is required")
        .isString()
        .withMessage("Sexual Orientation must be a string")
        .trim()
        .isLength({ max: 100 })
        .withMessage("Sexual Orientation must be at most 100 characters"),
    (0, express_validator_1.body)("formData.equityScale")
        .notEmpty()
        .withMessage("Equity Scale is required")
        .isInt({ min: 1, max: 10 })
        .withMessage("Equity Scale must be an integer between 1 and 10"),
    // Optional fields
    (0, express_validator_1.body)("formData.improvementSuggestions")
        .optional()
        .isString()
        .withMessage("Improvement Suggestions must be a string")
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Improvement Suggestions must be at most 1000 characters"),
    (0, express_validator_1.body)("formData.grantProvider")
        .optional()
        .isString()
        .withMessage("Grant Provider must be a string")
        .trim()
        .isLength({ max: 200 })
        .withMessage("Grant Provider must be at most 200 characters"),
    (0, express_validator_1.body)("formData.grantRound")
        .optional()
        .isString()
        .withMessage("Grant Round must be a string")
        .trim()
        .isLength({ max: 100 })
        .withMessage("Grant Round must be at most 100 characters"),
    // Organization clarity
    (0, express_validator_1.body)("formData.offeringClear")
        .notEmpty()
        .withMessage("Clarity of organization's offering is required")
        .customSanitizer((value) => {
        if (typeof value === "string") {
            return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        }
        return value;
    })
        .isIn(["Yes", "No", "Somewhat"])
        .withMessage("Invalid selection for organization's offering clarity"),
    (0, express_validator_1.body)("formData.decentralizedDecisionMaking")
        .notEmpty()
        .withMessage("Decentralized decision making status is required")
        .customSanitizer((value) => {
        if (typeof value === "string") {
            return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        }
        return value;
    })
        .isIn(["Yes", "No", "Unsure"])
        .withMessage("Invalid selection for decentralized decision making"),
    // Impact fields
    (0, express_validator_1.body)("formData.uniqueValue")
        .notEmpty()
        .withMessage("Unique value is required")
        .isString()
        .withMessage("Unique value must be a string")
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage("Unique value must be between 10 and 1000 characters"),
    (0, express_validator_1.body)("formData.marketImpact")
        .notEmpty()
        .withMessage("Market impact is required")
        .isString()
        .withMessage("Market impact must be a string")
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage("Market impact must be between 10 and 1000 characters"),
];
// Scholars program validation
exports.validateScholarsSubmission = [
    (0, express_validator_1.body)("formData")
        .isObject()
        .withMessage("formData must be an object")
        .notEmpty()
        .withMessage("formData cannot be empty"),
    (0, express_validator_1.body)("formData.name")
        .notEmpty()
        .withMessage("Name is required")
        .isString()
        .withMessage("Name must be a string")
        .trim()
        .escape()
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters"),
    (0, express_validator_1.body)("formData.email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email must be a valid email address")
        .normalizeEmail(),
    (0, express_validator_1.body)("formData.interests")
        .custom((value) => {
        if (Array.isArray(value))
            return value.length > 0;
        if (typeof value === "string")
            return value.trim().length > 0;
        return false;
    })
        .withMessage("Interests are required and must be a non-empty string or array"),
    (0, express_validator_1.body)("formData.details")
        .optional()
        .isString()
        .withMessage("Details must be a string")
        .trim()
        .escape()
        .isLength({ max: 1000 })
        .withMessage("Details must be at most 1000 characters"),
    (0, express_validator_1.body)("formData.newsletter")
        .notEmpty()
        .withMessage("Newsletter preference is required")
        .custom((value) => {
        return value === "yes" || value === "no" || typeof value === "boolean";
    })
        .withMessage("Newsletter must be 'yes', 'no', or a boolean value"),
];
// Guide submission validation
exports.validateGuideSubmission = [
    (0, express_validator_1.body)("formData").isObject().withMessage("formData must be an object"),
    (0, express_validator_1.body)("formData.name")
        .notEmpty()
        .withMessage("Name is required")
        .isString()
        .withMessage("Name must be a string")
        .trim()
        .escape()
        .isLength({ min: 1, max: 100 })
        .withMessage("Name must be between 1 and 100 characters"),
    (0, express_validator_1.body)("formData.email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email must be a valid email address")
        .normalizeEmail(),
    (0, express_validator_1.body)("formData.daoInterests")
        .notEmpty()
        .withMessage("DAO interests are required")
        .isString()
        .withMessage("DAO interests must be a string")
        .trim()
        .escape()
        .isLength({ min: 1, max: 100 })
        .withMessage("DAO interests must be between 1 and 100 characters"),
    (0, express_validator_1.body)("formData.interests")
        .isArray({ min: 1 })
        .withMessage("At least one interest is required")
        .custom((interests) => {
        return interests.every((interest) => typeof interest === "string");
    })
        .withMessage("Each interest must be a string"),
    (0, express_validator_1.body)("formData.personalValues")
        .notEmpty()
        .withMessage("Personal values are required")
        .isString()
        .withMessage("Personal values must be a string")
        .trim()
        .escape()
        .isLength({ min: 1, max: 2000 })
        .withMessage("Personal values must be between 1 and 2000 characters"),
    (0, express_validator_1.body)("formData.digitalLink")
        .notEmpty()
        .withMessage("Digital link is required")
        .isString()
        .withMessage("Digital link must be a string")
        .trim()
        .isURL()
        .withMessage("Digital link must be a valid URL"),
];
// Partner submission validation
exports.validatePartnerSubmission = [
    (0, express_validator_1.body)("formData")
        .isObject()
        .withMessage("formData must be an object")
        .notEmpty()
        .withMessage("formData cannot be empty"),
    (0, express_validator_1.body)("formData.name")
        .notEmpty()
        .withMessage("Name is required")
        .isString()
        .withMessage("Name must be a string")
        .trim()
        .escape()
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters"),
    (0, express_validator_1.body)("formData.email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email must be a valid email address")
        .normalizeEmail(),
    (0, express_validator_1.body)("formData.companyName")
        .notEmpty()
        .withMessage("Company Name is required")
        .isString()
        .withMessage("Company Name must be a string")
        .trim()
        .escape()
        .isLength({ min: 2, max: 200 })
        .withMessage("Company Name must be between 2 and 200 characters"),
    (0, express_validator_1.body)("formData.interests")
        .custom((value) => {
        if (Array.isArray(value))
            return value.length > 0;
        if (typeof value === "string")
            return value.trim().length > 0;
        return false;
    })
        .withMessage("Interests are required and must be a non-empty string or array"),
    (0, express_validator_1.body)("formData.details")
        .optional()
        .isString()
        .withMessage("Details must be a string")
        .trim()
        .escape()
        .isLength({ max: 1000 })
        .withMessage("Details must be at most 1000 characters"),
    (0, express_validator_1.body)("formData.newsletter")
        .notEmpty()
        .withMessage("Newsletter preference is required")
        .custom((value) => {
        return value === "yes" || value === "no" || typeof value === "boolean";
    })
        .withMessage("Newsletter must be 'yes', 'no', or a boolean value"),
];
