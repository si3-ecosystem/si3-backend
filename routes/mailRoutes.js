import express from "express";

import {
  sendBasicEmail,
  sendDiversityTrackerSubmissionEmail,
  sendGuideSubmissionEmail,
  sendPartnerProgramSubmissionEmail,
  sendTempEmail,
} from "../controllers/mailController.js";

import {
  validateDiversityMail,
  validatePartnerSubmission,
  validateGuideSubmission,
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

router.post("/temp", sendTempEmail);

export default router;
