"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const AppError_1 = __importDefault(require("../utils/AppError"));
// Validation result handler middleware
const validationMiddleware = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        return next(AppError_1.default.validationError(`Validation failed: ${errorMessages.join(", ")}`, errorMessages));
    }
    next();
};
exports.default = validationMiddleware;
