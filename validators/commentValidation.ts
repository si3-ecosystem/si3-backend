import { body, param, query } from "express-validator";
import { ContentType } from "../models/commentsModel";

// Validation for creating a new comment
export const validateCreateComment = [
  body("contentId")
    .notEmpty()
    .withMessage("Content ID is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Content ID must be between 1 and 100 characters")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Content ID can only contain alphanumeric characters, hyphens, and underscores")
    .trim(),

  body("contentType")
    .notEmpty()
    .withMessage("Content type is required")
    .isIn(Object.values(ContentType))
    .withMessage(`Content type must be one of: ${Object.values(ContentType).join(", ")}`),

  body("content")
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

  body("parentCommentId")
    .optional()
    .isMongoId()
    .withMessage("Parent comment ID must be a valid MongoDB ObjectId"),
];

// Validation for updating a comment
export const validateUpdateComment = [
  param("commentId")
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ObjectId"),

  body("content")
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
export const validateDeleteComment = [
  param("commentId")
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ObjectId"),
];

// Validation for getting comments by content
export const validateGetCommentsByContent = [
  query("contentId")
    .notEmpty()
    .withMessage("Content ID is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Content ID must be between 1 and 100 characters")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Content ID can only contain alphanumeric characters, hyphens, and underscores")
    .trim(),

  query("contentType")
    .notEmpty()
    .withMessage("Content type is required")
    .isIn(Object.values(ContentType))
    .withMessage(`Content type must be one of: ${Object.values(ContentType).join(", ")}`),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("includeReplies")
    .optional()
    .isBoolean()
    .withMessage("includeReplies must be a boolean")
    .toBoolean(),
];

// Validation for getting user's comments
export const validateGetUserComments = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
];

// Validation for getting comment replies
export const validateGetCommentReplies = [
  param("commentId")
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ObjectId"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50")
    .toInt(),
];

// Validation for getting a single comment
export const validateGetComment = [
  param("commentId")
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ObjectId"),
];

// Custom validation for content access (used in middleware)
export const validateContentAccess = [
  body("contentId")
    .notEmpty()
    .withMessage("Content ID is required"),

  body("contentType")
    .notEmpty()
    .withMessage("Content type is required")
    .isIn(Object.values(ContentType))
    .withMessage(`Content type must be one of: ${Object.values(ContentType).join(", ")}`),
];

// Validation for adding a reaction (like/dislike)
export const validateAddReaction = [
  param("commentId")
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ObjectId"),

  body("type")
    .notEmpty()
    .withMessage("Reaction type is required")
    .isIn(["like", "dislike"])
    .withMessage("Reaction type must be either 'like' or 'dislike'"),
];

// Validation for removing a reaction
export const validateRemoveReaction = [
  param("commentId")
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ObjectId"),
];

// Validation for getting reaction statistics
export const validateGetReactionStats = [
  param("commentId")
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ObjectId"),
];
