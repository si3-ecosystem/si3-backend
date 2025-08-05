"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTENT_ACCESS_MAP = exports.ContentType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const usersModel_1 = require("./usersModel");
// Enums for content types and access control
var ContentType;
(function (ContentType) {
    ContentType["GUIDE_SESSION"] = "guide_session";
    ContentType["GUIDE_IDEAS_LAB"] = "guide_ideas_lab";
    ContentType["SCHOLAR_SESSION"] = "scholar_session";
    ContentType["SCHOLAR_IDEAS_LAB"] = "scholar_ideas_lab";
})(ContentType || (exports.ContentType = ContentType = {}));
// Content type to role mapping for access control
exports.CONTENT_ACCESS_MAP = {
    [ContentType.GUIDE_SESSION]: [usersModel_1.UserRole.GUIDE, usersModel_1.UserRole.ADMIN],
    [ContentType.GUIDE_IDEAS_LAB]: [usersModel_1.UserRole.GUIDE, usersModel_1.UserRole.ADMIN],
    [ContentType.SCHOLAR_SESSION]: [usersModel_1.UserRole.SCHOLAR, usersModel_1.UserRole.ADMIN],
    [ContentType.SCHOLAR_IDEAS_LAB]: [usersModel_1.UserRole.SCHOLAR, usersModel_1.UserRole.ADMIN],
};
// Reaction subdocument schema
const reactionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { _id: false });
// Comment schema definition
const commentSchema = new mongoose_1.Schema({
    contentId: {
        type: String,
        required: [true, "Content ID is required"],
        trim: true,
        index: true,
        validate: {
            validator: function (contentId) {
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
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: function (content) {
                // Prevent empty or whitespace-only comments
                return content.trim().length > 0;
            },
            message: "Comment cannot be empty or contain only whitespace",
        },
    },
    parentCommentId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: function (reactions) {
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
}, {
    timestamps: true,
    collection: "si3Comments",
});
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
        this.likeCount = this.reactions.filter((r) => r.type === "like").length;
        this.dislikeCount = this.reactions.filter((r) => r.type === "dislike").length;
    }
    next();
});
// Post-save middleware to update reply counts
commentSchema.post("save", function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        if (doc.parentCommentId && doc.isReply && !doc.isDeleted) {
            yield CommentModel.findByIdAndUpdate(doc.parentCommentId, { $inc: { replyCount: 1 } });
        }
    });
});
// Post-remove middleware to update reply counts
commentSchema.post("findOneAndUpdate", function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        if (doc && doc.parentCommentId && doc.isDeleted) {
            yield CommentModel.findByIdAndUpdate(doc.parentCommentId, { $inc: { replyCount: -1 } });
        }
    });
});
// Static methods for common queries
commentSchema.statics.findByContentId = function (contentId, contentType, options = {}) {
    const { includeReplies = true, limit = 50, skip = 0 } = options;
    const query = this.find(Object.assign({ contentId,
        contentType, isDeleted: false }, (includeReplies ? {} : { isReply: false })))
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
commentSchema.statics.findUserComments = function (userId, options = {}) {
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
commentSchema.statics.findThreadedComments = function (contentId, contentType, options = {}) {
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
                from: "si3Comments",
                let: { commentId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$parentCommentId", "$$commentId"] },
                                    { $eq: ["$isDeleted", false] },
                                    { $eq: ["$isReply", true] },
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "si3Users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "user",
                            pipeline: [{ $project: { email: 1, roles: 1 } }],
                        },
                    },
                    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                    { $sort: { createdAt: 1 } },
                    { $limit: 5 }, // Limit replies per comment for performance
                ],
                as: "replies",
            },
        },
        {
            $lookup: {
                from: "si3Users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
                pipeline: [{ $project: { email: 1, roles: 1 } }],
            },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
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
commentSchema.statics.getContentAnalytics = function (contentId, contentType) {
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
commentSchema.statics.addReaction = function (commentId, userId, reactionType) {
    return __awaiter(this, void 0, void 0, function* () {
        const comment = yield this.findById(commentId);
        if (!comment || comment.isDeleted) {
            throw new Error("Comment not found");
        }
        // Remove existing reaction from this user
        comment.reactions = comment.reactions.filter((reaction) => reaction.userId.toString() !== userId.toString());
        // Add new reaction
        comment.reactions.push({
            userId,
            type: reactionType,
            createdAt: new Date(),
        });
        yield comment.save();
        return comment;
    });
};
commentSchema.statics.removeReaction = function (commentId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const comment = yield this.findById(commentId);
        if (!comment || comment.isDeleted) {
            throw new Error("Comment not found");
        }
        // Remove reaction from this user
        comment.reactions = comment.reactions.filter((reaction) => reaction.userId.toString() !== userId.toString());
        yield comment.save();
        return comment;
    });
};
commentSchema.statics.getUserReaction = function (commentId, userId) {
    return this.findById(commentId)
        .select("reactions")
        .then((comment) => {
        if (!comment || comment.isDeleted)
            return null;
        const userReaction = comment.reactions.find((reaction) => reaction.userId.toString() === userId.toString());
        return userReaction ? userReaction.type : null;
    });
};
// Create and export model
const CommentModel = mongoose_1.default.model("Comment", commentSchema);
exports.default = CommentModel;
