"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGetReactionStats = exports.validateRemoveReaction = exports.validateAddReaction = exports.validateContentAccess = exports.validateGetComment = exports.validateGetCommentReplies = exports.validateGetUserComments = exports.validateGetCommentsByContent = exports.validateDeleteComment = exports.validateUpdateComment = exports.validateCreateComment = void 0;
const express_validator_1 = require("express-validator");
const commentsModel_1 = require("../models/commentsModel");
// Validation for creating a new comment
exports.validateCreateComment = [
    (0, express_validator_1.body)("contentId")
        .notEmpty()
        .withMessage("Content ID is required")
        .isLength({ min: 1, max: 100 })
        .withMessage("Content ID must be between 1 and 100 characters")
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage("Content ID can only contain alphanumeric characters, hyphens, and underscores")
        .trim(),
    // contentType validation removed - handled in middleware
    (0, express_validator_1.body)("content")
        .notEmpty()
        .withMessage("Comment content is required")
        .isLength({ min: 1, max: 2000 })
        .withMessage("Comment must be between 1 and 2000 characters")
        .trim()
        .custom((value) => {
        if (!value || value.trim().length === 0) {
            throw new Error("Comment cannot be empty or contain only whitespace");
        }
        return true;
    }),
    (0, express_validator_1.body)("parentCommentId")
        .optional()
        .isMongoId()
        .withMessage("Parent comment ID must be a valid MongoDB ObjectId"),
];
// Validation for updating a comment
exports.validateUpdateComment = [
    (0, express_validator_1.param)("commentId")
        .isMongoId()
        .withMessage("Comment ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("content")
        .notEmpty()
        .withMessage("Comment content is required")
        .isLength({ min: 1, max: 2000 })
        .withMessage("Comment must be between 1 and 2000 characters")
        .trim()
        .custom((value) => {
        if (!value || value.trim().length === 0) {
            throw new Error("Comment cannot be empty or contain only whitespace");
        }
        return true;
    }),
];
// Validation for deleting a comment
exports.validateDeleteComment = [
    (0, express_validator_1.param)("commentId")
        .isMongoId()
        .withMessage("Comment ID must be a valid MongoDB ObjectId"),
];
// Validation for getting comments by content
exports.validateGetCommentsByContent = [
    (0, express_validator_1.query)("contentId")
        .notEmpty()
        .withMessage("Content ID is required")
        .isLength({ min: 1, max: 100 })
        .withMessage("Content ID must be between 1 and 100 characters")
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage("Content ID can only contain alphanumeric characters, hyphens, and underscores")
        .trim(),
    // contentType validation removed - handled in middleware
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer")
        .toInt(),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100")
        .toInt(),
    (0, express_validator_1.query)("includeReplies")
        .optional()
        .isBoolean()
        .withMessage("includeReplies must be a boolean")
        .toBoolean(),
];
// Validation for getting user's comments
exports.validateGetUserComments = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer")
        .toInt(),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100")
        .toInt(),
];
// Validation for getting comment replies
exports.validateGetCommentReplies = [
    (0, express_validator_1.param)("commentId")
        .isMongoId()
        .withMessage("Comment ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer")
        .toInt(),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage("Limit must be between 1 and 50")
        .toInt(),
];
// Validation for getting a single comment
exports.validateGetComment = [
    (0, express_validator_1.param)("commentId")
        .isMongoId()
        .withMessage("Comment ID must be a valid MongoDB ObjectId"),
];
// Custom validation for content access (used in middleware)
exports.validateContentAccess = [
    (0, express_validator_1.body)("contentId")
        .notEmpty()
        .withMessage("Content ID is required"),
    (0, express_validator_1.body)("contentType")
        .notEmpty()
        .withMessage("Content type is required")
        .isIn(Object.values(commentsModel_1.ContentType))
        .withMessage(`Content type must be one of: ${Object.values(commentsModel_1.ContentType).join(", ")}`),
];
// Validation for adding a reaction (like/dislike)
exports.validateAddReaction = [
    (0, express_validator_1.param)("commentId")
        .isMongoId()
        .withMessage("Comment ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("type")
        .notEmpty()
        .withMessage("Reaction type is required")
        .isIn(["like", "dislike"])
        .withMessage("Reaction type must be either 'like' or 'dislike'"),
];
// Validation for removing a reaction
exports.validateRemoveReaction = [
    (0, express_validator_1.param)("commentId")
        .isMongoId()
        .withMessage("Comment ID must be a valid MongoDB ObjectId"),
];
// Validation for getting reaction statistics
exports.validateGetReactionStats = [
    (0, express_validator_1.param)("commentId")
        .isMongoId()
        .withMessage("Comment ID must be a valid MongoDB ObjectId"),
];
