import redis from "../config/redis";
import { ContentType } from "../models/commentsModel";

// Cache key prefixes
const CACHE_PREFIXES = {
  COMMENTS_BY_CONTENT: "comments:content:",
  THREADED_COMMENTS: "comments:threaded:",
  COMMENT_STATS: "comments:stats:",
  USER_COMMENTS: "comments:user:",
  COMMENT_REPLIES: "comments:replies:",
  SINGLE_COMMENT: "comment:single:",
} as const;

// Cache TTL in seconds
const CACHE_TTL = {
  COMMENTS: 300, // 5 minutes
  STATS: 600, // 10 minutes
  SINGLE_COMMENT: 900, // 15 minutes
} as const;

class CommentCacheHelper {
  /**
   * Generate cache key for comments by content
   */
  private getContentCommentsKey(
    contentId: string,
    contentType: ContentType,
    page: number = 1,
    limit: number = 20,
    includeReplies: boolean = true
  ): string {
    return `${CACHE_PREFIXES.COMMENTS_BY_CONTENT}${contentId}:${contentType}:${page}:${limit}:${includeReplies}`;
  }

  /**
   * Generate cache key for threaded comments
   */
  private getThreadedCommentsKey(
    contentId: string,
    contentType: ContentType,
    page: number = 1,
    limit: number = 20
  ): string {
    return `${CACHE_PREFIXES.THREADED_COMMENTS}${contentId}:${contentType}:${page}:${limit}`;
  }

  /**
   * Generate cache key for comment statistics
   */
  private getStatsKey(contentId: string, contentType: ContentType): string {
    return `${CACHE_PREFIXES.COMMENT_STATS}${contentId}:${contentType}`;
  }

  /**
   * Generate cache key for user comments
   */
  private getUserCommentsKey(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): string {
    return `${CACHE_PREFIXES.USER_COMMENTS}${userId}:${page}:${limit}`;
  }

  /**
   * Generate cache key for comment replies
   */
  private getRepliesKey(
    commentId: string,
    page: number = 1,
    limit: number = 20
  ): string {
    return `${CACHE_PREFIXES.COMMENT_REPLIES}${commentId}:${page}:${limit}`;
  }

  /**
   * Generate cache key for single comment
   */
  private getSingleCommentKey(commentId: string): string {
    return `${CACHE_PREFIXES.SINGLE_COMMENT}${commentId}`;
  }

  /**
   * Cache comments by content
   */
  async cacheCommentsByContent(
    contentId: string,
    contentType: ContentType,
    page: number,
    limit: number,
    includeReplies: boolean,
    data: any
  ): Promise<void> {
    try {
      const key = this.getContentCommentsKey(contentId, contentType, page, limit, includeReplies);
      await redis.setex(key, CACHE_TTL.COMMENTS, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to cache comments by content:", error);
    }
  }

  /**
   * Get cached comments by content
   */
  async getCachedCommentsByContent(
    contentId: string,
    contentType: ContentType,
    page: number,
    limit: number,
    includeReplies: boolean
  ): Promise<any | null> {
    try {
      const key = this.getContentCommentsKey(contentId, contentType, page, limit, includeReplies);
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Failed to get cached comments by content:", error);
      return null;
    }
  }

  /**
   * Cache threaded comments
   */
  async cacheThreadedComments(
    contentId: string,
    contentType: ContentType,
    page: number,
    limit: number,
    data: any
  ): Promise<void> {
    try {
      const key = this.getThreadedCommentsKey(contentId, contentType, page, limit);
      await redis.setex(key, CACHE_TTL.COMMENTS, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to cache threaded comments:", error);
    }
  }

  /**
   * Get cached threaded comments
   */
  async getCachedThreadedComments(
    contentId: string,
    contentType: ContentType,
    page: number,
    limit: number
  ): Promise<any | null> {
    try {
      const key = this.getThreadedCommentsKey(contentId, contentType, page, limit);
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Failed to get cached threaded comments:", error);
      return null;
    }
  }

  /**
   * Cache comment statistics
   */
  async cacheCommentStats(
    contentId: string,
    contentType: ContentType,
    data: any
  ): Promise<void> {
    try {
      const key = this.getStatsKey(contentId, contentType);
      await redis.setex(key, CACHE_TTL.STATS, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to cache comment stats:", error);
    }
  }

  /**
   * Get cached comment statistics
   */
  async getCachedCommentStats(
    contentId: string,
    contentType: ContentType
  ): Promise<any | null> {
    try {
      const key = this.getStatsKey(contentId, contentType);
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Failed to get cached comment stats:", error);
      return null;
    }
  }

  /**
   * Cache user comments
   */
  async cacheUserComments(
    userId: string,
    page: number,
    limit: number,
    data: any
  ): Promise<void> {
    try {
      const key = this.getUserCommentsKey(userId, page, limit);
      await redis.setex(key, CACHE_TTL.COMMENTS, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to cache user comments:", error);
    }
  }

  /**
   * Get cached user comments
   */
  async getCachedUserComments(
    userId: string,
    page: number,
    limit: number
  ): Promise<any | null> {
    try {
      const key = this.getUserCommentsKey(userId, page, limit);
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Failed to get cached user comments:", error);
      return null;
    }
  }

  /**
   * Cache single comment
   */
  async cacheSingleComment(commentId: string, data: any): Promise<void> {
    try {
      const key = this.getSingleCommentKey(commentId);
      await redis.setex(key, CACHE_TTL.SINGLE_COMMENT, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to cache single comment:", error);
    }
  }

  /**
   * Get cached single comment
   */
  async getCachedSingleComment(commentId: string): Promise<any | null> {
    try {
      const key = this.getSingleCommentKey(commentId);
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Failed to get cached single comment:", error);
      return null;
    }
  }

  /**
   * Invalidate all caches related to a specific content
   */
  async invalidateContentCaches(contentId: string, contentType: ContentType): Promise<void> {
    try {
      const patterns = [
        `${CACHE_PREFIXES.COMMENTS_BY_CONTENT}${contentId}:${contentType}:*`,
        `${CACHE_PREFIXES.THREADED_COMMENTS}${contentId}:${contentType}:*`,
        `${CACHE_PREFIXES.COMMENT_STATS}${contentId}:${contentType}`,
      ];

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (error) {
      console.warn("Failed to invalidate content caches:", error);
    }
  }

  /**
   * Invalidate user-specific caches
   */
  async invalidateUserCaches(userId: string): Promise<void> {
    try {
      const pattern = `${CACHE_PREFIXES.USER_COMMENTS}${userId}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn("Failed to invalidate user caches:", error);
    }
  }

  /**
   * Invalidate single comment cache
   */
  async invalidateSingleCommentCache(commentId: string): Promise<void> {
    try {
      const key = this.getSingleCommentKey(commentId);
      await redis.del(key);
    } catch (error) {
      console.warn("Failed to invalidate single comment cache:", error);
    }
  }

  /**
   * Invalidate all comment-related caches (use sparingly)
   */
  async invalidateAllCommentCaches(): Promise<void> {
    try {
      const patterns = Object.values(CACHE_PREFIXES).map(prefix => `${prefix}*`);
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (error) {
      console.warn("Failed to invalidate all comment caches:", error);
    }
  }
}

const commentCacheHelper = new CommentCacheHelper();
export default commentCacheHelper;
