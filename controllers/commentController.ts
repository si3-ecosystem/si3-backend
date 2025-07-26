import { Request, Response, NextFunction } from "express";
import CommentModel, { ContentType } from "../models/commentsModel";
import commentCacheHelper from "../helpers/commentCacheHelper";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";

/**
 * Create a new comment
 */
export const createComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { contentId, contentType, content, parentCommentId } = req.body;
    const userId = req.user!._id;

    // Create the comment
    const newComment = await CommentModel.create({
      contentId,
      contentType,
      content,
      userId,
      parentCommentId: parentCommentId || null,
    });

    // Populate user data for response
    await newComment.populate("user", "email roles");

    // Invalidate related caches
    await commentCacheHelper.invalidateContentCaches(contentId, contentType);
    await commentCacheHelper.invalidateUserCaches(userId.toString());

    res.status(201).json({
      status: "success",
      data: {
        comment: newComment,
      },
    });
  }
);

/**
 * Get comments for specific content
 */
export const getCommentsByContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { contentId, contentType } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const includeReplies = req.query.includeReplies === "true";
    const skip = (page - 1) * limit;

    // Try to get from cache first
    const cachedResult = await commentCacheHelper.getCachedCommentsByContent(
      contentId as string,
      contentType as ContentType,
      page,
      limit,
      includeReplies
    );

    if (cachedResult) {
      res.status(200).json(cachedResult);
      return;
    }

    // Get comments using the static method
    const comments = await CommentModel.findByContentId(
      contentId as string,
      contentType as ContentType,
      { includeReplies, limit, skip }
    );

    // Get total count for pagination
    const totalComments = await CommentModel.countDocuments({
      contentId,
      contentType,
      isDeleted: false,
      ...(includeReplies ? {} : { isReply: false }),
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
    await commentCacheHelper.cacheCommentsByContent(
      contentId as string,
      contentType as ContentType,
      page,
      limit,
      includeReplies,
      result
    );

    res.status(200).json(result);
  }
);

/**
 * Get a single comment by ID
 */
export const getComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { commentId } = req.params;

    const comment = await CommentModel.findOne({
      _id: commentId,
      isDeleted: false,
    })
      .populate("user", "email roles")
      .populate({
        path: "replies",
        populate: { path: "user", select: "email roles" },
      });

    if (!comment) {
      return next(AppError.notFound("Comment not found"));
    }

    res.status(200).json({
      status: "success",
      data: {
        comment,
      },
    });
  }
);

/**
 * Get replies for a specific comment
 */
export const getCommentReplies = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { commentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // First check if parent comment exists
    const parentComment = await CommentModel.findOne({
      _id: commentId,
      isDeleted: false,
    });

    if (!parentComment) {
      return next(AppError.notFound("Parent comment not found"));
    }

    // Get replies
    const replies = await CommentModel.find({
      parentCommentId: commentId,
      isDeleted: false,
    })
      .populate("user", "email roles")
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(skip);

    // Get total count
    const totalReplies = await CommentModel.countDocuments({
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
  }
);

/**
 * Get user's comments
 */
export const getUserComments = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get user's comments using static method
    const comments = await CommentModel.findUserComments(userId, {
      limit,
      skip,
    });

    // Get total count
    const totalComments = await CommentModel.countDocuments({
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
  }
);

/**
 * Update a comment
 */
export const updateComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { content } = req.body;
    const comment = req.comment; // Set by checkCommentOwnership middleware

    // Update the comment
    comment.content = content;
    await comment.save();

    // Populate user data for response
    await comment.populate("user", "email roles");

    // Invalidate related caches
    await commentCacheHelper.invalidateContentCaches(
      comment.contentId,
      comment.contentType
    );
    await commentCacheHelper.invalidateSingleCommentCache(comment._id.toString());
    await commentCacheHelper.invalidateUserCaches(comment.userId.toString());

    res.status(200).json({
      status: "success",
      data: {
        comment,
      },
    });
  }
);

/**
 * Delete a comment (soft delete)
 */
export const deleteComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const comment = req.comment; // Set by checkCommentOwnership middleware

    // Soft delete the comment
    comment.isDeleted = true;
    comment.content = "[This comment has been deleted]";
    await comment.save();

    // Invalidate related caches
    await commentCacheHelper.invalidateContentCaches(
      comment.contentId,
      comment.contentType
    );
    await commentCacheHelper.invalidateSingleCommentCache(comment._id.toString());
    await commentCacheHelper.invalidateUserCaches(comment.userId.toString());

    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully",
    });
  }
);

/**
 * Get threaded comments for specific content (optimized for performance)
 */
export const getThreadedComments = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { contentId, contentType } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Try to get from cache first
    const cachedResult = await commentCacheHelper.getCachedThreadedComments(
      contentId as string,
      contentType as ContentType,
      page,
      limit
    );

    if (cachedResult) {
      res.status(200).json(cachedResult);
      return;
    }

    // Get threaded comments using the static method
    const comments = await CommentModel.findThreadedComments(
      contentId as string,
      contentType as ContentType,
      { limit, skip }
    );

    // Get total count for pagination
    const totalComments = await CommentModel.countDocuments({
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
    await commentCacheHelper.cacheThreadedComments(
      contentId as string,
      contentType as ContentType,
      page,
      limit,
      result
    );

    res.status(200).json(result);
  }
);

/**
 * Get comment statistics for content
 */
export const getCommentStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { contentId, contentType } = req.query;

    if (!contentId || !contentType) {
      return next(AppError.badRequest("Content ID and content type are required"));
    }

    // Get detailed analytics using the static method
    const analytics = await CommentModel.getContentAnalytics(
      contentId as string,
      contentType as ContentType
    );

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
  }
);

/**
 * Add a reaction (like/dislike) to a comment
 */
export const addReaction = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { type } = req.body;
    const comment = req.comment; // Set by checkReactionPermission middleware
    const userId = req.user!._id;

    // Add reaction using static method
    const updatedComment = await (CommentModel as any).addReaction(
      comment._id,
      userId,
      type
    );

    // Populate user data for response
    await updatedComment.populate("user", "email roles");

    // Invalidate related caches
    await commentCacheHelper.invalidateContentCaches(
      comment.contentId,
      comment.contentType
    );
    await commentCacheHelper.invalidateSingleCommentCache(comment._id.toString());

    res.status(200).json({
      status: "success",
      data: {
        comment: updatedComment,
        userReaction: type,
      },
    });
  }
);

/**
 * Remove a reaction from a comment
 */
export const removeReaction = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const comment = req.comment; // Set by checkReactionPermission middleware
    const userId = req.user!._id;

    // Remove reaction using static method
    const updatedComment = await (CommentModel as any).removeReaction(
      comment._id,
      userId
    );

    // Populate user data for response
    await updatedComment.populate("user", "email roles");

    // Invalidate related caches
    await commentCacheHelper.invalidateContentCaches(
      comment.contentId,
      comment.contentType
    );
    await commentCacheHelper.invalidateSingleCommentCache(comment._id.toString());

    res.status(200).json({
      status: "success",
      data: {
        comment: updatedComment,
        userReaction: null,
      },
    });
  }
);

/**
 * Get user's reaction to a comment
 */
export const getUserReaction = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { commentId } = req.params;
    const userId = req.user!._id;

    // Get user reaction using static method
    const userReaction = await (CommentModel as any).getUserReaction(
      commentId,
      userId
    );

    res.status(200).json({
      status: "success",
      data: {
        userReaction,
      },
    });
  }
);

/**
 * Get reaction statistics for a comment
 */
export const getReactionStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { commentId } = req.params;

    const comment = await CommentModel.findById(commentId).select(
      "likeCount dislikeCount reactions"
    );

    if (!comment || comment.isDeleted) {
      return next(AppError.notFound("Comment not found"));
    }

    // Get detailed reaction breakdown
    const reactionBreakdown = comment.reactions.reduce(
      (acc: any, reaction: any) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
      },
      { like: 0, dislike: 0 }
    );

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
  }
);
