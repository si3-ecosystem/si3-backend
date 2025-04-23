import { body } from "express-validator";

const validateDiversityMail = [
  body("toEmail")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),

  body("formData").isObject().withMessage("formData must be an object"),
  body("formData.selfIdentity")
    .notEmpty()
    .withMessage("Self Identity is required")
    .isString()
    .withMessage("Self Identity must be a string")
    .trim()
    .escape()
    .withMessage("Self Identity must be at most 100 characters"),

  body("formData.ageRange")
    .notEmpty()
    .withMessage("Age Range is required")
    .isString()
    .withMessage("Age Range must be a string")
    .trim()
    .escape()
    .withMessage("Age Range must be at most 50 characters"),

  body("formData.ethnicity")
    .notEmpty()
    .withMessage("Ethnicity is required")
    .isString()
    .withMessage("Ethnicity must be a string")
    .trim()
    .escape()
    .withMessage("Ethnicity must be at most 100 characters"),

  body("formData.disability")
    .notEmpty()
    .withMessage("Disability status is required")
    .isString()
    .withMessage("Disability status must be a string")
    .trim()
    .escape()
    .withMessage("Disability must be at most 100 characters"),

  body("formData.sexualOrientation")
    .notEmpty()
    .withMessage("Sexual Orientation is required")
    .isString()
    .withMessage("Sexual Orientation must be a string")
    .trim()
    .escape()
    .withMessage("Sexual Orientation must be at most 100 characters"),

  body("formData.equityScale")
    .notEmpty()
    .withMessage("Equity Scale is required")
    .isInt({ min: 1, max: 10 })
    .withMessage("Equity Scale must be an integer between 1 and 10"),

  body("formData.improvementSuggestions")
    .optional()
    .isString()
    .withMessage("Improvement Suggestions must be a string")
    .trim()
    .escape()
    .withMessage("Improvement Suggestions must be at most 500 characters"),

  body("formData.grantProvider")
    .optional()
    .isString()
    .withMessage("Grant Provider must be a string")
    .trim()
    .escape()
    .withMessage("Grant Provider must be at most 200 characters"),

  body("formData.grantRound")
    .optional()
    .isString()
    .withMessage("Grant Round must be a string")
    .trim()
    .escape()
    .withMessage("Grant Round must be at most 100 characters"),

  body("formData.suggestions")
    .optional()
    .isString()
    .withMessage("Suggestions must be a string")
    .trim()
    .escape()
    .withMessage("Suggestions must be at most 500 characters"),

  body("formData.activeGrantsParticipated")
    .optional()
    .isString()
    .withMessage("Active Grants Participated must be a string")
    .trim()
    .escape()
    .withMessage("Active Grants Participated must be at most 500 characters"),
];

const validatePartnerSubmission = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address")
    .normalizeEmail(),

  body("companyName")
    .notEmpty()
    .withMessage("Company Name is required")
    .isString()
    .withMessage("Company Name must be a string")
    .trim()
    .escape()
    .isLength({ min: 2, max: 200 })
    .withMessage("Company Name must be between 2 and 200 characters"),

  body("interests").notEmpty().withMessage("Interests are required"),

  body("details")
    .optional()
    .isString()
    .withMessage("Details must be a string")
    .trim()
    .escape()
    .isLength({ max: 1000 })
    .withMessage("Details must be at most 1000 characters"),

  body("newsletter")
    .notEmpty()
    .withMessage("Newsletter preference is required")
    .isBoolean()
    .withMessage("Newsletter must be a boolean value"),
];

export { validateDiversityMail, validatePartnerSubmission };
