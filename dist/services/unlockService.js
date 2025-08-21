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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnlockService = void 0;
const ethers_1 = require("ethers");
const crypto_1 = __importDefault(require("crypto"));
class UnlockService {
    constructor() {
        this.authToken = null;
        this.tokenExpiry = null;
    }
    authenticateWithUnlock() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!process.env.UNLOCK_PRIVATE_KEY) {
                throw new Error("UNLOCK_PRIVATE_KEY environment variable is required");
            }
            try {
                const wallet = new ethers_1.ethers.Wallet(process.env.UNLOCK_PRIVATE_KEY);
                const nonce = crypto_1.default.randomBytes(8).toString("hex");
                const issuedAt = new Date().toISOString();
                const siweMessage = [
                    `${process.env.WEBHOOK_BASE_URL || 'localhost'} wants you to sign in with your Ethereum account:`,
                    wallet.address,
                    ``,
                    `Sign in to Unlock Protocol`,
                    ``,
                    `URI: ${process.env.WEBHOOK_BASE_URL || 'http://localhost:8080'}`,
                    `Version: 1`,
                    `Chain ID: ${process.env.NETWORK_ID || '11155111'}`,
                    `Nonce: ${nonce}`,
                    `Issued At: ${issuedAt}`,
                ].join("\n");
                const signature = yield wallet.signMessage(siweMessage);
                const response = yield fetch(`https://locksmith.unlock-protocol.com/v2/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: siweMessage,
                        signature,
                    }),
                });
                if (!response.ok) {
                    throw new Error(`Authentication failed: ${yield response.text()}`);
                }
                const data = yield response.json();
                this.authToken = data.accessToken;
                this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
                console.log("✅ Successfully authenticated with Unlock Protocol");
                return data.accessToken;
            }
            catch (error) {
                console.error("❌ Error authenticating with Unlock:", error);
                throw error;
            }
        });
    }
    getValidAuthToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
                console.log("🔄 Auth token expired or missing, refreshing...");
                return yield this.authenticateWithUnlock();
            }
            return this.authToken;
        });
    }
    getBuyerMetadata(tokenId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
            try {
                const token = yield this.getValidAuthToken();
                const response = yield fetch(`https://locksmith.unlock-protocol.com/v2/api/metadata/${process.env.NETWORK_ID}/locks/${process.env.LOCK_ADDRESS}/keys/${tokenId}`, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    const errorText = yield response.text();
                    console.error(`Failed to fetch metadata: ${response.status} ${errorText}`);
                    throw new Error(`Failed to fetch metadata: ${response.status} ${errorText}`);
                }
                const metadata = yield response.json();
                console.log("📊 Retrieved buyer metadata:", JSON.stringify(metadata, null, 2));
                const email = ((_b = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.userMetadata) === null || _a === void 0 ? void 0 : _a.protected) === null || _b === void 0 ? void 0 : _b.email) || ((_d = (_c = metadata === null || metadata === void 0 ? void 0 : metadata.userMetadata) === null || _c === void 0 ? void 0 : _c.public) === null || _d === void 0 ? void 0 : _d.email);
                const first_name = ((_f = (_e = metadata === null || metadata === void 0 ? void 0 : metadata.userMetadata) === null || _e === void 0 ? void 0 : _e.protected) === null || _f === void 0 ? void 0 : _f['first name']) || ((_h = (_g = metadata === null || metadata === void 0 ? void 0 : metadata.userMetadata) === null || _g === void 0 ? void 0 : _g.public) === null || _h === void 0 ? void 0 : _h['first name']);
                const last_name = ((_k = (_j = metadata === null || metadata === void 0 ? void 0 : metadata.userMetadata) === null || _j === void 0 ? void 0 : _j.protected) === null || _k === void 0 ? void 0 : _k['last name']) || ((_m = (_l = metadata === null || metadata === void 0 ? void 0 : metadata.userMetadata) === null || _l === void 0 ? void 0 : _l.public) === null || _m === void 0 ? void 0 : _m['last name']);
                const telegramHandle = (_p = (_o = metadata === null || metadata === void 0 ? void 0 : metadata.userMetadata) === null || _o === void 0 ? void 0 : _o.protected) === null || _p === void 0 ? void 0 : _p['telegram username'];
                const eventDetails = (metadata === null || metadata === void 0 ? void 0 : metadata.ticket) ? {
                    eventName: metadata.name || "Event",
                    eventStartDate: metadata.ticket.event_start_date,
                    eventStartTime: metadata.ticket.event_start_time,
                    eventEndDate: metadata.ticket.event_end_date,
                    eventEndTime: metadata.ticket.event_end_time,
                    eventTimezone: metadata.ticket.event_timezone,
                    eventAddress: metadata.ticket.event_address,
                    isInPerson: metadata.ticket.event_is_in_person
                } : null;
                return {
                    email,
                    first_name,
                    last_name,
                    telegramHandle,
                    eventDetails,
                    tokenId: metadata.tokenId,
                    owner: metadata.owner,
                    lockAddress: metadata.lockAddress,
                    network: metadata.network,
                    metadata
                };
            }
            catch (error) {
                console.error("❌ Error fetching buyer metadata:", error);
                return {
                    email: null,
                    first_name: null,
                    last_name: null,
                    telegramHandle: null,
                    eventDetails: null,
                    metadata: null
                };
            }
        });
    }
    subscribeToPurchases() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!process.env.LOCK_ADDRESS || !process.env.WEBHOOK_URL) {
                throw new Error("LOCK_ADDRESS and WEBHOOK_URL must be configured");
            }
            const endpoint = `https://locksmith.unlock-protocol.com/api/hooks/${process.env.NETWORK_ID}/keys`;
            const formData = new URLSearchParams();
            formData.set("hub.topic", `https://locksmith.unlock-protocol.com/api/hooks/${process.env.NETWORK_ID}/keys?locks=${process.env.LOCK_ADDRESS}`);
            formData.set("hub.callback", process.env.WEBHOOK_URL);
            formData.set("hub.mode", "subscribe");
            formData.set("hub.secret", process.env.UNLOCK_SECRET || "unlock-is-best");
            const result = yield fetch(endpoint, {
                method: "POST",
                body: formData,
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            if (!result.ok) {
                throw new Error(`Failed to subscribe: ${yield result.text()}`);
            }
            console.log("✅ Subscribed successfully:", yield result.text());
        });
    }
    unsubscribeFromPurchases() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!process.env.LOCK_ADDRESS || !process.env.WEBHOOK_URL) {
                throw new Error("Missing configuration");
            }
            const endpoint = `https://locksmith.unlock-protocol.com/api/hooks/${process.env.NETWORK_ID}/keys`;
            const formData = new URLSearchParams();
            formData.set("hub.topic", `https://locksmith.unlock-protocol.com/api/hooks/${process.env.NETWORK_ID}/keys?locks=${process.env.LOCK_ADDRESS}`);
            formData.set("hub.callback", process.env.WEBHOOK_URL);
            formData.set("hub.mode", "unsubscribe");
            formData.set("hub.secret", process.env.UNLOCK_SECRET || "unlock-is-best");
            const result = yield fetch(endpoint, {
                method: "POST",
                body: formData,
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            if (!result.ok) {
                throw new Error(`Failed to unsubscribe: ${yield result.text()}`);
            }
        });
    }
}
exports.UnlockService = UnlockService;
