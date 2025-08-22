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
exports.protectUnverified = void 0;
const usersModel_1 = __importDefault(require("../models/usersModel"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const authUtils_1 = __importDefault(require("../utils/authUtils"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
/**
 * Protect middleware that allows unverified users
 * Used for verification endpoints where unverified users need access
 */
exports.protectUnverified = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Debug logging
    console.log('[protectUnverified] Headers:', {
        authorization: req.headers.authorization,
        cookie: req.headers.cookie,
        'user-agent': req.headers['user-agent']
    });
    console.log('[protectUnverified] Cookies:', req.cookies);
    // 1) Getting token and check if it's there
    let token = null;
    // Check Authorization header
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
        console.log('[protectUnverified] Token from Authorization header:', token ? 'Found' : 'Not found');
    }
    // Check cookies
    if (!token && req.cookies) {
        token = authUtils_1.default.extractToken(req.headers.authorization, req.cookies);
        console.log('[protectUnverified] Token from cookies:', token ? 'Found' : 'Not found');
    }
    console.log('[protectUnverified] Final token status:', token ? 'Token available' : 'No token found');
    if (!token) {
        console.log('[protectUnverified] No token found, returning 401');
        return next(AppError_1.default.unauthorized("You are not logged in! Please log in to get access."));
    }
    // 2) Verification token
    let decoded;
    try {
        console.log('[protectUnverified] Attempting to verify token...');
        decoded = authUtils_1.default.verifyToken(token);
        console.log('[protectUnverified] Token verified successfully for user:', decoded._id);
    }
    catch (error) {
        console.log('[protectUnverified] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
        return next(AppError_1.default.unauthorized("Invalid token. Please log in again!"));
    }
    // 3) Check if user still exists
    const currentUser = yield usersModel_1.default.findById(decoded._id);
    if (!currentUser) {
        return next(AppError_1.default.unauthorized("The user belonging to this token no longer exists."));
    }
    // 4) Skip verification check - this is the key difference from protect middleware
    // Allow unverified users to access verification endpoints
    // 5) Update last login timestamp
    currentUser.lastLogin = new Date();
    yield currentUser.save({ validateBeforeSave: false });
    // Grant access to protected route
    req.user = currentUser;
    next();
}));
exports.default = exports.protectUnverified;
