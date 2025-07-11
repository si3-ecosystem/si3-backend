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
exports.requireWallet = exports.requireVerifiedEmail = exports.requireOwnershipOrAdmin = exports.requirePartner = exports.requireScholar = exports.requireGuide = exports.requireAdmin = exports.restrictTo = exports.authenticate = exports.protect = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
const authUtils_1 = __importDefault(require("../utils/authUtils"));
const usersModel_1 = __importStar(require("../models/usersModel"));
/**
 * Middleware to protect routes requiring authentication
 */
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) Get token from cookies or headers
        const token = authUtils_1.default.extractToken(req.headers.authorization, req.cookies);
        if (!token) {
            return next(AppError_1.default.unauthorized("You are not logged in. Please log in to get access."));
        }
        // 2) Verify token
        let decoded;
        try {
            decoded = authUtils_1.default.verifyToken(token);
        }
        catch (error) {
            return next(error);
        }
        // 3) Check if user still exists
        const currentUser = yield usersModel_1.default.findById(decoded._id).select("+lastLogin");
        if (!currentUser) {
            return next(AppError_1.default.unauthorized("The user belonging to this token no longer exists."));
        }
        // 4) Check if user is verified (optional - depends on your business logic)
        if (!currentUser.isVerified) {
            return next(AppError_1.default.unauthorized("Your account is not verified. Please verify your email."));
        }
        // 5) Update last login timestamp
        currentUser.lastLogin = new Date();
        yield currentUser.save({ validateBeforeSave: false });
        // 6) Grant access to protected route
        req.user = currentUser;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.protect = protect;
/**
 * Middleware to check if user is authenticated (but not require it)
 * Useful for routes that work both for authenticated and non-authenticated users
 */
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = authUtils_1.default.extractToken(req.headers.authorization, req.cookies);
        if (!token) {
            return next();
        }
        try {
            const decoded = authUtils_1.default.verifyToken(token);
            const currentUser = yield usersModel_1.default.findById(decoded._id);
            if (currentUser && currentUser.isVerified) {
                req.user = currentUser;
            }
        }
        catch (error) {
            // If token is invalid, just continue without user
            console.warn("Invalid token in authenticate middleware:", error instanceof Error ? error.message : "Unknown error");
        }
        next();
    }
    catch (error) {
        next();
    }
});
exports.authenticate = authenticate;
/**
 * Middleware to restrict access to certain roles
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(AppError_1.default.unauthorized("You must be logged in to access this resource."));
        }
        // Check if user has at least one of the required roles
        const hasRequiredRole = req.user.roles.some((role) => roles.includes(role));
        if (!hasRequiredRole) {
            return next(AppError_1.default.forbidden("You do not have permission to perform this action."));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
/**
 * Middleware to check if user is admin
 */
exports.requireAdmin = (0, exports.restrictTo)(usersModel_1.UserRole.ADMIN);
/**
 * Middleware to check if user is guide
 */
exports.requireGuide = (0, exports.restrictTo)(usersModel_1.UserRole.GUIDE, usersModel_1.UserRole.ADMIN);
/**
 * Middleware to check if user is scholar
 */
exports.requireScholar = (0, exports.restrictTo)(usersModel_1.UserRole.SCHOLAR, usersModel_1.UserRole.ADMIN);
/**
 * Middleware to check if user is partner
 */
exports.requirePartner = (0, exports.restrictTo)(usersModel_1.UserRole.PARTNER, usersModel_1.UserRole.ADMIN);
/**
 * Middleware to check if user owns the resource or is admin
 */
const requireOwnershipOrAdmin = (userIdField = "userId") => {
    return (req, res, next) => {
        if (!req.user) {
            return next(AppError_1.default.unauthorized("You must be logged in to access this resource."));
        }
        const resourceUserId = req.params[userIdField] || req.body[userIdField];
        const currentUserId = req.user._id.toString();
        const isAdmin = req.user.roles.includes(usersModel_1.UserRole.ADMIN);
        if (resourceUserId !== currentUserId && !isAdmin) {
            return next(AppError_1.default.forbidden("You can only access your own resources."));
        }
        next();
    };
};
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
/**
 * Middleware to check if user has verified email
 */
const requireVerifiedEmail = (req, res, next) => {
    if (!req.user) {
        return next(AppError_1.default.unauthorized("You must be logged in to access this resource."));
    }
    if (!req.user.isVerified) {
        return next(AppError_1.default.forbidden("You must verify your email address to access this resource."));
    }
    next();
};
exports.requireVerifiedEmail = requireVerifiedEmail;
/**
 * Middleware to check if user has connected wallet
 */
const requireWallet = (req, res, next) => {
    if (!req.user) {
        return next(AppError_1.default.unauthorized("You must be logged in to access this resource."));
    }
    if (!req.user.wallet_address) {
        return next(AppError_1.default.badRequest("You must connect a wallet to access this resource."));
    }
    next();
};
exports.requireWallet = requireWallet;
