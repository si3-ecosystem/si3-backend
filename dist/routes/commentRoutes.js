"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const commentValidation_1 = require("../validators/commentValidation");
const commentPermissionMiddleware_1 = require("../middleware/commentPermissionMiddleware");
const protectMiddleware_1 = require("../middleware/protectMiddleware");
const validationMiddleware_1 = __importDefault(require("../middleware/validationMiddleware"));
const router = (0, express_1.Router)();
/**
 * @route   POST /api/comments
 * @desc    Create a new comment
 * @access  Private (role-based)
 */
router.post("/", protectMiddleware_1.protect, commentValidation_1.validateCreateComment, validationMiddleware_1.default, commentPermissionMiddleware_1.checkCommentPermission, commentPermissionMiddleware_1.validateParentComment, commentPermissionMiddleware_1.checkCommentRateLimit, commentController_1.createComment);
/**
 * @route   GET /api/comments/content
 * @desc    Get comments for specific content
 * @access  Private (role-based)
 */
router.get("/content", protectMiddleware_1.protect, commentValidation_1.validateGetCommentsByContent, validationMiddleware_1.default, commentPermissionMiddleware_1.checkContentAccess, commentController_1.getCommentsByContent);
/**
 * @route   GET /api/comments/content/threaded
 * @desc    Get threaded comments for specific content (optimized)
 * @access  Private (role-based)
 */
router.get("/content/threaded", protectMiddleware_1.protect, commentValidation_1.validateGetCommentsByContent, validationMiddleware_1.default, commentPermissionMiddleware_1.checkContentAccess, commentController_1.getThreadedComments);
/**
 * @route   GET /api/comments/content/stats
 * @desc    Get comment statistics for specific content
 * @access  Private (role-based)
 */
router.get("/content/stats", protectMiddleware_1.protect, commentValidation_1.validateGetCommentsByContent, validationMiddleware_1.default, commentPermissionMiddleware_1.checkContentAccess, commentController_1.getCommentStats);
/**
 * @route   GET /api/comments/my-comments
 * @desc    Get current user's comments
 * @access  Private
 */
router.get("/my-comments", protectMiddleware_1.protect, commentValidation_1.validateGetUserComments, validationMiddleware_1.default, commentController_1.getUserComments);
/**
 * @route   GET /api/comments/:commentId
 * @desc    Get a single comment by ID
 * @access  Private (role-based)
 */
router.get("/:commentId", protectMiddleware_1.protect, commentValidation_1.validateGetComment, validationMiddleware_1.default, commentController_1.getComment);
/**
 * @route   GET /api/comments/:commentId/replies
 * @desc    Get replies for a specific comment
 * @access  Private (role-based)
 */
router.get("/:commentId/replies", protectMiddleware_1.protect, commentValidation_1.validateGetCommentReplies, validationMiddleware_1.default, commentController_1.getCommentReplies);
/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update a comment
 * @access  Private (owner or admin)
 */
router.put("/:commentId", protectMiddleware_1.protect, commentValidation_1.validateUpdateComment, validationMiddleware_1.default, commentPermissionMiddleware_1.checkCommentOwnership, commentController_1.updateComment);
/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment (soft delete)
 * @access  Private (owner or admin)
 */
router.delete("/:commentId", protectMiddleware_1.protect, commentValidation_1.validateDeleteComment, validationMiddleware_1.default, commentPermissionMiddleware_1.checkCommentOwnership, commentController_1.deleteComment);
/**
 * @route   POST /api/comments/:commentId/react
 * @desc    Add a reaction (like/dislike) to a comment
 * @access  Private (role-based)
 */
router.post("/:commentId/react", protectMiddleware_1.protect, commentValidation_1.validateAddReaction, validationMiddleware_1.default, commentPermissionMiddleware_1.checkReactionPermission, commentController_1.addReaction);
/**
 * @route   DELETE /api/comments/:commentId/react
 * @desc    Remove a reaction from a comment
 * @access  Private (role-based)
 */
router.delete("/:commentId/react", protectMiddleware_1.protect, commentValidation_1.validateRemoveReaction, validationMiddleware_1.default, commentPermissionMiddleware_1.checkReactionPermission, commentController_1.removeReaction);
/**
 * @route   GET /api/comments/:commentId/my-reaction
 * @desc    Get current user's reaction to a comment
 * @access  Private
 */
router.get("/:commentId/my-reaction", protectMiddleware_1.protect, commentValidation_1.validateGetReactionStats, validationMiddleware_1.default, commentController_1.getUserReaction);
/**
 * @route   GET /api/comments/:commentId/reactions
 * @desc    Get reaction statistics for a comment
 * @access  Private (role-based)
 */
router.get("/:commentId/reactions", protectMiddleware_1.protect, commentValidation_1.validateGetReactionStats, validationMiddleware_1.default, commentController_1.getReactionStats);
exports.default = router;
