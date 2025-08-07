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
exports.checkReactionPermission = exports.checkCommentRateLimit = exports.validateParentComment = exports.checkCommentOwnership = exports.checkCommentPermission = exports.checkContentAccess = void 0;
const commentsModel_1 = require("../models/commentsModel");
const commentsModel_2 = __importDefault(require("../models/commentsModel"));
const usersModel_1 = require("../models/usersModel");
const AppError_1 = __importDefault(require("../utils/AppError"));
/**
 * Middleware to check if user has permission to access specific content type
 */
const checkContentAccess = (req, res, next) => {
    var _a;
    try {
        if (!req.user) {
            return next(AppError_1.default.unauthorized("You must be logged in to access comments."));
        }
        // Get content type from request body or query
        const contentType = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.contentType) || req.query.contentType;
        if (!contentType) {
            return next(AppError_1.default.badRequest("Content type is required"));
        }
        // Check if content type is valid
        if (!Object.values(commentsModel_1.ContentType).includes(contentType)) {
            return next(AppError_1.default.badRequest("Invalid content type"));
        }
        // Get allowed roles for this content type
        const allowedRoles = commentsModel_1.CONTENT_ACCESS_MAP[contentType];
        // Check if user has roles property
        if (!req.user.roles || !Array.isArray(req.user.roles)) {
            return next(AppError_1.default.unauthorized("User roles not properly configured. Please contact support."));
        }
        // Check if user has at least one of the required roles
        const hasAccess = req.user.roles.some((userRole) => allowedRoles.includes(userRole));
        if (!hasAccess) {
            return next(AppError_1.default.forbidden(`You do not have permission to access ${contentType.replace("_", " ")} content.`));
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.checkContentAccess = checkContentAccess;
/**
 * Middleware to check if user can comment on specific content
 * This is the same as checkContentAccess but with more specific error messages
 */
const checkCommentPermission = (req, res, next) => {
    var _a;
    try {
        if (!req.user) {
            return next(AppError_1.default.unauthorized("You must be logged in to comment."));
        }
        const contentType = (_a = req.body) === null || _a === void 0 ? void 0 : _a.contentType;
        if (!contentType) {
            return next(AppError_1.default.badRequest("Content type is required"));
        }
        // Check if content type is valid
        if (!Object.values(commentsModel_1.ContentType).includes(contentType)) {
            return next(AppError_1.default.badRequest("Invalid content type"));
        }
        // Get allowed roles for this content type
        const allowedRoles = commentsModel_1.CONTENT_ACCESS_MAP[contentType];
        // Check if user has at least one of the required roles
        const hasAccess = req.user.roles.some((userRole) => allowedRoles.includes(userRole));
        if (!hasAccess) {
            const contentTypeDisplay = contentType.replace(/_/g, " ");
            return next(AppError_1.default.forbidden(`You do not have permission to comment on ${contentTypeDisplay} content. Only ${allowedRoles
                .filter((role) => role !== usersModel_1.UserRole.ADMIN)
                .join(" and ")} users can comment on this content.`));
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.checkCommentPermission = checkCommentPermission;
/**
 * Middleware to check if user owns a comment or is admin
 */
const checkCommentOwnership = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(AppError_1.default.unauthorized("You must be logged in to perform this action."));
        }
        const commentId = req.params.commentId;
        if (!commentId) {
            return next(AppError_1.default.badRequest("Comment ID is required"));
        }
        // Find the comment
        const comment = yield commentsModel_2.default.findById(commentId);
        if (!comment) {
            return next(AppError_1.default.notFound("Comment not found"));
        }
        // Check if comment is already deleted
        if (comment.isDeleted) {
            return next(AppError_1.default.notFound("Comment not found"));
        }
        const currentUserId = req.user._id.toString();
        const commentUserId = comment.userId.toString();
        const isAdmin = req.user.roles.includes(usersModel_1.UserRole.ADMIN);
        // Allow if user owns the comment or is admin
        if (commentUserId !== currentUserId && !isAdmin) {
            return next(AppError_1.default.forbidden("You can only modify your own comments."));
        }
        // Attach comment to request for use in controller
        req.comment = comment;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.checkCommentOwnership = checkCommentOwnership;
/**
 * Middleware to validate parent comment exists and user has access
 */
const validateParentComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { parentCommentId, contentId, contentType } = req.body;
        // If no parent comment, skip validation
        if (!parentCommentId) {
            return next();
        }
        // Find the parent comment
        const parentComment = yield commentsModel_2.default.findById(parentCommentId);
        if (!parentComment) {
            return next(AppError_1.default.badRequest("Parent comment not found"));
        }
        // Check if parent comment is deleted
        if (parentComment.isDeleted) {
            return next(AppError_1.default.badRequest("Cannot reply to a deleted comment"));
        }
        // Ensure parent comment belongs to the same content
        if (parentComment.contentId !== contentId ||
            parentComment.contentType !== contentType) {
            return next(AppError_1.default.badRequest("Parent comment must belong to the same content"));
        }
        // Prevent nested replies (replies to replies)
        if (parentComment.isReply) {
            return next(AppError_1.default.badRequest("Cannot reply to a reply. Please reply to the original comment."));
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.validateParentComment = validateParentComment;
/**
 * Middleware to check rate limiting for comments (prevent spam)
 */
const checkCommentRateLimit = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(AppError_1.default.unauthorized("You must be logged in to comment."));
        }
        // Skip rate limiting for admins
        if (req.user.roles.includes(usersModel_1.UserRole.ADMIN)) {
            return next();
        }
        const userId = req.user._id;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        // Count comments from this user in the last 5 minutes
        const recentCommentsCount = yield commentsModel_2.default.countDocuments({
            userId,
            createdAt: { $gte: fiveMinutesAgo },
            isDeleted: false,
        });
        // Allow maximum 10 comments per 5 minutes
        if (recentCommentsCount >= 10) {
            return next(AppError_1.default.tooManyRequests("You are commenting too frequently. Please wait a few minutes before commenting again."));
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.checkCommentRateLimit = checkCommentRateLimit;
/**
 * Middleware to check if user can react to a comment
 */
const checkReactionPermission = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(AppError_1.default.unauthorized("You must be logged in to react to comments."));
        }
        const commentId = req.params.commentId;
        if (!commentId) {
            return next(AppError_1.default.badRequest("Comment ID is required"));
        }
        // Find the comment to check its content type
        const comment = yield commentsModel_2.default.findById(commentId);
        if (!comment) {
            return next(AppError_1.default.notFound("Comment not found"));
        }
        // Check if comment is deleted
        if (comment.isDeleted) {
            return next(AppError_1.default.notFound("Comment not found"));
        }
        // Check if user has permission to access this content type
        const allowedRoles = commentsModel_1.CONTENT_ACCESS_MAP[comment.contentType];
        const hasAccess = req.user.roles.some((userRole) => allowedRoles.includes(userRole));
        if (!hasAccess) {
            const contentTypeDisplay = comment.contentType.replace(/_/g, " ");
            return next(AppError_1.default.forbidden(`You do not have permission to react to ${contentTypeDisplay} content.`));
        }
        // Attach comment to request for use in controller
        req.comment = comment;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.checkReactionPermission = checkReactionPermission;
