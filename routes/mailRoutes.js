import express from "express";

import {
  sendBulkEmail,
  sendBasicEmail,
  sendGuideSubmissionEmail,
  sendPartnerProgramSubmissionEmail,
  sendScholarsProgramSubmissionEmail,
  sendDiversityTrackerSubmissionEmail,
} from "../controllers/mailController.js";

import {
  validateBulkEmail,
  validateDiversityMail,
  validateGuideSubmission,
  validatePartnerSubmission,
  validateScholarsProgramSubmission,
} from "../middleware/validators/mailValidators.js";
import validationMiddleware from "../middleware/validationMiddleware.js";

const router = express.Router();

router.post("/basic", sendBasicEmail);

router.post(
  "/partners",
  validatePartnerSubmission,
  validationMiddleware,
  sendPartnerProgramSubmissionEmail
);

router.post(
  "/scholars",
  validateScholarsProgramSubmission,
  validationMiddleware,
  sendScholarsProgramSubmissionEmail
);

router.post(
  "/guides",
  validateGuideSubmission,
  validationMiddleware,
  sendGuideSubmissionEmail
);

router.post(
  "/diversity-tracker",
  validateDiversityMail,
  validationMiddleware,
  sendDiversityTrackerSubmissionEmail
);

router.post("/bulk", validateBulkEmail, validationMiddleware, sendBulkEmail);

export default router;
