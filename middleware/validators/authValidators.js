// middleware/validators/authValidators.js
import { body } from "express-validator";

const validateOTPRequest = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email must be at most 255 characters"),
];

const validateOTPVerification = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isString()
    .withMessage("OTP must be a string")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .matches(/^\d{6}$/)
    .withMessage("OTP must contain only numbers"),
];

export { validateOTPRequest, validateOTPVerification };
