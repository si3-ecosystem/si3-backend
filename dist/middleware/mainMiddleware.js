"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = require("express-rate-limit");
const express_1 = __importDefault(require("express"));
const allowedOrigins_1 = require("../utils/allowedOrigins");
const mainMiddleware = (app) => {
    // Security middleware
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                mediaSrc: ["'self'", "https:"], // For video streaming
                frameSrc: ["'self'"], // For embedded content
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    }));
    // CORS configuration
    app.use((0, cors_1.default)({
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin)
                return callback(null, true);
            if (allowedOrigins_1.allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin",
        ],
        exposedHeaders: ["X-Total-Count", "X-Page-Count"],
    }));
    // Request logging (only in development)
    if (process.env.NODE_ENV === "development") {
        app.use((req, res, next) => {
            const start = Date.now();
            console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
            res.on("finish", () => {
                const duration = Date.now() - start;
                console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
            });
            next();
        });
    }
    // Body parsing
    app.use((0, compression_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.use(express_1.default.json({ limit: "10mb" }));
    app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
    app.disable("x-powered-by");
    // Data sanitization - Simple custom implementation
    app.use((req, res, next) => {
        const sanitize = (obj) => {
            if (obj && typeof obj === "object") {
                for (const key in obj) {
                    if (key.includes("$") || key.includes(".")) {
                        delete obj[key];
                    }
                    else if (typeof obj[key] === "object") {
                        sanitize(obj[key]);
                    }
                }
            }
            return obj;
        };
        if (req.body)
            sanitize(req.body);
        if (req.query)
            sanitize(req.query);
        if (req.params)
            sanitize(req.params);
        next();
    });
    // Rate limiting
    const generalLimiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.NODE_ENV === "development" ? 1000 : 100, // More permissive in development
        message: {
            status: "error",
            error: {
                message: "Too many requests from this IP, please try again later.",
                statusCode: 429,
                errorCode: "TOO_MANY_REQUESTS",
            },
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: () => false, // Always apply rate limiting, but with higher limits in development
    });
    const authLimiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.NODE_ENV === "development" ? 100 : 5, // More permissive in development
        message: {
            status: "error",
            error: {
                message: "Too many authentication attempts, please try again later.",
                statusCode: 429,
                errorCode: "TOO_MANY_REQUESTS",
            },
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: () => false, // Always apply rate limiting, but with higher limits in development
    });
    const uploadLimiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 10 upload requests per window
        message: {
            status: "error",
            error: {
                message: "Too many upload attempts, please try again later.",
                statusCode: 429,
                errorCode: "TOO_MANY_REQUESTS",
            },
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => process.env.NODE_ENV === "development",
    });
    // Apply rate limiting to API routes
    app.use("/api/", generalLimiter);
    app.use("/api/auth/", authLimiter);
    app.use("/api/upload/", uploadLimiter);
};
exports.mainMiddleware = mainMiddleware;
