// import { Redis } from "ioredis";
// import redis from "../config/redis";

// class RedisHelper {
//   private client: Redis;

//   constructor() {
//     this.client = redis;
//   }

//   /////////////////////////////////////
//   // ===== BASIC CACHE OPERATIONS =====
//   /////////////////////////////////////

//   /**
//    * Store data in cache with expiration time
//    * @param key - Cache key
//    * @param value - Data to store (will be JSON stringified)
//    * @param ttl - Time to live in seconds (default: 10 minutes)
//    */
//   async cacheSet(key: string, value: any, ttl: number = 600): Promise<boolean> {
//     try {
//       const serializedValue =
//         typeof value === "string" ? value : JSON.stringify(value);
//       const result = await this.client.setex(key, ttl, serializedValue);
//       return result === "OK";
//     } catch (error) {
//       console.error("Cache set error:", error);
//       return false;
//     }
//   }

//   /**
//    * Get data from cache
//    * @param key - Cache key
//    * @returns Cached data or null if not found
//    */
//   async cacheGet<T = any>(key: string): Promise<T | null> {
//     try {
//       const value = await this.client.get(key);
//       if (value !== null) {
//         try {
//           return JSON.parse(value) as T;
//         } catch {
//           return value as T;
//         }
//       }
//       return null;
//     } catch (error) {
//       console.error("Cache get error:", error);
//       return null;
//     }
//   }

//   /**
//    * Delete data from cache
//    * @param key - Cache key or array of keys
//    * @returns Number of keys deleted
//    */
//   async cacheDelete(key: string | string[]): Promise<number> {
//     try {
//       if (Array.isArray(key)) {
//         return await this.client.del(...key);
//       }
//       return await this.client.del(key);
//     } catch (error) {
//       console.error("Cache delete error:", error);
//       return 0;
//     }
//   }

//   /**
//    * Check if cache key exists
//    * @param key - Cache key
//    * @returns True if key exists
//    */
//   async cacheExists(key: string): Promise<boolean> {
//     try {
//       const result = await this.client.exists(key);
//       return result === 1;
//     } catch (error) {
//       console.error("Cache exists error:", error);
//       return false;
//     }
//   }

//   /**
//    * Get remaining time to live for a key
//    * @param key - Cache key
//    * @returns Seconds remaining (-1 if key doesn't expire, -2 if key doesn't exist)
//    */
//   async cacheGetTTL(key: string): Promise<number> {
//     try {
//       return await this.client.ttl(key);
//     } catch (error) {
//       console.error("Cache TTL error:", error);
//       return -1;
//     }
//   }

//   /**
//    * Set expiration time for existing key
//    * @param key - Cache key
//    * @param seconds - Expiration time in seconds
//    * @returns True if expiration was set
//    */
//   async cacheSetExpiration(key: string, seconds: number): Promise<boolean> {
//     try {
//       const result = await this.client.expire(key, seconds);
//       return result === 1;
//     } catch (error) {
//       console.error("Cache expire error:", error);
//       return false;
//     }
//   }

//   /**
//    * Clear all cache data
//    * @returns True if successful
//    */
//   async cacheClearAll(): Promise<boolean> {
//     try {
//       const result = await this.client.flushall();
//       return result === "OK";
//     } catch (error) {
//       console.error("Cache flush error:", error);
//       return false;
//     }
//   }

//   ///////////////////////////////
//   // ===== BATCH OPERATIONS =====
//   ///////////////////////////////

//   /**
//    * Set multiple cache keys at once
//    * @param keyValuePairs - Object with key-value pairs
//    * @param ttl - Optional expiration time in seconds
//    * @returns True if all operations successful
//    */
//   async cacheSetMultiple(
//     keyValuePairs: { [key: string]: any },
//     ttl?: number
//   ): Promise<boolean> {
//     try {
//       const pipeline = this.client.pipeline();

//       Object.entries(keyValuePairs).forEach(([key, value]) => {
//         const serializedValue =
//           typeof value === "string" ? value : JSON.stringify(value);
//         if (ttl) {
//           pipeline.setex(key, ttl, serializedValue);
//         } else {
//           pipeline.set(key, serializedValue);
//         }
//       });

//       const results = await pipeline.exec();
//       return results?.every((result) => result && result[1] === "OK") || false;
//     } catch (error) {
//       console.error("Cache mset error:", error);
//       return false;
//     }
//   }

//   /**
//    * Get multiple cache keys at once
//    * @param keys - Array of cache keys
//    * @returns Object with key-value pairs
//    */
//   async cacheGetMultiple<T = any>(
//     keys: string[]
//   ): Promise<{ [key: string]: T | null }> {
//     try {
//       const values = await this.client.mget(...keys);
//       const result: { [key: string]: T | null } = {};

//       keys.forEach((key, index) => {
//         const value = values[index];
//         if (value !== null) {
//           try {
//             result[key] = JSON.parse(value) as T;
//           } catch {
//             result[key] = value as T;
//           }
//         } else {
//           result[key] = null;
//         }
//       });

//       return result;
//     } catch (error) {
//       console.error("Cache mget error:", error);
//       return {};
//     }
//   }

//   /////////////////////////////////
//   // ===== COUNTER OPERATIONS =====
//   /////////////////////////////////

//   /**
//    * Increment a counter by 1
//    * @param key - Counter key
//    * @returns New counter value
//    */
//   async counterIncrement(key: string): Promise<number> {
//     try {
//       return await this.client.incr(key);
//     } catch (error) {
//       console.error("Counter increment error:", error);
//       return 0;
//     }
//   }

//   /////////////////////////////////
//   // ===== SESSION MANAGEMENT =====
//   /////////////////////////////////

//   /**
//    * Store user session data
//    * @param sessionId - Unique session identifier
//    * @param sessionData - Session data object
//    * @param ttl - Session expiration in seconds (default: 1 hour)
//    * @returns True if session was stored
//    */
//   async sessionStore(
//     sessionId: string,
//     sessionData: any,
//     ttl: number = 3600
//   ): Promise<boolean> {
//     const sessionKey = `session:${sessionId}`;
//     return this.cacheSet(sessionKey, sessionData, ttl);
//   }

//   /**
//    * Get user session data
//    * @param sessionId - Session identifier
//    * @returns Session data or null if not found
//    */
//   async sessionGet<T = any>(sessionId: string): Promise<T | null> {
//     const sessionKey = `session:${sessionId}`;
//     return this.cacheGet<T>(sessionKey);
//   }

//   /**
//    * Update existing session with new data
//    * @param sessionId - Session identifier
//    * @param newData - New data to merge with existing session
//    * @param ttl - Reset expiration time (default: 1 hour)
//    * @returns True if session was updated
//    */
//   async sessionUpdate(
//     sessionId: string,
//     newData: any,
//     ttl: number = 3600
//   ): Promise<boolean> {
//     const sessionKey = `session:${sessionId}`;
//     const currentSession = (await this.cacheGet(sessionKey)) || {};
//     const updatedSession = { ...currentSession, ...newData };
//     return this.cacheSet(sessionKey, updatedSession, ttl);
//   }

//   /**
//    * Delete user session
//    * @param sessionId - Session identifier
//    * @returns True if session was deleted
//    */
//   async sessionDelete(sessionId: string): Promise<boolean> {
//     const sessionKey = `session:${sessionId}`;
//     const result = await this.cacheDelete(sessionKey);
//     return result > 0;
//   }

//   ////////////////////////////////
//   // ===== USER DATA CACHING =====
//   ////////////////////////////////

//   /**
//    * Cache user data by user ID
//    * @param userId - User identifier
//    * @param userData - User data object
//    * @param ttl - Cache expiration in seconds (default: 10 minutes)
//    * @returns True if user data was cached
//    */
//   async userCacheStore(
//     userId: string,
//     userData: any,
//     ttl: number = 600
//   ): Promise<boolean> {
//     const userKey = `user:${userId}`;
//     return this.cacheSet(userKey, userData, ttl);
//   }

//   /**
//    * Get cached user data
//    * @param userId - User identifier
//    * @returns User data or null if not found
//    */
//   async userCacheGet<T = any>(userId: string): Promise<T | null> {
//     const userKey = `user:${userId}`;
//     return this.cacheGet<T>(userKey);
//   }

//   /**
//    * Delete cached user data
//    * @param userId - User identifier
//    * @returns True if user data was deleted
//    */
//   async userCacheDelete(userId: string): Promise<boolean> {
//     const userKey = `user:${userId}`;
//     const result = await this.cacheDelete(userKey);
//     return result > 0;
//   }

//   ////////////////////////////
//   // ===== RATE LIMITING =====
//   ////////////////////////////

//   /**
//    * Check if request is within rate limit
//    * @param identifier - Unique identifier (IP, user ID, etc.)
//    * @param maxRequests - Maximum requests allowed
//    * @param windowSeconds - Time window in seconds
//    * @returns Object with rate limit info
//    */
//   async rateLimitCheck(
//     identifier: string,
//     maxRequests: number,
//     windowSeconds: number
//   ): Promise<{
//     allowed: boolean;
//     remaining: number;
//     resetTime: number;
//     total: number;
//   }> {
//     try {
//       const key = `rate_limit:${identifier}`;
//       const current = await this.counterIncrement(key);

//       if (current === 1) {
//         await this.cacheSetExpiration(key, windowSeconds);
//       }

//       const ttl = await this.cacheGetTTL(key);
//       const resetTime =
//         Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000);

//       return {
//         allowed: current <= maxRequests,
//         remaining: Math.max(0, maxRequests - current),
//         resetTime,
//         total: maxRequests,
//       };
//     } catch (error) {
//       console.error("Rate limit error:", error);
//       return {
//         allowed: true,
//         remaining: maxRequests,
//         resetTime: Date.now() + windowSeconds * 1000,
//         total: maxRequests,
//       };
//     }
//   }

//   // ===== UTILITY FUNCTIONS =====

//   /**
//    * Get Redis connection status
//    * @returns True if connected to Redis
//    */
//   isConnected(): boolean {
//     return this.client.status === "ready";
//   }

//   /**
//    * Get basic Redis statistics
//    * @returns Object with memory and performance stats
//    */
//   async getRedisStats(): Promise<{
//     memory_used?: string;
//     memory_peak?: string;
//     connected_clients?: string;
//     total_commands_processed?: string;
//   }> {
//     try {
//       const info = await this.client.info("memory");
//       const stats = await this.client.info("stats");
//       const clients = await this.client.info("clients");

//       const parseInfo = (infoString: string) => {
//         const result: { [key: string]: string } = {};
//         infoString.split("\r\n").forEach((line) => {
//           if (line.includes(":")) {
//             const [key, value] = line.split(":");
//             result[key] = value;
//           }
//         });
//         return result;
//       };

//       return {
//         ...parseInfo(info),
//         ...parseInfo(stats),
//         ...parseInfo(clients),
//       };
//     } catch (error) {
//       console.error("Redis stats error:", error);
//       return {};
//     }
//   }

//   /**
//    * Get the raw Redis client for advanced operations
//    * Use this only when you need Redis features not covered by helper methods
//    * @returns Redis client instance
//    */
//   getClient(): Redis {
//     return this.client;
//   }
// }

// const redisHelper = new RedisHelper();
// export default redisHelper;

// // 1. Basic Cache Operations (Most Used):

// // cacheSet() - Store data with expiration
// // cacheGet() - Retrieve cached data
// // cacheDelete() - Remove cached data
// // cacheExists() - Check if key exists
// // cacheGetTTL() - Get remaining time
// // cacheSetExpiration() - Set expiration for existing key
// // cacheClearAll() - Clear all cache

// // 2. Batch Operations (Performance):

// // cacheSetMultiple() - Set multiple keys at once
// // cacheGetMultiple() - Get multiple keys at once

// // 3. Counter Operations (Analytics):

// // counterIncrement() - Add 1 to counter

// // 4. Session Management (User Sessions):

// // sessionStore() - Save user session
// // sessionGet() - Get user session
// // sessionUpdate() - Update existing session
// // sessionDelete() - Remove user session

// // 5. User Data Caching (User Info):

// // userCacheStore() - Cache user data
// // userCacheGet() - Get cached user data
// // userCacheDelete() - Remove user cache

// // 6. Rate Limiting (API Protection):

// // rateLimitCheck() - Check if request allowed

// // 7. Utility Functions (Monitoring):

// // isConnected() - Check Redis connection
// // getRedisStats() - Get Redis performance stats
// // getClient() - Get raw Redis client for advanced use

import redis from "../config/redis";

class RedisHelper {
  // Set cache
  async cacheSet(key: string, value: any, ttl: number = 600): Promise<boolean> {
    try {
      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);
      const result = await redis.setex(key, ttl, serializedValue);
      return result === "OK";
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  // Get cache
  async cacheGet<T = any>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (value !== null) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }
      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  // Delete cache
  async cacheDelete(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  // Check if Redis is connected
  isConnected(): boolean {
    return redis.status === "ready";
  }
}

const redisHelper = new RedisHelper();
export default redisHelper;
