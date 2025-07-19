"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.checkAuth = exports.refreshToken = exports.updateProfile = exports.getMe = exports.logout = exports.disconnectWallet = exports.connectWallet = exports.verifyWalletSignature = exports.requestWalletSignature = exports.verifyEmailOTP = exports.sendEmailOTP = void 0;
const ethers_1 = require("ethers");
const usersModel_1 = __importStar(require("../models/usersModel"));
const protonMail_1 = __importDefault(require("../config/protonMail"));
const redisHelper_1 = __importDefault(require("../helpers/redisHelper"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const authUtils_1 = __importDefault(require("../utils/authUtils"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const emailTemplates_1 = require("../utils/emailTemplates");
// Constants for Redis keys and TTL
const OTP_KEY_PREFIX = "auth:otp:";
const NONCE_KEY_PREFIX = "auth:nonce:";
const RATE_LIMIT_KEY_PREFIX = "auth:rate_limit:";
const OTP_TTL_SECONDS = parseInt(process.env.OTP_TTL_SECONDS || "600", 10); // 10 minutes
const NONCE_TTL_SECONDS = parseInt(process.env.NONCE_TTL_SECONDS || "600", 10); // 10 minutes
const RATE_LIMIT_SECONDS = parseInt(process.env.RATE_LIMIT_SECONDS || "60", 10); // 1 minute
/**
 * Send OTP to email for passwordless login
 */
exports.sendEmailOTP = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    // Rate limiting
    const rateLimitKey = `${RATE_LIMIT_KEY_PREFIX}email:${email}`;
    const isLimited = yield redisHelper_1.default.cacheGet(rateLimitKey);
    if (isLimited) {
        return next(AppError_1.default.tooManyRequests("Please wait before requesting another OTP"));
    }
    // Generate OTP
    const otp = authUtils_1.default.generateOTP(6);
    // Store OTP in Redis
    const otpKey = `${OTP_KEY_PREFIX}${email}`;
    yield redisHelper_1.default.cacheSet(otpKey, otp, OTP_TTL_SECONDS);
    // Set rate limit
    yield redisHelper_1.default.cacheSet(rateLimitKey, "1", RATE_LIMIT_SECONDS);
    const applicantConfirmationHtml = (0, emailTemplates_1.otpEmailTemplate)(otp, email);
    // In production, integrate with your email service:
    yield protonMail_1.default.sendEmail({
        senderName: "SI<3> Guides",
        senderEmail: protonMail_1.default.getSenderEmail("basic"),
        toName: email,
        toEmail: email,
        subject: "OTP for SI<3> login",
        htmlContent: applicantConfirmationHtml,
        emailType: "basic",
    });
    res.status(200).json({
        status: "success",
        message: "OTP sent to your email address",
        data: {
            email,
            expiresIn: OTP_TTL_SECONDS,
        },
    });
}));
/**
 * Verify OTP and login/register user
 */
exports.verifyEmailOTP = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    // Get OTP from Redis
    const otpKey = `${OTP_KEY_PREFIX}${email}`;
    const storedOTP = yield redisHelper_1.default.cacheGet(otpKey);
    if (!storedOTP) {
        return next(AppError_1.default.badRequest("OTP has expired or is invalid"));
    }
    if (Number(storedOTP) !== Number(otp)) {
        return next(AppError_1.default.badRequest("Invalid OTP"));
    }
    // Clear OTP from Redis
    yield redisHelper_1.default.cacheDelete(otpKey);
    // Find or create user
    let user = yield usersModel_1.default.findOne({ email });
    let isNewUser = false;
    const loginTime = new Date().toISOString();
    const ip = req.headers["x-forwarded-for"] || "Unknown";
    if (!user) {
        user = new usersModel_1.default({
            email,
            isVerified: true,
            lastLogin: new Date(),
            roles: [usersModel_1.UserRole.SCHOLAR],
        });
        yield user.save();
        isNewUser = true;
        // Send welcome email
        const welcomeHtml = (0, emailTemplates_1.welcomeEmailTemplate)();
        yield protonMail_1.default.sendEmail({
            senderName: "SI U Team",
            senderEmail: protonMail_1.default.getSenderEmail("basic"),
            toName: email,
            toEmail: email,
            subject: "Welcome to SI U",
            htmlContent: welcomeHtml,
            emailType: "basic",
        });
    }
    else {
        user.isVerified = true;
        user.lastLogin = new Date();
        yield user.save({ validateBeforeSave: false });
        // Send login alert
        const loginHtml = (0, emailTemplates_1.loginAlertEmailTemplate)({
            email,
            time: loginTime,
            location: "Unknown",
            ipAddress: Array.isArray(ip) ? ip[0] : ip,
        });
        yield protonMail_1.default.sendEmail({
            senderName: "SI U Security",
            senderEmail: protonMail_1.default.getSenderEmail("basic"),
            toName: email,
            toEmail: email,
            subject: "New Login Detected",
            htmlContent: loginHtml,
            emailType: "basic",
        });
    }
    // Finally generate and send token
    authUtils_1.default.createSendToken(user, 200, res, isNewUser ? "Account created successfully" : "Login successful");
}));
/**
 * Request wallet signature message
 */
exports.requestWalletSignature = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { wallet_address } = req.body;
    // Rate limiting
    const rateLimitKey = `${RATE_LIMIT_KEY_PREFIX}wallet:${wallet_address}`;
    const isLimited = yield redisHelper_1.default.cacheGet(rateLimitKey);
    if (isLimited) {
        return next(AppError_1.default.tooManyRequests("Please wait before requesting another signature"));
    }
    // Generate nonce
    const nonce = authUtils_1.default.generateNonce();
    const message = `Sign this message to authenticate with SI U\n\nNonce: ${nonce}`;
    // Store nonce in Redis
    const nonceKey = `${NONCE_KEY_PREFIX}${wallet_address}`;
    yield redisHelper_1.default.cacheSet(nonceKey, nonce, NONCE_TTL_SECONDS);
    // Set rate limit
    yield redisHelper_1.default.cacheSet(rateLimitKey, "1", RATE_LIMIT_SECONDS);
    res.status(200).json({
        status: "success",
        data: {
            message,
            wallet_address,
            expiresIn: NONCE_TTL_SECONDS,
        },
    });
}));
/**
 * Verify wallet signature and login/register user
 */
exports.verifyWalletSignature = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { wallet_address, signature } = req.body;
    // Get nonce from Redis
    const nonceKey = `${NONCE_KEY_PREFIX}${wallet_address}`;
    const storedNonce = yield redisHelper_1.default.cacheGet(nonceKey);
    if (!storedNonce) {
        return next(AppError_1.default.badRequest("Nonce has expired or is invalid"));
    }
    // Verify signature
    const expectedMessage = `Sign this message to authenticate with SI U\n\nNonce: ${storedNonce}`;
    let recoveredAddress;
    try {
        recoveredAddress = ethers_1.ethers.utils.verifyMessage(expectedMessage, signature); // ethers v5 syntax
    }
    catch (error) {
        return next(AppError_1.default.badRequest("Invalid signature format"));
    }
    if (recoveredAddress.toLowerCase() !== wallet_address.toLowerCase()) {
        return next(AppError_1.default.unauthorized("Signature verification failed"));
    }
    // Clear nonce from Redis
    yield redisHelper_1.default.cacheDelete(nonceKey);
    // Find or create user
    let user = yield usersModel_1.default.findOne({
        wallet_address: wallet_address.toLowerCase(),
    });
    let isNewUser = false;
    if (!user) {
        // Create new user with temporary email
        const tempEmail = `${wallet_address.toLowerCase()}@wallet.temp`;
        user = new usersModel_1.default({
            email: tempEmail,
            wallet_address: wallet_address.toLowerCase(),
            isVerified: true,
            roles: [usersModel_1.UserRole.SCHOLAR], // Default role
            lastLogin: new Date(),
        });
        yield user.save();
        isNewUser = true;
    }
    else {
        // Update existing user
        user.lastLogin = new Date();
        yield user.save({ validateBeforeSave: false });
    }
    // Generate and send token
    authUtils_1.default.createSendToken(user, 200, res, isNewUser ? "Account created successfully" : "Login successful");
}));
/**
 * Connect wallet to existing user account
 */
exports.connectWallet = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { wallet_address, signature } = req.body;
    const user = req.user;
    // Get nonce from Redis
    const nonceKey = `${NONCE_KEY_PREFIX}${wallet_address}`;
    const storedNonce = yield redisHelper_1.default.cacheGet(nonceKey);
    if (!storedNonce) {
        return next(AppError_1.default.badRequest("Nonce has expired or is invalid"));
    }
    // Verify signature
    const expectedMessage = `Sign this message to authenticate with SI U\n\nNonce: ${storedNonce}`;
    let recoveredAddress;
    try {
        recoveredAddress = ethers_1.ethers.utils.verifyMessage(expectedMessage, signature); // ethers v5 syntax
    }
    catch (error) {
        return next(AppError_1.default.badRequest("Invalid signature format"));
    }
    if (recoveredAddress.toLowerCase() !== wallet_address.toLowerCase()) {
        return next(AppError_1.default.unauthorized("Signature verification failed"));
    }
    // Check if wallet is already connected to another user
    const existingUser = yield usersModel_1.default.findOne({
        wallet_address: wallet_address.toLowerCase(),
        _id: { $ne: user._id },
    });
    if (existingUser) {
        return next(AppError_1.default.conflict("Wallet address is already connected to another account"));
    }
    // Connect wallet to user
    user.wallet_address = wallet_address.toLowerCase();
    yield user.save();
    // Clear nonce from Redis
    yield redisHelper_1.default.cacheDelete(nonceKey);
    // Generate new token with updated user data
    authUtils_1.default.createSendToken(user, 200, res, "Wallet connected successfully");
}));
/**
 * Disconnect wallet from user account
 */
exports.disconnectWallet = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user.wallet_address) {
        return next(AppError_1.default.badRequest("No wallet connected to disconnect"));
    }
    // Remove wallet from user
    user.wallet_address = undefined;
    yield user.save();
    // Generate new token with updated user data
    authUtils_1.default.createSendToken(user, 200, res, "Wallet disconnected successfully");
}));
/**
 * Logout user
 */
exports.logout = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Clear authentication cookie
    authUtils_1.default.clearAuthCookie(res);
    res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
}));
/**
 * Get current user profile
 */
exports.getMe = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userResponse = {
        id: user._id,
        email: user.email,
        roles: user.roles,
        isVerified: user.isVerified,
        companyName: user.companyName,
        companyAffiliation: user.companyAffiliation,
        interests: user.interests,
        personalValues: user.personalValues,
        digitalLinks: user.digitalLinks,
        details: user.details,
        newsletter: user.newsletter,
        wallet_address: user.wallet_address,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
    res.status(200).json({
        status: "success",
        data: {
            user: userResponse,
        },
    });
}));
/**
 * Update user profile
 */
exports.updateProfile = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const allowedFields = [
        "companyName",
        "companyAffiliation",
        "interests",
        "personalValues",
        "digitalLinks",
        "details",
        "newsletter",
        "roles",
    ];
    // Filter out fields that are not allowed to be updated
    const updateData = {};
    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });
    // Only allow admins to update roles
    if (updateData.roles && !user.roles.includes(usersModel_1.UserRole.ADMIN)) {
        delete updateData.roles;
    }
    // Update user
    Object.assign(user, updateData);
    yield user.save();
    // Generate new token with updated user data
    authUtils_1.default.createSendToken(user, 200, res, "Profile updated successfully");
}));
/**
 * Refresh authentication token
 */
exports.refreshToken = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // Update last login
    user.lastLogin = new Date();
    yield user.save({ validateBeforeSave: false });
    // Generate new token
    authUtils_1.default.createSendToken(user, 200, res, "Token refreshed successfully");
}));
/**
 * Check authentication status
 */
exports.checkAuth = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = authUtils_1.default.extractToken(req.headers.authorization, req.cookies);
    if (!token) {
        res.status(200).json({
            status: "success",
            data: {
                isAuthenticated: false,
            },
        });
        return;
    }
    try {
        const decoded = authUtils_1.default.verifyToken(token);
        const user = yield usersModel_1.default.findById(decoded._id);
        if (!user || !user.isVerified) {
            res.status(200).json({
                status: "success",
                data: {
                    isAuthenticated: false,
                },
            });
            return;
        }
        res.status(200).json({
            status: "success",
            data: {
                isAuthenticated: true,
                user: {
                    id: user._id,
                    email: user.email,
                    roles: user.roles,
                    isVerified: user.isVerified,
                },
            },
        });
    }
    catch (error) {
        res.status(200).json({
            status: "success",
            data: {
                isAuthenticated: false,
            },
        });
    }
}));
