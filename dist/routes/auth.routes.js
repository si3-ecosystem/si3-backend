"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
// Stub function for approveUser
const approveUser = (req, res) => {
    res.status(200).json({ message: 'User approved' });
};
const protectMiddleware_1 = require("../middleware/protectMiddleware");
const router = (0, express_1.default)();
router.get('/approve', approveUser);
router.post('/login', authController_1.verifyEmailOTP);
router.get('/validate-token', protectMiddleware_1.protect, authController_1.checkAuth);
exports.default = router;
