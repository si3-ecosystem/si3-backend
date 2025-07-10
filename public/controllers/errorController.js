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
exports.validateAsync = exports.validateRequired = exports.notFoundHandler = exports.globalErrorHandler = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
// Handle MongoDB cast errors (invalid ObjectId, etc.)
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return AppError_1.default.badRequest(message);
};
// Handle MongoDB duplicate key errors
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = Object.values(err.keyValue || {})[0] || "value";
    const message = `${field} '${value}' already exists. Please use a different ${field}.`;
    return AppError_1.default.conflict(message);
};
// Handle MongoDB validation errors
const handleValidationError = (err) => {
    const errors = Object.values(err.errors || {}).map((error) => error.message);
    const message = `Invalid input data: ${errors.join(", ")}`;
    return AppError_1.default.validationError(message, errors);
};
// Handle JWT errors
const handleJWTError = (err) => {
    if (err.name === "TokenExpiredError") {
        return AppError_1.default.unauthorized("Your session has expired. Please log in again.");
    }
    return AppError_1.default.unauthorized("Invalid authentication token. Please log in again.");
};
// Send detailed error in development
const sendErrorDev = (err, req, res) => {
    console.error("ERROR 💥", err);
    res.status(err.statusCode).json({
        status: err.status,
        error: Object.assign({ message: err.message, statusCode: err.statusCode, errorCode: err.errorCode, timestamp: err.timestamp, stack: err.stack }, (err.details && { details: err.details })),
    });
};
// Send limited error info in production
const sendErrorProd = (err, req, res) => {
    // Operational errors: safe to send to client
    if (err.isOperational) {
        res.status(err.statusCode).json(err.toJSON());
    }
    else {
        // Programming errors: don't leak details
        res.status(500).json({
            status: "error",
            error: {
                message: "Something went wrong!",
                statusCode: 500,
                errorCode: "INTERNAL_SERVER_ERROR",
                timestamp: new Date().toISOString(),
            },
        });
    }
};
// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
    let error = err;
    // Convert known errors to AppError
    if (err.name === "CastError") {
        error = handleCastError(err);
    }
    else if (err.code === 11000) {
        error = handleDuplicateKeyError(err);
    }
    else if (err.name === "ValidationError") {
        error = handleValidationError(err);
    }
    else if (err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError") {
        error = handleJWTError(err);
    }
    else if (!(err instanceof AppError_1.default)) {
        // Convert unknown errors to AppError
        error = new AppError_1.default(process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong!", err.statusCode || 500, "INTERNAL_SERVER_ERROR");
    }
    // Send appropriate response
    if (process.env.NODE_ENV === "development") {
        sendErrorDev(error, req, res);
    }
    else {
        sendErrorProd(error, req, res);
    }
};
exports.globalErrorHandler = globalErrorHandler;
// 404 handler for unmatched routes
const notFoundHandler = (req, res, next) => {
    const message = `Route ${req.method} ${req.originalUrl} not found`;
    next(AppError_1.default.notFound(message));
};
exports.notFoundHandler = notFoundHandler;
// Validation middleware helper
const validateRequired = (fields) => {
    return (req, res, next) => {
        const missingFields = fields.filter((field) => !req.body[field]);
        if (missingFields.length > 0) {
            const message = `Missing required fields: ${missingFields.join(", ")}`;
            return next(AppError_1.default.badRequest(message));
        }
        next();
    };
};
exports.validateRequired = validateRequired;
// Async validation helper
const validateAsync = (validationFn) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield validationFn(req.body);
            if (result === true) {
                next();
            }
            else {
                next(AppError_1.default.badRequest(typeof result === "string" ? result : "Validation failed"));
            }
        }
        catch (error) {
            next(error);
        }
    });
};
exports.validateAsync = validateAsync;
