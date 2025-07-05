"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppError extends Error {
    constructor(message, statusCode, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
    // Static helper methods for common errors
    static badRequest(message = "Bad Request") {
        return new AppError(message, 400, "BAD_REQUEST");
    }
    static unauthorized(message = "Unauthorized") {
        return new AppError(message, 401, "UNAUTHORIZED");
    }
    static forbidden(message = "Forbidden") {
        return new AppError(message, 403, "FORBIDDEN");
    }
    static notFound(message = "Not Found") {
        return new AppError(message, 404, "NOT_FOUND");
    }
    static conflict(message = "Conflict") {
        return new AppError(message, 409, "CONFLICT");
    }
    static validationError(message = "Validation Error") {
        return new AppError(message, 422, "VALIDATION_ERROR");
    }
    static tooManyRequests(message = "Too Many Requests") {
        return new AppError(message, 429, "TOO_MANY_REQUESTS");
    }
    static internalServerError(message = "Internal Server Error") {
        return new AppError(message, 500, "INTERNAL_SERVER_ERROR");
    }
}
exports.default = AppError;
