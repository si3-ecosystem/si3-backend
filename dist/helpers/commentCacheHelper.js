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
const redis_1 = __importDefault(require("../config/redis"));
// Cache key prefixes
const CACHE_PREFIXES = {
    COMMENTS_BY_CONTENT: "comments:content:",
    THREADED_COMMENTS: "comments:threaded:",
    COMMENT_STATS: "comments:stats:",
    USER_COMMENTS: "comments:user:",
    COMMENT_REPLIES: "comments:replies:",
    SINGLE_COMMENT: "comment:single:",
};
// Cache TTL in seconds
const CACHE_TTL = {
    COMMENTS: 300, // 5 minutes
    STATS: 600, // 10 minutes
    SINGLE_COMMENT: 900, // 15 minutes
};
class CommentCacheHelper {
    /**
     * Generate cache key for comments by content
     */
    getContentCommentsKey(contentId, contentType, page = 1, limit = 20, includeReplies = true) {
        return `${CACHE_PREFIXES.COMMENTS_BY_CONTENT}${contentId}:${contentType}:${page}:${limit}:${includeReplies}`;
    }
    /**
     * Generate cache key for threaded comments
     */
    getThreadedCommentsKey(contentId, contentType, page = 1, limit = 20) {
        return `${CACHE_PREFIXES.THREADED_COMMENTS}${contentId}:${contentType}:${page}:${limit}`;
    }
    /**
     * Generate cache key for comment statistics
     */
    getStatsKey(contentId, contentType) {
        return `${CACHE_PREFIXES.COMMENT_STATS}${contentId}:${contentType}`;
    }
    /**
     * Generate cache key for user comments
     */
    getUserCommentsKey(userId, page = 1, limit = 20) {
        return `${CACHE_PREFIXES.USER_COMMENTS}${userId}:${page}:${limit}`;
    }
    /**
     * Generate cache key for comment replies
     */
    getRepliesKey(commentId, page = 1, limit = 20) {
        return `${CACHE_PREFIXES.COMMENT_REPLIES}${commentId}:${page}:${limit}`;
    }
    /**
     * Generate cache key for single comment
     */
    getSingleCommentKey(commentId) {
        return `${CACHE_PREFIXES.SINGLE_COMMENT}${commentId}`;
    }
    /**
     * Cache comments by content
     */
    cacheCommentsByContent(contentId, contentType, page, limit, includeReplies, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getContentCommentsKey(contentId, contentType, page, limit, includeReplies);
                yield redis_1.default.setex(key, CACHE_TTL.COMMENTS, JSON.stringify(data));
            }
            catch (error) {
                console.warn("Failed to cache comments by content:", error);
            }
        });
    }
    /**
     * Get cached comments by content
     */
    getCachedCommentsByContent(contentId, contentType, page, limit, includeReplies) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getContentCommentsKey(contentId, contentType, page, limit, includeReplies);
                const cached = yield redis_1.default.get(key);
                return cached ? JSON.parse(cached) : null;
            }
            catch (error) {
                console.warn("Failed to get cached comments by content:", error);
                return null;
            }
        });
    }
    /**
     * Cache threaded comments
     */
    cacheThreadedComments(contentId, contentType, page, limit, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getThreadedCommentsKey(contentId, contentType, page, limit);
                yield redis_1.default.setex(key, CACHE_TTL.COMMENTS, JSON.stringify(data));
            }
            catch (error) {
                console.warn("Failed to cache threaded comments:", error);
            }
        });
    }
    /**
     * Get cached threaded comments
     */
    getCachedThreadedComments(contentId, contentType, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getThreadedCommentsKey(contentId, contentType, page, limit);
                const cached = yield redis_1.default.get(key);
                return cached ? JSON.parse(cached) : null;
            }
            catch (error) {
                console.warn("Failed to get cached threaded comments:", error);
                return null;
            }
        });
    }
    /**
     * Cache comment statistics
     */
    cacheCommentStats(contentId, contentType, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getStatsKey(contentId, contentType);
                yield redis_1.default.setex(key, CACHE_TTL.STATS, JSON.stringify(data));
            }
            catch (error) {
                console.warn("Failed to cache comment stats:", error);
            }
        });
    }
    /**
     * Get cached comment statistics
     */
    getCachedCommentStats(contentId, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getStatsKey(contentId, contentType);
                const cached = yield redis_1.default.get(key);
                return cached ? JSON.parse(cached) : null;
            }
            catch (error) {
                console.warn("Failed to get cached comment stats:", error);
                return null;
            }
        });
    }
    /**
     * Cache user comments
     */
    cacheUserComments(userId, page, limit, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getUserCommentsKey(userId, page, limit);
                yield redis_1.default.setex(key, CACHE_TTL.COMMENTS, JSON.stringify(data));
            }
            catch (error) {
                console.warn("Failed to cache user comments:", error);
            }
        });
    }
    /**
     * Get cached user comments
     */
    getCachedUserComments(userId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getUserCommentsKey(userId, page, limit);
                const cached = yield redis_1.default.get(key);
                return cached ? JSON.parse(cached) : null;
            }
            catch (error) {
                console.warn("Failed to get cached user comments:", error);
                return null;
            }
        });
    }
    /**
     * Cache single comment
     */
    cacheSingleComment(commentId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getSingleCommentKey(commentId);
                yield redis_1.default.setex(key, CACHE_TTL.SINGLE_COMMENT, JSON.stringify(data));
            }
            catch (error) {
                console.warn("Failed to cache single comment:", error);
            }
        });
    }
    /**
     * Get cached single comment
     */
    getCachedSingleComment(commentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getSingleCommentKey(commentId);
                const cached = yield redis_1.default.get(key);
                return cached ? JSON.parse(cached) : null;
            }
            catch (error) {
                console.warn("Failed to get cached single comment:", error);
                return null;
            }
        });
    }
    /**
     * Invalidate all caches related to a specific content
     */
    invalidateContentCaches(contentId, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patterns = [
                    `${CACHE_PREFIXES.COMMENTS_BY_CONTENT}${contentId}:${contentType}:*`,
                    `${CACHE_PREFIXES.THREADED_COMMENTS}${contentId}:${contentType}:*`,
                    `${CACHE_PREFIXES.COMMENT_STATS}${contentId}:${contentType}`,
                ];
                for (const pattern of patterns) {
                    const keys = yield redis_1.default.keys(pattern);
                    if (keys.length > 0) {
                        yield redis_1.default.del(...keys);
                    }
                }
            }
            catch (error) {
                console.warn("Failed to invalidate content caches:", error);
            }
        });
    }
    /**
     * Invalidate user-specific caches
     */
    invalidateUserCaches(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pattern = `${CACHE_PREFIXES.USER_COMMENTS}${userId}:*`;
                const keys = yield redis_1.default.keys(pattern);
                if (keys.length > 0) {
                    yield redis_1.default.del(...keys);
                }
            }
            catch (error) {
                console.warn("Failed to invalidate user caches:", error);
            }
        });
    }
    /**
     * Invalidate single comment cache
     */
    invalidateSingleCommentCache(commentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.getSingleCommentKey(commentId);
                yield redis_1.default.del(key);
            }
            catch (error) {
                console.warn("Failed to invalidate single comment cache:", error);
            }
        });
    }
    /**
     * Invalidate all comment-related caches (use sparingly)
     */
    invalidateAllCommentCaches() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patterns = Object.values(CACHE_PREFIXES).map(prefix => `${prefix}*`);
                for (const pattern of patterns) {
                    const keys = yield redis_1.default.keys(pattern);
                    if (keys.length > 0) {
                        yield redis_1.default.del(...keys);
                    }
                }
            }
            catch (error) {
                console.warn("Failed to invalidate all comment caches:", error);
            }
        });
    }
}
const commentCacheHelper = new CommentCacheHelper();
exports.default = commentCacheHelper;
