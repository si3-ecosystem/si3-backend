"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhookController_1 = require("../controllers/webhookController");
const webhookMiddleware_1 = require("../middleware/webhookMiddleware");
const router = (0, express_1.Router)();
// Webhook routes
router.get("/unlock", webhookController_1.unlockWebhookController.verifyIntent);
router.post("/unlock", webhookMiddleware_1.validateUnlockWebhook, webhookController_1.unlockWebhookController.handlePurchase);
// Management routes
router.post("/unlock/subscribe", webhookController_1.unlockWebhookController.subscribe);
router.post("/unlock/unsubscribe", webhookController_1.unlockWebhookController.unsubscribe);
// Status and info routes
router.get("/unlock/info", webhookController_1.unlockWebhookController.getInfo);
router.post("/unlock/reinitialize", webhookController_1.unlockWebhookController.reinitialize);
// Test routes - Fix: Use two separate routes instead of optional parameter
router.get("/unlock/test-auth", webhookController_1.unlockWebhookController.testAuth);
router.get("/unlock/test-auth/:tokenId", webhookController_1.unlockWebhookController.testAuth);
router.post("/unlock/test-ethermail", webhookController_1.unlockWebhookController.testEtherMail);
exports.default = router;
