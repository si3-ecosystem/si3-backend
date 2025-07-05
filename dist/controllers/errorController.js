"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = exports.notFoundHandler = exports.globalErrorHandler = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
// Handle MongoDB cast errors
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError_1.default(message, 400);
};
// Handle MongoDB duplicate field errors
const handleDuplicateFieldsDB = (err) => {
    var _a;
    const value = ((_a = err.errmsg.match(/(["'])(\\?.)*?\1/)) === null || _a === void 0 ? void 0 : _a[0]) || "unknown value";
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError_1.default(message, 409);
};
// Handle MongoDB validation errors
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError_1.default(message, 400);
};
// Handle JWT errors
const handleJWTError = () => {
    return new AppError_1.default("Invalid token. Please log in again!", 401);
};
const handleJWTExpiredError = () => {
    return new AppError_1.default("Your token has expired! Please log in again.", 401);
};
// Send error response for development
const sendErrorDev = (err, req, res) => {
    // API error response
    if (req.originalUrl.startsWith("/api")) {
        res.status(err.statusCode || 500).json({
            status: err.status,
            error: {
                message: err.message,
                statusCode: err.statusCode,
                errorCode: err.errorCode || "UNKNOWN_ERROR",
                timestamp: new Date().toISOString(),
                stack: err.stack,
            },
        });
        return;
    }
    // Non-API routes
    res.status(err.statusCode || 500).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
    });
};
// Send error response for production
const sendErrorProd = (err, req, res) => {
    // API error response
    if (req.originalUrl.startsWith("/api")) {
        // Operational, trusted error: send message to client
        if (err.isOperational) {
            res.status(err.statusCode || 500).json({
                status: err.status,
                error: {
                    message: err.message,
                    statusCode: err.statusCode,
                    errorCode: err.errorCode || "UNKNOWN_ERROR",
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }
        // Programming or other unknown error: don't leak error details
        res.status(500).json({
            status: "error",
            error: {
                message: "Something went very wrong!",
                statusCode: 500,
                errorCode: "INTERNAL_SERVER_ERROR",
                timestamp: new Date().toISOString(),
            },
        });
        return;
    }
    // Non-API routes
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            status: err.status,
            message: err.message,
        });
        return;
    }
    // Programming or other unknown error
    res.status(500).json({
        status: "error",
        message: "Please try again later.",
    });
};
// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, req, res);
    }
    else {
        let error = Object.assign({}, err);
        error.message = err.message;
        error.name = err.name;
        // Handle specific error types
        if (error.name === "CastError")
            error = handleCastErrorDB(error);
        if (error.code === 11000)
            error = handleDuplicateFieldsDB(error);
        if (error.name === "ValidationError")
            error = handleValidationErrorDB(error);
        if (error.name === "JsonWebTokenError")
            error = handleJWTError();
        if (error.name === "TokenExpiredError")
            error = handleJWTExpiredError();
        sendErrorProd(error, req, res);
    }
};
exports.globalErrorHandler = globalErrorHandler;
// 404 handler
const notFoundHandler = (req, res, next) => {
    const err = new AppError_1.default(`Can't find ${req.originalUrl} on this server!`, 404);
    next(err);
};
exports.notFoundHandler = notFoundHandler;
// Async error handler wrapper
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.catchAsync = catchAsync;
