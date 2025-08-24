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
exports.checkAuth = exports.refreshToken = exports.updateProfile = exports.getMe = exports.verifyEmailVerification = exports.debugEmailRequest = exports.sendEmailVerificationToNewEmail = exports.sendEmailVerification = exports.logout = exports.disconnectWallet = exports.connectWallet = exports.verifyWalletSignature = exports.requestWalletSignature = exports.verifyEmailOTP = exports.sendEmailOTP = void 0;
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
const RATE_LIMIT_SECONDS = 0; // Force disabled for debugging - was: parseInt(process.env.RATE_LIMIT_SECONDS || "0", 10);
/**
 * Send OTP to email for passwordless login
 */
exports.sendEmailOTP = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    // Rate limiting (configurable)
    const rateLimitKey = `${RATE_LIMIT_KEY_PREFIX}email:${email}`;
    if (RATE_LIMIT_SECONDS > 0) {
        const isLimited = yield redisHelper_1.default.cacheGet(rateLimitKey);
        if (isLimited) {
            return next(AppError_1.default.tooManyRequests(`Please wait ${RATE_LIMIT_SECONDS} seconds before requesting another OTP`));
        }
    }
    // Generate OTP
    const otp = authUtils_1.default.generateOTP(6);
    // Store OTP in Redis
    const otpKey = `${OTP_KEY_PREFIX}${email}`;
    yield redisHelper_1.default.cacheSet(otpKey, otp, OTP_TTL_SECONDS);
    // Set rate limit (only if enabled)
    if (RATE_LIMIT_SECONDS > 0) {
        yield redisHelper_1.default.cacheSet(rateLimitKey, "1", RATE_LIMIT_SECONDS);
    }
    const applicantConfirmationHtml = (0, emailTemplates_1.otpEmailTemplate)(otp, email);
    // In production, integrate with your email service:
    yield protonMail_1.default.sendEmail({
        senderName: "SI U Login",
        senderEmail: "guides@si3.space",
        toName: email,
        toEmail: email,
        subject: `${otp}: Your SI U Login Code`,
        htmlContent: applicantConfirmationHtml,
        emailType: "rsvp",
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
    // Find existing user or create new one
    let user = yield usersModel_1.default.findOne({ email });
    let isNewUser = false;
    if (!user) {
        // Create new user account
        console.log(`[EMAIL AUTH DEBUG] Creating new user for email: ${email}`);
        try {
            user = new usersModel_1.default({
                email,
                isVerified: true, // Email is verified by OTP
                roles: [usersModel_1.UserRole.SCHOLAR], // Default role for new users
                lastLogin: new Date(),
                newsletter: false, // Default newsletter preference
                interests: [], // Empty interests array
                personalValues: [], // Empty personal values array
                digitalLinks: [], // Empty digital links array
            });
            yield user.save();
            isNewUser = true;
            console.log(`[EMAIL AUTH DEBUG] New user created:`, {
                id: user._id,
                email: user.email,
                isVerified: user.isVerified
            });
        }
        catch (error) {
            console.log(`[EMAIL AUTH DEBUG] Error creating user:`, error.message);
            // If there's a duplicate key error, try to find the existing user
            if (error.code === 11000) {
                console.log(`[EMAIL AUTH DEBUG] Duplicate key error, finding existing user`);
                user = yield usersModel_1.default.findOne({ email });
                if (user) {
                    console.log(`[EMAIL AUTH DEBUG] Found existing user after duplicate error:`, {
                        id: user._id,
                        email: user.email
                    });
                    // Update existing user
                    user.isVerified = true;
                    user.lastLogin = new Date();
                    yield user.save({ validateBeforeSave: false });
                }
                else {
                    return next(AppError_1.default.conflict("Unable to create or find user account"));
                }
            }
            else {
                return next(AppError_1.default.internalServerError(`Account creation failed: ${error.message}`));
            }
        }
    }
    else {
        // Update existing user
        console.log(`[EMAIL AUTH DEBUG] Logging into existing user: ${email}`);
        user.isVerified = true;
        user.lastLogin = new Date();
        yield user.save({ validateBeforeSave: false });
    }
    // Send appropriate email based on whether user is new or existing
    const loginTime = new Date().toISOString();
    const ip = req.headers["x-forwarded-for"] || "Unknown";
    if (isNewUser) {
        // Send welcome email for new users
        const welcomeHtml = (0, emailTemplates_1.welcomeEmailTemplate)();
        yield protonMail_1.default.sendEmail({
            senderName: "SI U Team",
            senderEmail: "guides@si3.space",
            toName: email,
            toEmail: email,
            subject: "Welcome to SI U!",
            htmlContent: welcomeHtml,
            emailType: "rsvp",
        });
    }
    else {
        // Send login alert for existing users
        const loginHtml = (0, emailTemplates_1.loginAlertEmailTemplate)({
            email,
            time: loginTime,
            location: "Unknown",
            ipAddress: Array.isArray(ip) ? ip[0] : ip,
        });
        yield protonMail_1.default.sendEmail({
            senderName: "SI U Security",
            senderEmail: "guides@si3.space",
            toName: email,
            toEmail: email,
            subject: "New Login Detected",
            htmlContent: loginHtml,
            emailType: "rsvp",
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
    // Rate limiting (configurable)
    const rateLimitKey = `${RATE_LIMIT_KEY_PREFIX}wallet:${wallet_address}`;
    if (RATE_LIMIT_SECONDS > 0) {
        const isLimited = yield redisHelper_1.default.cacheGet(rateLimitKey);
        if (isLimited) {
            return next(AppError_1.default.tooManyRequests(`Please wait ${RATE_LIMIT_SECONDS} seconds before requesting another signature`));
        }
    }
    // Generate nonce
    const nonce = authUtils_1.default.generateNonce();
    const message = `Sign this message to authenticate with SI U\n\nNonce: ${nonce}`;
    // Store nonce in Redis
    const nonceKey = `${NONCE_KEY_PREFIX}${wallet_address}`;
    yield redisHelper_1.default.cacheSet(nonceKey, nonce, NONCE_TTL_SECONDS);
    // Set rate limit (only if enabled)
    if (RATE_LIMIT_SECONDS > 0) {
        yield redisHelper_1.default.cacheSet(rateLimitKey, "1", RATE_LIMIT_SECONDS);
    }
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
    // Find or create user - check both wallet address and temp email
    const tempEmail = `${wallet_address.toLowerCase()}@wallet.temp`;
    let user = yield usersModel_1.default.findOne({
        $or: [
            { wallet_address: wallet_address.toLowerCase() },
            { email: tempEmail }
        ]
    });
    let isNewUser = false;
    console.log(`[WALLET AUTH DEBUG] Wallet: ${wallet_address.toLowerCase()}`);
    console.log(`[WALLET AUTH DEBUG] Temp email: ${tempEmail}`);
    console.log(`[WALLET AUTH DEBUG] Found existing user:`, user ? {
        id: user._id,
        email: user.email,
        wallet: user.wallet_address,
        isVerified: user.isVerified
    } : 'None');
    if (!user) {
        // Create new user with temporary email
        console.log(`[WALLET AUTH DEBUG] Creating new wallet user`);
        try {
            user = new usersModel_1.default({
                email: tempEmail,
                wallet_address: wallet_address.toLowerCase(),
                isVerified: false, // Email not verified yet
                isWalletVerified: true, // Wallet is verified by signature
                roles: [usersModel_1.UserRole.SCHOLAR], // Default role
                lastLogin: new Date(),
            });
            yield user.save();
            isNewUser = true;
            console.log(`[WALLET AUTH DEBUG] New user created:`, {
                id: user._id,
                email: user.email,
                wallet: user.wallet_address
            });
        }
        catch (error) {
            console.log(`[WALLET AUTH DEBUG] Error creating user:`, error.message);
            // If there's a duplicate key error, try to find the existing user
            if (error.code === 11000) {
                console.log(`[WALLET AUTH DEBUG] Duplicate key error, finding existing user`);
                user = yield usersModel_1.default.findOne({
                    $or: [
                        { wallet_address: wallet_address.toLowerCase() },
                        { email: tempEmail }
                    ]
                });
                if (user) {
                    console.log(`[WALLET AUTH DEBUG] Found existing user after duplicate error:`, {
                        id: user._id,
                        email: user.email,
                        wallet: user.wallet_address
                    });
                    // Update existing user
                    user.lastLogin = new Date();
                    yield user.save({ validateBeforeSave: false });
                }
                else {
                    return next(AppError_1.default.conflict("Unable to create or find user account"));
                }
            }
            else {
                return next(AppError_1.default.internalServerError(`Account creation failed: ${error.message}`));
            }
        }
    }
    else {
        // Update existing user
        console.log(`[WALLET AUTH DEBUG] Logging into existing user`);
        user.isWalletVerified = true; // Ensure wallet is verified
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
    user.isWalletVerified = true; // Mark wallet as verified
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
    user.isWalletVerified = false; // Remove wallet verification
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
 * Send email verification OTP to current user
 */
exports.sendEmailVerification = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = req.user;
    const email = user.email;
    console.log(`[EMAIL VERIFICATION DEBUG] User attempting to send verification:`, {
        userId: user._id,
        email: user.email,
        isVerified: user.isVerified,
        hasWallet: !!user.wallet_address,
        isTempEmail: (_a = user.email) === null || _a === void 0 ? void 0 : _a.includes('@wallet.temp')
    });
    // Allow wallet users with temp emails to send verification even if "verified"
    const isWalletUserWithTempEmail = user.wallet_address && ((_b = user.email) === null || _b === void 0 ? void 0 : _b.includes('@wallet.temp'));
    if (user.isVerified && !isWalletUserWithTempEmail) {
        console.log(`[EMAIL VERIFICATION DEBUG] Blocking verified user without temp email`);
        return next(new AppError_1.default("Email is already verified", 400));
    }
    // Check rate limit (configurable)
    const rateLimitKey = `${RATE_LIMIT_KEY_PREFIX}${email}`;
    if (RATE_LIMIT_SECONDS > 0) {
        const rateLimitCheck = yield redisHelper_1.default.cacheGet(rateLimitKey);
        if (rateLimitCheck) {
            return next(new AppError_1.default(`Please wait ${RATE_LIMIT_SECONDS} seconds before requesting another verification code`, 429));
        }
    }
    // Generate OTP
    const otp = authUtils_1.default.generateOTP(6);
    // Store OTP in Redis with verification prefix
    const otpKey = `verification:${OTP_KEY_PREFIX}${email}`;
    yield redisHelper_1.default.cacheSet(otpKey, otp, OTP_TTL_SECONDS);
    // Set rate limit (only if enabled)
    if (RATE_LIMIT_SECONDS > 0) {
        yield redisHelper_1.default.cacheSet(rateLimitKey, "1", RATE_LIMIT_SECONDS);
    }
    // Create verification email template
    const verificationHtml = (0, emailTemplates_1.otpEmailTemplate)(otp, email, "Email Verification");
    // Send verification email
    yield protonMail_1.default.sendEmail({
        senderName: "SI U Verification",
        senderEmail: "guides@si3.space",
        toName: email,
        toEmail: email,
        subject: `${otp}: Verify Your Email Address`,
        htmlContent: verificationHtml,
        emailType: "rsvp",
    });
    res.status(200).json({
        status: "success",
        message: "Verification code sent to your email address",
        data: {
            email,
            expiresIn: OTP_TTL_SECONDS,
        },
    });
}));
/**
 * Send email verification to a new email address for email update
 */
exports.sendEmailVerificationToNewEmail = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email: newEmail } = req.body;
    // Temporarily disabled user authentication for debugging
    // const user = req.user as IUser;
    if (!newEmail) {
        return next(new AppError_1.default("Email is required", 400));
    }
    if (typeof newEmail !== 'string' || !newEmail.includes('@')) {
        return next(new AppError_1.default("Please provide a valid email address", 400));
    }
    if (newEmail.includes('@wallet.temp')) {
        return next(new AppError_1.default("Wallet temporary emails are not allowed", 400));
    }
    // Check if user with this email already exists
    const existingUser = yield usersModel_1.default.findOne({
        email: newEmail
    });
    if (existingUser) {
        return next(new AppError_1.default("User already exists with this email address", 400));
    }
    // Rate limiting disabled for new email verification
    // Generate OTP
    const otp = authUtils_1.default.generateOTP(6);
    const otpKey = `verification:${OTP_KEY_PREFIX}${newEmail}`;
    yield redisHelper_1.default.cacheSet(otpKey, otp, OTP_TTL_SECONDS);
    // Rate limiting disabled for new email verification
    // Create verification email template
    const verificationHtml = (0, emailTemplates_1.otpEmailTemplate)(otp, newEmail, "Email Verification");
    // Send verification email to the NEW email address
    yield protonMail_1.default.sendEmail({
        senderName: "SI U Verification",
        senderEmail: "guides@si3.space",
        toName: newEmail,
        toEmail: newEmail,
        subject: `${otp}: Verify Your New Email Address`,
        htmlContent: verificationHtml,
        emailType: "rsvp",
    });
    console.log(`[NEW EMAIL VERIFICATION DEBUG] Verification sent to new email: ${newEmail}`);
    res.status(200).json({
        status: "success",
        message: `Verification code sent to ${newEmail}`,
        data: {
            email: newEmail,
            expiresIn: OTP_TTL_SECONDS,
        },
    });
}));
/**
 * Debug endpoint to test request parsing
 */
exports.debugEmailRequest = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[DEBUG] Full request:`, {
        body: req.body,
        headers: req.headers,
        method: req.method,
        url: req.url,
        contentType: req.headers['content-type']
    });
    res.status(200).json({
        status: "success",
        message: "Debug info logged",
        data: {
            body: req.body,
            contentType: req.headers['content-type']
        }
    });
}));
/**
 * Verify email with OTP for current user
 */
exports.verifyEmailVerification = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { otp, email: newEmail } = req.body;
    const user = req.user;
    // If newEmail is provided, this is for updating to a new email
    // If not provided, this is for verifying the current email
    const emailToVerify = newEmail || user.email;
    // Get OTP from Redis with verification prefix
    const otpKey = `verification:${OTP_KEY_PREFIX}${emailToVerify}`;
    const storedOTP = yield redisHelper_1.default.cacheGet(otpKey);
    if (!storedOTP) {
        return next(new AppError_1.default("Verification code has expired or is invalid", 400));
    }
    if (Number(storedOTP) !== Number(otp)) {
        return next(new AppError_1.default("Invalid verification code", 400));
    }
    // Clear OTP from Redis
    yield redisHelper_1.default.cacheDelete(otpKey);
    // If this is for a new email, update the user's email
    if (newEmail && newEmail !== user.email) {
        // Check if the new email is already taken by another user
        const existingUser = yield usersModel_1.default.findOne({
            email: newEmail,
            _id: { $ne: user._id }
        });
        if (existingUser) {
            return next(new AppError_1.default("This email address is already in use by another account", 400));
        }
        // Update to the new verified email
        user.email = newEmail;
        user.isVerified = true;
        user.settingsUpdatedAt = new Date();
        yield user.save({ validateBeforeSave: false });
        console.log(`[EMAIL UPDATE] User ${user._id} updated email to ${newEmail} via verification`);
    }
    else {
        // Just verify the current email
        user.isVerified = true;
        yield user.save({ validateBeforeSave: false });
    }
    // Generate new token with updated user data
    authUtils_1.default.createSendToken(user, 200, res, "Email verified successfully");
}));
/**
 * Get current user profile
 */
exports.getMe = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // Ensure default notification settings exist
    if (!user.notificationSettings) {
        user.notificationSettings = {
            emailUpdates: true,
            sessionReminder: true,
            marketingEmails: false,
            weeklyDigest: true,
            eventAnnouncements: true,
        };
        yield user.save({ validateBeforeSave: false });
    }
    const userResponse = {
        id: user._id,
        email: user.email,
        username: user.username,
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
        profileImage: user.profileImage,
        // New fields for settings page
        notificationSettings: user.notificationSettings,
        walletInfo: user.walletInfo,
        settingsUpdatedAt: user.settingsUpdatedAt,
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
        "email",
        "username",
        "companyName",
        "companyAffiliation",
        "interests",
        "personalValues",
        "digitalLinks",
        "details",
        "newsletter",
        "roles",
        "profileImage",
    ];
    // Filter out fields that are not allowed to be updated
    const updateData = {};
    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });
    // Special validation for email updates
    if (updateData.email) {
        const newEmail = updateData.email.toLowerCase().trim();
        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            return next(new AppError_1.default("Please provide a valid email address", 400));
        }
        // Prevent wallet temp emails
        if (newEmail.includes('@wallet.temp')) {
            return next(new AppError_1.default("Wallet temporary emails are not allowed. Please use a real email address.", 400));
        }
        // Only check for email conflicts if the email is actually changing
        if (newEmail !== user.email) {
            const existingUser = yield usersModel_1.default.findOne({
                email: newEmail,
                _id: { $ne: user._id }
            });
            if (existingUser) {
                return next(new AppError_1.default("This email address is already in use by another account", 400));
            }
        }
        // Only reset verification status if email actually changed
        if (newEmail !== user.email) {
            updateData.isVerified = false;
            console.log(`[PROFILE UPDATE] Email changed from ${user.email} to ${newEmail}, resetting verification status`);
        }
        else {
            console.log(`[PROFILE UPDATE] Email unchanged (${newEmail}), preserving verification status`);
        }
        updateData.email = newEmail;
    }
    // Special validation for username updates
    if (updateData.username) {
        const newUsername = updateData.username.trim();
        // Validate username format
        if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
            return next(new AppError_1.default("Username can only contain letters, numbers, underscores, and hyphens", 400));
        }
        // Validate username length
        if (newUsername.length < 3 || newUsername.length > 30) {
            return next(new AppError_1.default("Username must be between 3 and 30 characters long", 400));
        }
        // Check if username is already taken by another user (case-insensitive check)
        const existingUser = yield usersModel_1.default.findOne({
            username: { $regex: new RegExp(`^${newUsername}$`, 'i') },
            _id: { $ne: user._id }
        });
        if (existingUser) {
            return next(new AppError_1.default("This username is already taken", 400));
        }
        updateData.username = newUsername; // Preserve original case
        console.log(`[PROFILE UPDATE] Username updated to: ${newUsername} (preserving case)`);
    }
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
                    profileImage: user.profileImage,
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
