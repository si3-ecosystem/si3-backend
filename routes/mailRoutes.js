import express from "express";

import {
  sendBasicEmail,
  sendDiversityTrackerSubmissionEmail,
  sendPartnerProgramSubmissionEmail,
} from "../controllers/mailController.js";

import {
  validateDiversityMail,
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

export default router;
