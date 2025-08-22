import { Router } from "express";
import { unlockWebhookController } from "../controllers/webhookController";
import { validateUnlockWebhook } from "../middleware/webhookMiddleware";

const router = Router();

// Webhook routes
router.get("/unlock", unlockWebhookController.verifyIntent);
router.post("/unlock", validateUnlockWebhook, unlockWebhookController.handlePurchase);

// Management routes
router.post("/unlock/subscribe", unlockWebhookController.subscribe);
router.post("/unlock/unsubscribe", unlockWebhookController.unsubscribe);

// Status and info routes
router.get("/unlock/info", unlockWebhookController.getInfo);
router.post("/unlock/reinitialize", unlockWebhookController.reinitialize);

// Test routes - Fix: Use two separate routes instead of optional parameter
router.get("/unlock/test-auth", unlockWebhookController.testAuth);
router.get("/unlock/test-auth/:tokenId", unlockWebhookController.testAuth);
router.post("/unlock/test-ethermail", unlockWebhookController.testEtherMail);

export default router;