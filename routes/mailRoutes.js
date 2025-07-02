import express from "express";

import {
  sendBulkEmail,
  sendBasicEmail,
  sendGuideSubmissionEmail,
  sendPartnerProgramSubmissionEmail,
  sendDiversityTrackerSubmissionEmail,
} from "../controllers/mailController.js";

import {
  validateBulkEmail,
  validateDiversityMail,
  validateGuideSubmission,
  validatePartnerSubmission,
} from "../middleware/validators/mailValidators.js";
import validationMiddleware from "../middleware/validationMiddleware.js";

const router = express.Router();

router.post("/basic", sendBasicEmail);

router.post(
  "/partners-program",
  validatePartnerSubmission,
  validationMiddleware,
  sendPartnerProgramSubmissionEmail
);

router.post(
  "/diversity-tracker",
  validateDiversityMail,
  validationMiddleware,
  sendDiversityTrackerSubmissionEmail
);

router.post(
  "/guides",
  validateGuideSubmission,
  validationMiddleware,
  sendGuideSubmissionEmail
);

router.post("/bulk", validateBulkEmail, validationMiddleware, sendBulkEmail);

export default router;
