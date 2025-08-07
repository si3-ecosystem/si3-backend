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
exports.getReactionStats = exports.getUserReaction = exports.removeReaction = exports.addReaction = exports.getCommentStats = exports.getThreadedComments = exports.deleteComment = exports.updateComment = exports.getUserComments = exports.getCommentReplies = exports.getComment = exports.getCommentsByContent = exports.createComment = void 0;
const commentsModel_1 = __importDefault(require("../models/commentsModel"));
const commentCacheHelper_1 = __importDefault(require("../helpers/commentCacheHelper"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
/**
 * Create a new comment
 */
exports.createComment = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { contentId, contentType, content, parentCommentId } = req.body;
    const userId = req.user._id;
    // Create the comment
    const newComment = yield commentsModel_1.default.create({
        contentId,
        contentType,
        content,
        userId,
        parentCommentId: parentCommentId || null,
    });
    // Populate user data for response
    yield newComment.populate("user", "email roles");
    // Invalidate related caches
    yield commentCacheHelper_1.default.invalidateContentCaches(contentId, contentType);
    yield commentCacheHelper_1.default.invalidateUserCaches(userId.toString());
    res.status(201).json({
        status: "success",
        data: {
            comment: newComment,
        },
    });
}));
/**
 * Get comments for specific content
 */
exports.getCommentsByContent = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { contentId, contentType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const includeReplies = req.query.includeReplies === "true";
    const skip = (page - 1) * limit;
    // Try to get from cache first
    const cachedResult = yield commentCacheHelper_1.default.getCachedCommentsByContent(contentId, contentType, page, limit, includeReplies);
    if (cachedResult) {
        res.status(200).json(cachedResult);
        return;
    }
    // Get comments using the static method
    const comments = yield commentsModel_1.default.findByContentId(contentId, contentType, { includeReplies, limit, skip });
    // Get total count for pagination
    const totalComments = yield commentsModel_1.default.countDocuments(Object.assign({ contentId,
        contentType, isDeleted: false }, (includeReplies ? {} : { isReply: false })));
    const totalPages = Math.ceil(totalComments / limit);
    const result = {
        status: "success",
        results: comments.length,
        pagination: {
            page,
            limit,
            totalPages,
            totalComments,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
        data: {
            comments,
        },
    };
    // Cache the result
    yield commentCacheHelper_1.default.cacheCommentsByContent(contentId, contentType, page, limit, includeReplies, result);
    res.status(200).json(result);
}));
/**
 * Get a single comment by ID
 */
exports.getComment = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const comment = yield commentsModel_1.default.findOne({
        _id: commentId,
        isDeleted: false,
    })
        .populate("user", "email roles")
        .populate({
        path: "replies",
        populate: { path: "user", select: "email roles" },
    });
    if (!comment) {
        return next(AppError_1.default.notFound("Comment not found"));
    }
    res.status(200).json({
        status: "success",
        data: {
            comment,
        },
    });
}));
/**
 * Get replies for a specific comment
 */
exports.getCommentReplies = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    // First check if parent comment exists
    const parentComment = yield commentsModel_1.default.findOne({
        _id: commentId,
        isDeleted: false,
    });
    if (!parentComment) {
        return next(AppError_1.default.notFound("Parent comment not found"));
    }
    // Get replies
    const replies = yield commentsModel_1.default.find({
        parentCommentId: commentId,
        isDeleted: false,
    })
        .populate("user", "email roles")
        .sort({ createdAt: 1 })
        .limit(limit)
        .skip(skip);
    // Get total count
    const totalReplies = yield commentsModel_1.default.countDocuments({
        parentCommentId: commentId,
        isDeleted: false,
    });
    const totalPages = Math.ceil(totalReplies / limit);
    res.status(200).json({
        status: "success",
        results: replies.length,
        pagination: {
            page,
            limit,
            totalPages,
            totalReplies,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
        data: {
            parentComment,
            replies,
        },
    });
}));
/**
 * Get user's comments
 */
exports.getUserComments = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    // Get user's comments using static method
    const comments = yield commentsModel_1.default.findUserComments(userId, {
        limit,
        skip,
    });
    // Get total count
    const totalComments = yield commentsModel_1.default.countDocuments({
        userId,
        isDeleted: false,
    });
    const totalPages = Math.ceil(totalComments / limit);
    res.status(200).json({
        status: "success",
        results: comments.length,
        pagination: {
            page,
            limit,
            totalPages,
            totalComments,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
        data: {
            comments,
        },
    });
}));
/**
 * Update a comment
 */
exports.updateComment = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { content } = req.body;
    const comment = req.comment; // Set by checkCommentOwnership middleware
    // Update the comment
    comment.content = content;
    yield comment.save();
    // Populate user data for response
    yield comment.populate("user", "email roles");
    // Invalidate related caches
    yield commentCacheHelper_1.default.invalidateContentCaches(comment.contentId, comment.contentType);
    yield commentCacheHelper_1.default.invalidateSingleCommentCache(comment._id.toString());
    yield commentCacheHelper_1.default.invalidateUserCaches(comment.userId.toString());
    res.status(200).json({
        status: "success",
        data: {
            comment,
        },
    });
}));
/**
 * Delete a comment (soft delete)
 */
exports.deleteComment = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = req.comment; // Set by checkCommentOwnership middleware
    // Soft delete the comment
    comment.isDeleted = true;
    comment.content = "[This comment has been deleted]";
    yield comment.save();
    // Invalidate related caches
    yield commentCacheHelper_1.default.invalidateContentCaches(comment.contentId, comment.contentType);
    yield commentCacheHelper_1.default.invalidateSingleCommentCache(comment._id.toString());
    yield commentCacheHelper_1.default.invalidateUserCaches(comment.userId.toString());
    res.status(200).json({
        status: "success",
        message: "Comment deleted successfully",
    });
}));
/**
 * Get threaded comments for specific content (optimized for performance)
 */
exports.getThreadedComments = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { contentId, contentType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    // Try to get from cache first
    const cachedResult = yield commentCacheHelper_1.default.getCachedThreadedComments(contentId, contentType, page, limit);
    if (cachedResult) {
        res.status(200).json(cachedResult);
        return;
    }
    // Get threaded comments using the static method
    const comments = yield commentsModel_1.default.findThreadedComments(contentId, contentType, { limit, skip });
    // Get total count for pagination
    const totalComments = yield commentsModel_1.default.countDocuments({
        contentId,
        contentType,
        isDeleted: false,
        isReply: false, // Only count top-level comments for pagination
    });
    const totalPages = Math.ceil(totalComments / limit);
    const result = {
        status: "success",
        results: comments.length,
        pagination: {
            page,
            limit,
            totalPages,
            totalComments,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
        data: {
            comments,
        },
    };
    // Cache the result
    yield commentCacheHelper_1.default.cacheThreadedComments(contentId, contentType, page, limit, result);
    res.status(200).json(result);
}));
/**
 * Get comment statistics for content
 */
exports.getCommentStats = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { contentId, contentType } = req.query;
    if (!contentId || !contentType) {
        return next(AppError_1.default.badRequest("Content ID and content type are required"));
    }
    // Get detailed analytics using the static method
    const analytics = yield commentsModel_1.default.getContentAnalytics(contentId, contentType);
    const result = analytics[0] || {
        totalComments: 0,
        totalReplies: 0,
        totalTopLevel: 0,
        uniqueUserCount: 0,
        latestComment: null,
        oldestComment: null,
    };
    res.status(200).json({
        status: "success",
        data: {
            analytics: result,
        },
    });
}));
/**
 * Add a reaction (like/dislike) to a comment
 */
exports.addReaction = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.body;
    const comment = req.comment; // Set by checkReactionPermission middleware
    const userId = req.user._id;
    // Add reaction using static method
    const updatedComment = yield commentsModel_1.default.addReaction(comment._id, userId, type);
    // Populate user data for response
    yield updatedComment.populate("user", "email roles");
    // Invalidate related caches
    yield commentCacheHelper_1.default.invalidateContentCaches(comment.contentId, comment.contentType);
    yield commentCacheHelper_1.default.invalidateSingleCommentCache(comment._id.toString());
    res.status(200).json({
        status: "success",
        data: {
            comment: updatedComment,
            userReaction: type,
        },
    });
}));
/**
 * Remove a reaction from a comment
 */
exports.removeReaction = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = req.comment; // Set by checkReactionPermission middleware
    const userId = req.user._id;
    // Remove reaction using static method
    const updatedComment = yield commentsModel_1.default.removeReaction(comment._id, userId);
    // Populate user data for response
    yield updatedComment.populate("user", "email roles");
    // Invalidate related caches
    yield commentCacheHelper_1.default.invalidateContentCaches(comment.contentId, comment.contentType);
    yield commentCacheHelper_1.default.invalidateSingleCommentCache(comment._id.toString());
    res.status(200).json({
        status: "success",
        data: {
            comment: updatedComment,
            userReaction: null,
        },
    });
}));
/**
 * Get user's reaction to a comment
 */
exports.getUserReaction = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const userId = req.user._id;
    // Get user reaction using static method
    const userReaction = yield commentsModel_1.default.getUserReaction(commentId, userId);
    res.status(200).json({
        status: "success",
        data: {
            userReaction,
        },
    });
}));
/**
 * Get reaction statistics for a comment
 */
exports.getReactionStats = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const comment = yield commentsModel_1.default.findById(commentId).select("likeCount dislikeCount reactions");
    if (!comment || comment.isDeleted) {
        return next(AppError_1.default.notFound("Comment not found"));
    }
    // Get detailed reaction breakdown
    const reactionBreakdown = comment.reactions.reduce((acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
    }, { like: 0, dislike: 0 });
    res.status(200).json({
        status: "success",
        data: {
            commentId,
            likeCount: comment.likeCount,
            dislikeCount: comment.dislikeCount,
            totalReactions: comment.likeCount + comment.dislikeCount,
            breakdown: reactionBreakdown,
        },
    });
}));
