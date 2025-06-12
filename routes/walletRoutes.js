// routes/walletAuthRoutes.js
import express from "express";
import rateLimit from "express-rate-limit";

import {
  requestSignMessage,
  verifySignature,
  linkWallet,
  unlinkWallet,
} from "../controllers/walletAuthController.js";

import {
  validateSignMessageRequest,
  validateSignatureVerification,
} from "../middleware/validators/walletValidators.js";

import { protect } from "../middleware/protectMiddleware.js";
import validationMiddleware from "../middleware/validationMiddleware.js";

const router = express.Router();

// Rate limiting for wallet auth
const walletAuthLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message:
      "Too many wallet authentication attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post(
  "/request-sign-message",
  walletAuthLimit,
  validateSignMessageRequest,
  validationMiddleware,
  requestSignMessage
);

router.post(
  "/verify-signature",
  walletAuthLimit,
  validateSignatureVerification,
  validationMiddleware,
  verifySignature
);

// Protected routes (require email/OTP login first)
router.post(
  "/link-wallet",
  protect,
  validateSignatureVerification,
  validationMiddleware,
  linkWallet
);

router.delete("/unlink-wallet", protect, unlinkWallet);

export default router;
