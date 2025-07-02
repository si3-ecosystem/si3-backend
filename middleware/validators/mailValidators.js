import { body } from "express-validator";

const validateDiversityMail = [
  body("formData").isObject().withMessage("formData must be an object"),

  // Personal Information
  body("formData.selfIdentity")
    .notEmpty()
    .withMessage("Self Identity is required")
    .isString()
    .withMessage("Self Identity must be a string")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Self Identity must be at most 100 characters"),

  body("formData.selfIdentityCustom")
    .optional()
    .isString()
    .withMessage("Custom Identity must be a string")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Custom Identity must be at most 100 characters"),

  body("formData.ageRange")
    .notEmpty()
    .withMessage("Age Range is required")
    .isString()
    .withMessage("Age Range must be a string")
    .trim()
    .isLength({ max: 50 })
    .withMessage("Age Range must be at most 50 characters"),

  body("formData.ethnicity")
    .notEmpty()
    .withMessage("Ethnicity is required")
    .custom((value) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return false;
    })
    .withMessage("Ethnicity must be provided"),

  body("formData.disability")
    .notEmpty()
    .withMessage("Disability status is required")
    .custom((value) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return false;
    })
    .withMessage("Disability status must be provided"),

  body("formData.sexualOrientation")
    .notEmpty()
    .withMessage("Sexual Orientation is required")
    .isString()
    .withMessage("Sexual Orientation must be a string")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Sexual Orientation must be at most 100 characters"),

  body("formData.equityScale")
    .notEmpty()
    .withMessage("Equity Scale is required")
    .isInt({ min: 1, max: 10 })
    .withMessage("Equity Scale must be an integer between 1 and 10"),

  // Optional fields
  body("formData.improvementSuggestions")
    .optional()
    .isString()
    .withMessage("Improvement Suggestions must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Improvement Suggestions must be at most 1000 characters"),

  body("formData.grantProvider")
    .optional()
    .isString()
    .withMessage("Grant Provider must be a string")
    .trim()
    .isLength({ max: 200 })
    .withMessage("Grant Provider must be at most 200 characters"),

  body("formData.grantRound")
    .optional()
    .isString()
    .withMessage("Grant Round must be a string")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Grant Round must be at most 100 characters"),

  body("formData.suggestions")
    .optional()
    .isString()
    .withMessage("Suggestions must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Suggestions must be at most 1000 characters"),

  body("formData.activeGrantsParticipated")
    .optional()
    .isString()
    .withMessage("Active Grants Participated must be a string")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Active Grants Participated must be at most 100 characters"),

  // Accessibility fields
  body("formData.offeringClear")
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

  body("formData.claritySuggestions")
    .optional()
    .isString()
    .withMessage("Clarity suggestions must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Clarity suggestions must be at most 1000 characters"),

  body("formData.engagementChannels")
    .custom((value) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return false;
    })
    .withMessage("At least one engagement channel must be selected")
    .customSanitizer((value) => {
      if (typeof value === "string" && value.trim().length > 0) {
        return [value];
      }
      return value;
    }),

  // Transparency fields
  body("formData.decentralizedDecisionMaking")
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

  body("formData.hasRoadmap")
    .notEmpty()
    .withMessage("Roadmap status is required")
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    })
    .isIn(["Yes", "No", "Unsure"])
    .withMessage("Invalid selection for roadmap status"),

  body("formData.reportsFinancials")
    .notEmpty()
    .withMessage("Financial reporting status is required")
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    })
    .isIn(["Yes", "No", "Unsure"])
    .withMessage("Invalid selection for financial reporting status"),

  body("formData.runsGrantPrograms")
    .notEmpty()
    .withMessage("Grant programs status is required")
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    })
    .isIn(["Yes", "No"])
    .withMessage("Invalid selection for grant programs status"),

  body("formData.grantRoundParticipation")
    .optional()
    .isString()
    .withMessage("Grant round participation must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Grant round participation must be at most 500 characters"),

  body("formData.grantExperience")
    .optional()
    .isString()
    .withMessage("Grant experience must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Grant experience must be at most 1000 characters"),

  // Inclusivity fields
  body("formData.diversityInitiatives")
    .notEmpty()
    .withMessage("Diversity initiatives status is required")
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    })
    .isIn(["Yes", "No", "Unsure"])
    .withMessage("Invalid selection for diversity initiatives"),

  body("formData.diverseTeam")
    .notEmpty()
    .withMessage("Diverse team status is required")
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    })
    .isIn(["Yes", "No", "Unsure"])
    .withMessage("Invalid selection for diverse team"),

  body("formData.underrepresentedLeadership")
    .notEmpty()
    .withMessage("Underrepresented leadership status is required")
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    })
    .isIn(["Yes", "No", "Unsure"])
    .withMessage("Invalid selection for underrepresented leadership"),

  body("formData.highlightsUnderrepresented")
    .notEmpty()
    .withMessage("Highlights underrepresented status is required")
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    })
    .isIn(["Yes", "No", "Unsure"])
    .withMessage("Invalid selection for highlights underrepresented"),

  // Impact fields
  body("formData.uniqueValue")
    .notEmpty()
    .withMessage("Unique value is required")
    .isString()
    .withMessage("Unique value must be a string")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Unique value must be between 10 and 1000 characters"),

  body("formData.marketImpact")
    .notEmpty()
    .withMessage("Market impact is required")
    .isString()
    .withMessage("Market impact must be a string")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Market impact must be between 10 and 1000 characters"),
];

const validateScholarsSubmission = [
  body("formData")
    .isObject()
    .withMessage("formData must be an object")
    .notEmpty()
    .withMessage("formData cannot be empty"),

  body("formData.name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("formData.email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address")
    .normalizeEmail(),

  body("formData.interests")
    .custom((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "string") return value.trim().length > 0;
      return false;
    })
    .withMessage(
      "Interests are required and must be a non-empty string or array"
    ),

  body("formData.details")
    .optional()
    .isString()
    .withMessage("Details must be a string")
    .trim()
    .escape()
    .isLength({ max: 1000 })
    .withMessage("Details must be at most 1000 characters"),

  body("formData.newsletter")
    .notEmpty()
    .withMessage("Newsletter preference is required")
    .custom((value) => {
      return value === "yes" || value === "no" || typeof value === "boolean";
    })
    .withMessage("Newsletter must be 'yes', 'no', or a boolean value"),
];

const validatePartnerSubmission = [
  body("formData.name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("formData.email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address")
    .normalizeEmail(),

  body("formData.companyName")
    .notEmpty()
    .withMessage("Company Name is required")
    .isString()
    .withMessage("Company Name must be a string")
    .trim()
    .escape()
    .isLength({ min: 2, max: 200 })
    .withMessage("Company Name must be between 2 and 200 characters"),

  body("formData.interests")
    .custom((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "string") return value.trim().length > 0;
      return false;
    })
    .withMessage(
      "Interests are required and must be a non-empty string or array"
    ),

  body("formData.details")
    .optional()
    .isString()
    .withMessage("Details must be a string")
    .trim()
    .escape()
    .isLength({ max: 1000 })
    .withMessage("Details must be at most 1000 characters"),

  body("formData.newsletter")
    .notEmpty()
    .withMessage("Newsletter preference is required")
    .isBoolean()
    .withMessage("Newsletter must be a boolean value"),
];

const validateGuideSubmission = [
  body("formData").isObject().withMessage("formData must be an object"),

  body("formData.name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .escape()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),

  body("formData.email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address")
    .normalizeEmail(),

  body("formData.daoInterests")
    .notEmpty()
    .withMessage("daoInterests are required")
    .isString()
    .withMessage("daoInterests must be a string")
    .trim()
    .escape()
    .isLength({ min: 1, max: 100 })
    .withMessage("daoInterests must be between 1 and 100 characters"),

  body("formData.interests")
    .isArray({ min: 1 })
    .withMessage("At least one interest is required")
    .custom((interests) => {
      return interests.every((interest) => typeof interest === "string");
    })
    .withMessage("Each interest must be a string"),

  body("formData.personalValues")
    .notEmpty()
    .withMessage("Personal values are required")
    .isString()
    .withMessage("Personal values must be a string")
    .trim()
    .escape()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Personal values must be between 1 and 2000 characters"),

  body("formData.digitalLink")
    .notEmpty()
    .withMessage("Digital link is required")
    .isString()
    .withMessage("Digital link must be a string")
    .trim(),
];

const validateBulkEmail = [
  body("recipients")
    .isArray({ min: 1, max: 100 })
    .withMessage("Recipients must be an array with 1-100 items"),

  body("recipients.*.email")
    .isEmail()
    .withMessage("Each recipient must have a valid email")
    .normalizeEmail(),

  body("recipients.*.name")
    .optional()
    .isString()
    .withMessage("Recipient name must be a string")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Recipient name must be at most 100 characters"),

  body("subject")
    .notEmpty()
    .withMessage("Subject is required")
    .isString()
    .withMessage("Subject must be a string")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Subject must be between 1 and 200 characters"),

  body("htmlContent")
    .notEmpty()
    .withMessage("Email content is required")
    .isString()
    .withMessage("Email content must be a string")
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage("Email content must be between 1 and 50000 characters"),

  body("senderName")
    .optional()
    .isString()
    .withMessage("Sender name must be a string")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Sender name must be at most 100 characters"),

  body("emailType")
    .optional()
    .isIn(["basic", "guide", "partner", "diversity", "temp"])
    .withMessage(
      "Email type must be one of: basic, guide, partner, diversity, temp"
    ),
];

export {
  validateBulkEmail,
  validateDiversityMail,
  validateGuideSubmission,
  validatePartnerSubmission,
  validateScholarsSubmission,
};
