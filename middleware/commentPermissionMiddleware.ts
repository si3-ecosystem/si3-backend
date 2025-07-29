import { Request, Response, NextFunction } from "express";
import { ContentType, CONTENT_ACCESS_MAP } from "../models/commentsModel";
import CommentModel from "../models/commentsModel";
import { UserRole } from "../models/usersModel";
import AppError from "../utils/AppError";

/**
 * Middleware to check if user has permission to access specific content type
 */
export const checkContentAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to access comments.")
      );
    }

    // Get content type from request body or query
    const contentType = req.body?.contentType || req.query.contentType;

    if (!contentType) {
      return next(AppError.badRequest("Content type is required"));
    }

    // Check if content type is valid
    if (!Object.values(ContentType).includes(contentType as ContentType)) {
      return next(AppError.badRequest("Invalid content type"));
    }

    // Get allowed roles for this content type
    const allowedRoles = CONTENT_ACCESS_MAP[contentType as ContentType];

    // Check if user has roles property
    if (!req.user.roles || !Array.isArray(req.user.roles)) {
      return next(
        AppError.unauthorized("User roles not properly configured. Please contact support.")
      );
    }

    // Check if user has at least one of the required roles
    const hasAccess = req.user.roles.some((userRole) =>
      allowedRoles.includes(userRole as UserRole)
    );

    if (!hasAccess) {
      return next(
        AppError.forbidden(
          `You do not have permission to access ${contentType.replace(
            "_",
            " "
          )} content.`
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can comment on specific content
 * This is the same as checkContentAccess but with more specific error messages
 */
export const checkCommentPermission = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to comment.")
      );
    }

    const contentType = req.body?.contentType;

    if (!contentType) {
      return next(AppError.badRequest("Content type is required"));
    }

    // Check if content type is valid
    if (!Object.values(ContentType).includes(contentType as ContentType)) {
      return next(AppError.badRequest("Invalid content type"));
    }

    // Get allowed roles for this content type
    const allowedRoles = CONTENT_ACCESS_MAP[contentType as ContentType];

    // Check if user has at least one of the required roles
    const hasAccess = req.user.roles.some((userRole) =>
      allowedRoles.includes(userRole as UserRole)
    );

    if (!hasAccess) {
      const contentTypeDisplay = contentType.replace(/_/g, " ");
      return next(
        AppError.forbidden(
          `You do not have permission to comment on ${contentTypeDisplay} content. Only ${allowedRoles
            .filter((role) => role !== UserRole.ADMIN)
            .join(" and ")} users can comment on this content.`
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user owns a comment or is admin
 */
export const checkCommentOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to perform this action.")
      );
    }

    const commentId = req.params.commentId;

    if (!commentId) {
      return next(AppError.badRequest("Comment ID is required"));
    }

    // Find the comment
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return next(AppError.notFound("Comment not found"));
    }

    // Check if comment is already deleted
    if (comment.isDeleted) {
      return next(AppError.notFound("Comment not found"));
    }

    const currentUserId = req.user._id.toString();
    const commentUserId = comment.userId.toString();
    const isAdmin = req.user.roles.includes(UserRole.ADMIN);

    // Allow if user owns the comment or is admin
    if (commentUserId !== currentUserId && !isAdmin) {
      return next(
        AppError.forbidden("You can only modify your own comments.")
      );
    }

    // Attach comment to request for use in controller
    req.comment = comment;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate parent comment exists and user has access
 */
export const validateParentComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { parentCommentId, contentId, contentType } = req.body;

    // If no parent comment, skip validation
    if (!parentCommentId) {
      return next();
    }

    // Find the parent comment
    const parentComment = await CommentModel.findById(parentCommentId);

    if (!parentComment) {
      return next(AppError.badRequest("Parent comment not found"));
    }

    // Check if parent comment is deleted
    if (parentComment.isDeleted) {
      return next(AppError.badRequest("Cannot reply to a deleted comment"));
    }

    // Ensure parent comment belongs to the same content
    if (
      parentComment.contentId !== contentId ||
      parentComment.contentType !== contentType
    ) {
      return next(
        AppError.badRequest(
          "Parent comment must belong to the same content"
        )
      );
    }

    // Prevent nested replies (replies to replies)
    if (parentComment.isReply) {
      return next(
        AppError.badRequest("Cannot reply to a reply. Please reply to the original comment.")
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check rate limiting for comments (prevent spam)
 */
export const checkCommentRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to comment.")
      );
    }

    // Skip rate limiting for admins
    if (req.user.roles.includes(UserRole.ADMIN)) {
      return next();
    }

    const userId = req.user._id;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Count comments from this user in the last 5 minutes
    const recentCommentsCount = await CommentModel.countDocuments({
      userId,
      createdAt: { $gte: fiveMinutesAgo },
      isDeleted: false,
    });

    // Allow maximum 10 comments per 5 minutes
    if (recentCommentsCount >= 10) {
      return next(
        AppError.tooManyRequests(
          "You are commenting too frequently. Please wait a few minutes before commenting again."
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can react to a comment
 */
export const checkReactionPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to react to comments.")
      );
    }

    const commentId = req.params.commentId;

    if (!commentId) {
      return next(AppError.badRequest("Comment ID is required"));
    }

    // Find the comment to check its content type
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return next(AppError.notFound("Comment not found"));
    }

    // Check if comment is deleted
    if (comment.isDeleted) {
      return next(AppError.notFound("Comment not found"));
    }

    // Check if user has permission to access this content type
    const allowedRoles = CONTENT_ACCESS_MAP[comment.contentType as ContentType];
    const hasAccess = req.user.roles.some((userRole) =>
      allowedRoles.includes(userRole as UserRole)
    );

    if (!hasAccess) {
      const contentTypeDisplay = comment.contentType.replace(/_/g, " ");
      return next(
        AppError.forbidden(
          `You do not have permission to react to ${contentTypeDisplay} content.`
        )
      );
    }

    // Attach comment to request for use in controller
    req.comment = comment;
    next();
  } catch (error) {
    next(error);
  }
};

// Extend Request interface to include comment
declare global {
  namespace Express {
    interface Request {
      comment?: any;
    }
  }
}
