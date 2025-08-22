"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUnlockWebhook = void 0;
const validateUnlockWebhook = (req, res, next) => {
    // Add any webhook validation logic here if needed
    // For now, just pass through
    next();
};
exports.validateUnlockWebhook = validateUnlockWebhook;
