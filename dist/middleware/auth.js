"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Authentication middleware: verifies JWT in cookies and populates req.user
 */
const auth = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token missing'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Note: This middleware is deprecated, use protectMiddleware instead
        req.user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.name
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};
exports.default = auth;
