"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlockWebhookController = void 0;
const unlockService_1 = require("../services/unlockService");
const etherMailService_1 = require("../services/etherMailService");
const emailService_1 = require("../services/emailService");
class UnlockWebhookController {
    constructor() {
        // WebSub intent verification
        this.verifyIntent = (req, res) => {
            console.log("🔍 Intent verification request:", req.query);
            const challenge = req.query["hub.challenge"];
            const secret = req.query["hub.secret"];
            const mode = req.query["hub.mode"];
            // Verify the secret matches
            if (secret !== process.env.UNLOCK_SECRET) {
                console.error("❌ Invalid secret in verification request");
                res.status(400).send("Invalid secret");
                return;
            }
            if (mode === "subscribe") {
                console.log("✅ Webhook subscription verified successfully");
                res.status(200).send(challenge);
                return;
            }
            if (mode === "unsubscribe") {
                console.log("✅ Webhook unsubscription verified successfully");
                res.status(200).send(challenge);
                return;
            }
            res.status(400).send("Invalid mode");
        };
        // Handle purchase events
        this.handlePurchase = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log("🎫 Purchase event received:", JSON.stringify(req.body, null, 2));
                const eventData = req.body;
                const lockAddress = eventData === null || eventData === void 0 ? void 0 : eventData.lock;
                // Verify this is for our lock
                if (lockAddress && lockAddress.toLowerCase() !== ((_a = process.env.LOCK_ADDRESS) === null || _a === void 0 ? void 0 : _a.toLowerCase())) {
                    console.log("⚠️ Event is not for our lock, ignoring");
                    res.status(200).send("OK");
                    return;
                }
                let processedBuyers = [];
                // Process each key in the event data
                if (eventData.data && eventData.data.length > 0) {
                    for (const key of eventData.data) {
                        const tokenId = key.tokenId;
                        const transactionHash = key.transactionsHash[0];
                        if (tokenId) {
                            console.log(`📊 Fetching metadata for token ID: ${tokenId}`);
                            // Get buyer metadata
                            const buyerData = yield this.unlockService.getBuyerMetadata(tokenId);
                            if (buyerData.email || buyerData.first_name) {
                                processedBuyers.push(buyerData);
                                console.log(`👤 Buyer Name: ${buyerData.first_name || "Not provided"}`);
                                console.log(`📧 Buyer Email: ${buyerData.email || "Not provided"}`);
                                // Send notification email only if we have valid data (not null values)
                                if (buyerData.email !== null || buyerData.first_name !== null) {
                                    yield this.emailService.sendPurchaseNotification(buyerData, transactionHash);
                                }
                                // Add to EtherMail list if email exists
                                if (buyerData.email) {
                                    yield this.etherMailService.addToList(buyerData.email, buyerData.first_name, buyerData.last_name);
                                }
                            }
                            else {
                                console.log(`⚠️ No buyer data found for token ID: ${tokenId}`);
                            }
                        }
                    }
                }
                console.log(`🎉 Successfully processed ${processedBuyers.length} buyer(s)`);
                res.status(200).send("Event processed successfully");
            }
            catch (error) {
                next(error);
            }
        });
        // Subscribe to webhooks
        this.subscribe = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.unlockService.subscribeToPurchases();
                res.json({ success: true, message: "Subscription attempt completed" });
            }
            catch (error) {
                next(error);
            }
        });
        // Unsubscribe from webhooks
        this.unsubscribe = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.unlockService.unsubscribeFromPurchases();
                res.json({ success: true, message: "Unsubscribed successfully" });
            }
            catch (error) {
                next(error);
            }
        });
        // Test authentication
        this.testAuth = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const token = yield this.unlockService.getValidAuthToken();
                const result = {
                    success: true,
                    message: "Authentication successful",
                    hasToken: !!token
                };
                // If token ID provided, test fetching metadata
                if (req.params.tokenId) {
                    const buyerData = yield this.unlockService.getBuyerMetadata(req.params.tokenId);
                    result.testMetadata = buyerData;
                }
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        });
        // Get webhook info for debugging
        this.getInfo = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const unlockService = new unlockService_1.UnlockService();
                const token = yield unlockService.getValidAuthToken();
                res.json({
                    webhook: {
                        configured: !!(process.env.LOCK_ADDRESS && process.env.WEBHOOK_URL),
                        authenticated: !!token,
                        akashInfo: {
                            nodeEnv: process.env.NODE_ENV,
                            port: process.env.PORT,
                            webhookUrl: process.env.WEBHOOK_URL,
                            networkId: process.env.NETWORK_ID,
                            lockAddress: ((_a = process.env.LOCK_ADDRESS) === null || _a === void 0 ? void 0 : _a.substring(0, 10)) + '...',
                        },
                        uptime: process.uptime(),
                        timestamp: new Date().toISOString()
                    }
                });
            }
            catch (error) {
                res.status(500).json({ error: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error" });
            }
        });
        // Force reinitialize webhook subscription
        this.reinitialize = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const unlockService = new unlockService_1.UnlockService();
                // First authenticate
                yield unlockService.authenticateWithUnlock();
                // Then subscribe
                yield unlockService.subscribeToPurchases();
                res.json({
                    success: true,
                    message: "Webhook reinitialized successfully",
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        // Test EtherMail integration
        this.testEtherMail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, first_name } = req.body;
                if (!email) {
                    res.status(400).json({
                        success: false,
                        error: "Email is required in request body"
                    });
                    return;
                }
                console.log(`🧪 Testing EtherMail integration for: ${email} (${first_name || 'No name'})`);
                const result = yield this.etherMailService.addToList(email, first_name);
                res.json({
                    success: result,
                    message: result
                        ? `Successfully added ${email} to EtherMail list`
                        : `Failed to add ${email} to EtherMail list`,
                    email,
                    first_name: first_name || null
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.unlockService = new unlockService_1.UnlockService();
        this.etherMailService = new etherMailService_1.EtherMailService();
        this.emailService = new emailService_1.EmailService();
    }
}
exports.unlockWebhookController = new UnlockWebhookController();
