import mongoose, { Document, Schema, Types, Model } from "mongoose";
import { UserRole } from "./usersModel";

// Enums for content types and access control
export enum ContentType {
  GUIDE_SESSION = "guide_session",
  GUIDE_IDEAS_LAB = "guide_ideas_lab", 
  SCHOLAR_SESSION = "scholar_session",
  SCHOLAR_IDEAS_LAB = "scholar_ideas_lab",
}

// Content type to role mapping for access control
export const CONTENT_ACCESS_MAP: Record<ContentType, UserRole[]> = {
  [ContentType.GUIDE_SESSION]: [UserRole.GUIDE, UserRole.ADMIN],
  [ContentType.GUIDE_IDEAS_LAB]: [UserRole.GUIDE, UserRole.ADMIN],
  [ContentType.SCHOLAR_SESSION]: [UserRole.SCHOLAR, UserRole.ADMIN],
  [ContentType.SCHOLAR_IDEAS_LAB]: [UserRole.SCHOLAR, UserRole.ADMIN],
};

// Interface for reaction subdocument
export interface IReaction {
  userId: Types.ObjectId;
  type: 'like' | 'dislike';
  createdAt: Date;
}

// Interface for the comment document
export interface IComment extends Document {
  _id: Types.ObjectId;

  // Content identification (Sanity CMS integration)
  contentId: string; // Sanity document ID
  contentType: ContentType;

  // User and content
  userId: Types.ObjectId;
  content: string;

  // Threading support
  parentCommentId?: Types.ObjectId;
  isReply: boolean;
  replyCount: number;

  // Reactions
  reactions: IReaction[];
  likeCount: number;
  dislikeCount: number;

  // Moderation and status
  isEdited: boolean;
  isDeleted: boolean;
  editedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Interface for static methods
export interface ICommentModel extends Model<IComment> {
  findByContentId(
    contentId: string,
    contentType: ContentType,
    options?: { includeReplies?: boolean; limit?: number; skip?: number }
  ): any;

  findUserComments(
    userId: Types.ObjectId,
    options?: { limit?: number; skip?: number }
  ): any;

  findThreadedComments(
    contentId: string,
    contentType: ContentType,
    options?: { limit?: number; skip?: number }
  ): any;

  getContentAnalytics(
    contentId: string,
    contentType: ContentType
  ): any;

  addReaction(
    commentId: Types.ObjectId,
    userId: Types.ObjectId,
    reactionType: 'like' | 'dislike'
  ): Promise<IComment>;

  removeReaction(
    commentId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<IComment>;

  getUserReaction(
    commentId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string | null>;
}

// Reaction subdocument schema
const reactionSchema = new Schema<IReaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "SI3-User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      required: [true, "Reaction type is required"],
      enum: {
        values: ["like", "dislike"],
        message: "Reaction type must be either 'like' or 'dislike'",
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Comment schema definition
const commentSchema = new Schema<IComment>(
  {
    contentId: {
      type: String,
      required: [true, "Content ID is required"],
      trim: true,
      index: true,
      validate: {
        validator: function (contentId: string) {
          // Basic Sanity document ID validation (alphanumeric + hyphens)
          return /^[a-zA-Z0-9\-_]+$/.test(contentId);
        },
        message: "Please provide a valid Sanity content ID",
      },
    },

    contentType: {
      type: String,
      required: [true, "Content type is required"],
      enum: {
        values: Object.values(ContentType),
        message: "Invalid content type selected",
      },
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "SI3-User",
      required: [true, "User ID is required"],
      index: true,
    },

    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
      validate: {
        validator: function (content: string) {
          // Prevent empty or whitespace-only comments
          return content.trim().length > 0;
        },
        message: "Comment cannot be empty or contain only whitespace",
      },
    },

    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    isReply: {
      type: Boolean,
      default: false,
      index: true,
    },

    replyCount: {
      type: Number,
      default: 0,
      min: [0, "Reply count cannot be negative"],
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    reactions: {
      type: [reactionSchema],
      default: [],
      validate: {
        validator: function (reactions: IReaction[]) {
          // Ensure no duplicate reactions from the same user
          const userIds = reactions.map((reaction) => reaction.userId.toString());
          return userIds.length === new Set(userIds).size;
        },
        message: "A user can only have one reaction per comment",
      },
    },

    likeCount: {
      type: Number,
      default: 0,
      min: [0, "Like count cannot be negative"],
    },

    dislikeCount: {
      type: Number,
      default: 0,
      min: [0, "Dislike count cannot be negative"],
    },
  },
  {
    timestamps: true,
    collection: "si3Comments",
  }
);

// Compound indexes for optimal query performance
commentSchema.index({ contentId: 1, contentType: 1 });
commentSchema.index({ contentId: 1, isDeleted: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1, isDeleted: 1, createdAt: 1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ contentType: 1, createdAt: -1 });

// Virtual for populated user data
commentSchema.virtual("user", {
  ref: "SI3-User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for populated replies
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentCommentId",
  match: { isDeleted: false },
  options: { sort: { createdAt: 1 } },
});

// Ensure virtuals are included in JSON output
commentSchema.set("toJSON", { virtuals: true });
commentSchema.set("toObject", { virtuals: true });

// Pre-save middleware
commentSchema.pre("save", function (next) {
  // Set isReply based on parentCommentId
  this.isReply = !!this.parentCommentId;

  // Set editedAt when content is modified
  if (this.isModified("content") && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }

  // Clean content
  if (this.content) {
    this.content = this.content.trim();
  }

  // Update reaction counts when reactions are modified
  if (this.isModified("reactions")) {
    this.likeCount = this.reactions.filter((r: IReaction) => r.type === "like").length;
    this.dislikeCount = this.reactions.filter((r: IReaction) => r.type === "dislike").length;
  }

  next();
});

// Post-save middleware to update reply counts
commentSchema.post("save", async function (doc) {
  if (doc.parentCommentId && doc.isReply && !doc.isDeleted) {
    await CommentModel.findByIdAndUpdate(
      doc.parentCommentId,
      { $inc: { replyCount: 1 } }
    );
  }
});

// Post-remove middleware to update reply counts
commentSchema.post("findOneAndUpdate", async function (doc) {
  if (doc && doc.parentCommentId && doc.isDeleted) {
    await CommentModel.findByIdAndUpdate(
      doc.parentCommentId,
      { $inc: { replyCount: -1 } }
    );
  }
});

// Static methods for common queries
commentSchema.statics.findByContentId = function (
  contentId: string,
  contentType: ContentType,
  options: { includeReplies?: boolean; limit?: number; skip?: number } = {}
) {
  const { includeReplies = true, limit = 50, skip = 0 } = options;
  
  const query = this.find({
    contentId,
    contentType,
    isDeleted: false,
    ...(includeReplies ? {} : { isReply: false }),
  })
    .populate("user", "email roles")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  if (includeReplies) {
    query.populate({
      path: "replies",
      populate: { path: "user", select: "email roles" },
    });
  }

  return query;
};

commentSchema.statics.findUserComments = function (
  userId: Types.ObjectId,
  options: { limit?: number; skip?: number } = {}
) {
  const { limit = 20, skip = 0 } = options;

  return this.find({
    userId,
    isDeleted: false,
  })
    .populate("user", "email roles")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method for getting threaded comments with better performance
commentSchema.statics.findThreadedComments = function (
  contentId: string,
  contentType: ContentType,
  options: { limit?: number; skip?: number } = {}
) {
  const { limit = 20, skip = 0 } = options;

  return this.aggregate([
    {
      $match: {
        contentId,
        contentType,
        isDeleted: false,
        isReply: false, // Only top-level comments
      },
    },
    {
      $lookup: {
        from: "si3comments",
        let: { commentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$parentCommentId", "$$commentId"] },
                  { $eq: ["$isDeleted", false] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: "si3users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
              pipeline: [{ $project: { email: 1, roles: 1 } }],
            },
          },
          { $unwind: "$user" },
          { $sort: { createdAt: 1 } },
          { $limit: 5 }, // Limit replies per comment for performance
        ],
        as: "replies",
      },
    },
    {
      $lookup: {
        from: "si3users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { email: 1, roles: 1 } }],
      },
    },
    { $unwind: "$user" },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $addFields: {
        hasMoreReplies: { $gt: ["$replyCount", { $size: "$replies" }] },
      },
    },
  ]);
};

// Static method for comment analytics
commentSchema.statics.getContentAnalytics = function (
  contentId: string,
  contentType: ContentType
) {
  return this.aggregate([
    {
      $match: {
        contentId,
        contentType,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        totalReplies: {
          $sum: { $cond: [{ $eq: ["$isReply", true] }, 1, 0] },
        },
        totalTopLevel: {
          $sum: { $cond: [{ $eq: ["$isReply", false] }, 1, 0] },
        },
        uniqueUsers: { $addToSet: "$userId" },
        latestComment: { $max: "$createdAt" },
        oldestComment: { $min: "$createdAt" },
      },
    },
    {
      $addFields: {
        uniqueUserCount: { $size: "$uniqueUsers" },
      },
    },
    {
      $project: {
        uniqueUsers: 0, // Remove the array, keep only the count
      },
    },
  ]);
};

// Static methods for reaction management
commentSchema.statics.addReaction = async function (
  commentId: Types.ObjectId,
  userId: Types.ObjectId,
  reactionType: 'like' | 'dislike'
) {
  const comment = await this.findById(commentId);
  if (!comment || comment.isDeleted) {
    throw new Error("Comment not found");
  }

  // Remove existing reaction from this user
  comment.reactions = comment.reactions.filter(
    (reaction: IReaction) => reaction.userId.toString() !== userId.toString()
  );

  // Add new reaction
  comment.reactions.push({
    userId,
    type: reactionType,
    createdAt: new Date(),
  });

  await comment.save();
  return comment;
};

commentSchema.statics.removeReaction = async function (
  commentId: Types.ObjectId,
  userId: Types.ObjectId
) {
  const comment = await this.findById(commentId);
  if (!comment || comment.isDeleted) {
    throw new Error("Comment not found");
  }

  // Remove reaction from this user
  comment.reactions = comment.reactions.filter(
    (reaction: IReaction) => reaction.userId.toString() !== userId.toString()
  );

  await comment.save();
  return comment;
};

commentSchema.statics.getUserReaction = function (
  commentId: Types.ObjectId,
  userId: Types.ObjectId
) {
  return this.findById(commentId)
    .select("reactions")
    .then((comment: any) => {
      if (!comment || comment.isDeleted) return null;

      const userReaction = comment.reactions.find(
        (reaction: IReaction) => reaction.userId.toString() === userId.toString()
      );

      return userReaction ? userReaction.type : null;
    });
};

// Create and export model
const CommentModel = mongoose.model<IComment, ICommentModel>("Comment", commentSchema);

export default CommentModel;
