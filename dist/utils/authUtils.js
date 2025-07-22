"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const encryption_1 = __importDefault(require("./encryption"));
class AuthUtils {
    constructor() {
        this.cookieName = "si3-jwt";
    }
    /**
     * Generate JWT token
     */
    generateToken(user) {
        // Convert the user document to a plain object and handle _id
        const userPayload = Object.assign(Object.assign({}, user.toObject()), { _id: user._id.toString() });
        return encryption_1.default.generateToken(userPayload);
    }
    /**
     * Verify JWT token
     */
    verifyToken(token) {
        return encryption_1.default.verifyToken(token);
    }
    /**
     * Get cookie options based on environment
     */
    getCookieOptions() {
        const isProduction = process.env.NODE_ENV === "production";
        return {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: "/",
            domain: process.env.COOKIE_DOMAIN || "localhost",
        };
    }
    /**
     * Set authentication cookie
     */
    setAuthCookie(res, token) {
        const cookieOptions = this.getCookieOptions();
        res.cookie(this.cookieName, token, cookieOptions);
    }
    /**
     * Clear authentication cookie
     */
    clearAuthCookie(res) {
        res.clearCookie(this.cookieName, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            domain: process.env.COOKIE_DOMAIN || "localhost",
        });
    }
    /**
     * Create and send token response
     */
    createSendToken(user, statusCode, res, message = "Authentication successful") {
        const token = this.generateToken(user);
        // Set HTTP-only cookie
        this.setAuthCookie(res, token);
        // Remove sensitive data from response
        const userResponse = {
            id: user._id,
            email: user.email,
            roles: user.roles,
            interests: user.interests,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            isVerified: user.isVerified,
            newsletter: user.newsletter,
            companyName: user.companyName,
            digitalLinks: user.digitalLinks,
            wallet_address: user.wallet_address,
            personalValues: user.personalValues,
            companyAffiliation: user.companyAffiliation,
        };
        res.status(statusCode).json({
            status: "success",
            message,
            data: {
                token,
                user: userResponse,
            },
        });
    }
    /**
     * Extract token from request
     */
    extractToken(authHeader, cookies) {
        // Try to get from cookies first (preferred method)
        if (cookies && cookies[this.cookieName]) {
            return cookies[this.cookieName];
        }
        // Fallback to Authorization header
        if (authHeader && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
    /**
     * Generate OTP
     */
    generateOTP(length = 6) {
        return encryption_1.default.generateOTP(length);
    }
    /**
     * Generate nonce for wallet authentication
     */
    generateNonce() {
        return encryption_1.default.generateRandomString(16);
    }
    /**
     * Get expiration time in seconds
     */
    getTokenExpirationSeconds() {
        const expiration = process.env.JWT_EXPIRES_IN || "30d";
        // Parse time string (e.g., "7d", "24h", "60m")
        const timeValue = parseInt(expiration.slice(0, -1));
        const timeUnit = expiration.slice(-1);
        switch (timeUnit) {
            case "d":
                return timeValue * 24 * 60 * 60;
            case "h":
                return timeValue * 60 * 60;
            case "m":
                return timeValue * 60;
            case "s":
                return timeValue;
            default:
                return 7 * 24 * 60 * 60;
        }
    }
}
const authUtils = new AuthUtils();
exports.default = authUtils;
