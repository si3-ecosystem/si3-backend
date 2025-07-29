import { Router } from "express";

import {
  createComment,
  getCommentsByContent,
  getThreadedComments,
  getComment,
  getCommentReplies,
  getUserComments,
  updateComment,
  deleteComment,
  getCommentStats,
  addReaction,
  removeReaction,
  getUserReaction,
  getReactionStats,
} from "../controllers/commentController";

import {
  validateCreateComment,
  validateUpdateComment,
  validateDeleteComment,
  validateGetCommentsByContent,
  validateGetUserComments,
  validateGetCommentReplies,
  validateGetComment,
  validateAddReaction,
  validateRemoveReaction,
  validateGetReactionStats,
} from "../validators/commentValidation";

import {
  checkContentAccess,
  checkCommentPermission,
  checkCommentOwnership,
  validateParentComment,
  checkCommentRateLimit,
  checkReactionPermission,
} from "../middleware/commentPermissionMiddleware";

import { protect } from "../middleware/protectMiddleware";
import validationMiddleware from "../middleware/validationMiddleware";

const router = Router();

/**
 * @route   POST /api/comments
 * @desc    Create a new comment
 * @access  Private (role-based)
 */
router.post(
  "/",
  protect,
  validateCreateComment,
  validationMiddleware,
  checkCommentPermission,
  validateParentComment,
  checkCommentRateLimit,
  createComment
);

/**
 * @route   GET /api/comments/content
 * @desc    Get comments for specific content
 * @access  Private (role-based)
 */
router.get(
  "/content",
  protect,
  validateGetCommentsByContent,
  validationMiddleware,
  checkContentAccess,
  getCommentsByContent
);

/**
 * @route   GET /api/comments/content/threaded
 * @desc    Get threaded comments for specific content (optimized)
 * @access  Private (role-based)
 */
router.get(
  "/content/threaded",
  protect,
  validateGetCommentsByContent,
  validationMiddleware,
  checkContentAccess,
  getThreadedComments
);

/**
 * @route   GET /api/comments/content/stats
 * @desc    Get comment statistics for specific content
 * @access  Private (role-based)
 */
router.get(
  "/content/stats",
  protect,
  validateGetCommentsByContent,
  validationMiddleware,
  checkContentAccess,
  getCommentStats
);

/**
 * @route   GET /api/comments/my-comments
 * @desc    Get current user's comments
 * @access  Private
 */
router.get(
  "/my-comments",
  protect,
  validateGetUserComments,
  validationMiddleware,
  getUserComments
);

/**
 * @route   GET /api/comments/:commentId
 * @desc    Get a single comment by ID
 * @access  Private (role-based)
 */
router.get(
  "/:commentId",
  protect,
  validateGetComment,
  validationMiddleware,
  getComment
);

/**
 * @route   GET /api/comments/:commentId/replies
 * @desc    Get replies for a specific comment
 * @access  Private (role-based)
 */
router.get(
  "/:commentId/replies",
  protect,
  validateGetCommentReplies,
  validationMiddleware,
  getCommentReplies
);

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update a comment
 * @access  Private (owner or admin)
 */
router.put(
  "/:commentId",
  protect,
  validateUpdateComment,
  validationMiddleware,
  checkCommentOwnership,
  updateComment
);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment (soft delete)
 * @access  Private (owner or admin)
 */
router.delete(
  "/:commentId",
  protect,
  validateDeleteComment,
  validationMiddleware,
  checkCommentOwnership,
  deleteComment
);

/**
 * @route   POST /api/comments/:commentId/react
 * @desc    Add a reaction (like/dislike) to a comment
 * @access  Private (role-based)
 */
router.post(
  "/:commentId/react",
  protect,
  validateAddReaction,
  validationMiddleware,
  checkReactionPermission,
  addReaction
);

/**
 * @route   DELETE /api/comments/:commentId/react
 * @desc    Remove a reaction from a comment
 * @access  Private (role-based)
 */
router.delete(
  "/:commentId/react",
  protect,
  validateRemoveReaction,
  validationMiddleware,
  checkReactionPermission,
  removeReaction
);

/**
 * @route   GET /api/comments/:commentId/my-reaction
 * @desc    Get current user's reaction to a comment
 * @access  Private
 */
router.get(
  "/:commentId/my-reaction",
  protect,
  validateGetReactionStats,
  validationMiddleware,
  getUserReaction
);

/**
 * @route   GET /api/comments/:commentId/reactions
 * @desc    Get reaction statistics for a comment
 * @access  Private (role-based)
 */
router.get(
  "/:commentId/reactions",
  protect,
  validateGetReactionStats,
  validationMiddleware,
  getReactionStats
);

export default router;
