const { redisHelpers } = require("../config/redis");
const logger = require("./logger");

// In-Memory Cache as fallback when Redis is not available
class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }
  set(key, value, ttl = 300) {
    // 5 minutes default TTL
    try {
      // Clear existing timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }

      // Set value
      this.cache.set(key, {
        value: typeof value === "string" ? value : JSON.stringify(value),
        timestamp: Date.now(),
      });

      this.stats.sets++;

      // Set expiration timer
      if (ttl > 0) {
        const timer = setTimeout(() => {
          this.cache.delete(key);
          this.timers.delete(key);
        }, ttl * 1000);

        this.timers.set(key, timer);
      }

      return true;
    } catch (error) {
      logger.error("InMemoryCache set error:", error);
      return false;
    }
  }

  // Alias for Redis compatibility
  setex(key, ttl, value) {
    return this.set(key, value, ttl);
  }

  get(key) {
    try {
      const item = this.cache.get(key);
      if (item) {
        this.stats.hits++;
        try {
          return JSON.parse(item.value);
        } catch {
          return item.value;
        }
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      logger.error("InMemoryCache get error:", error);
      this.stats.misses++;
      return null;
    }
  }

  del(key) {
    try {
      const deleted = this.cache.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      if (deleted) {
        this.stats.deletes++;
      }
      return deleted;
    } catch (error) {
      logger.error("InMemoryCache del error:", error);
      return false;
    }
  }

  exists(key) {
    return this.cache.has(key);
  }

  clear() {
    try {
      // Clear all timers
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      this.timers.clear();
      this.cache.clear();
      return true;
    } catch (error) {
      logger.error("InMemoryCache clear error:", error);
      return false;
    }
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  // Clean up expired entries manually (fallback for timer failures)
  cleanup() {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      // This is a simple cleanup - in production you'd want more sophisticated logic
      if (now - item.timestamp > 30 * 60 * 1000) {
        // 30 minutes
        this.del(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`InMemoryCache cleanup: removed ${cleaned} expired entries`);
    }

    return cleaned;
  }
}

// Create singleton instance
const memoryCache = new InMemoryCache();

// Unified cache interface that uses Redis when available, falls back to memory
class CacheManager {
  constructor() {
    this.preferRedis = true;
  }

  async get(key) {
    try {
      // Try Redis first
      if (this.preferRedis) {
        const value = await redisHelpers.get(key);
        if (value !== null) {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
      }

      // Fallback to memory cache
      return memoryCache.get(key);
    } catch (error) {
      logger.error("Cache get error:", error);
      return null;
    }
  }
  async set(key, value, ttl = 300) {
    try {
      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);

      // Try Redis first
      if (this.preferRedis) {
        const success = await redisHelpers.set(key, serializedValue, ttl);
        if (success) {
          return true;
        }
      }

      // Fallback to memory cache
      return memoryCache.set(key, serializedValue, ttl);
    } catch (error) {
      logger.error("Cache set error:", error);
      return false;
    }
  }

  // Alias for Redis compatibility
  async setex(key, ttl, value) {
    return this.set(key, value, ttl);
  }

  async del(key) {
    try {
      let deleted = false;

      // Try Redis first
      if (this.preferRedis) {
        deleted = await redisHelpers.del(key);
      }

      // Also delete from memory cache
      const memDeleted = memoryCache.del(key);

      return deleted || memDeleted;
    } catch (error) {
      logger.error("Cache del error:", error);
      return false;
    }
  }

  async exists(key) {
    try {
      // Try Redis first
      if (this.preferRedis) {
        const exists = await redisHelpers.exists(key);
        if (exists) return true;
      }

      // Check memory cache
      return memoryCache.exists(key);
    } catch (error) {
      logger.error("Cache exists error:", error);
      return false;
    }
  }

  async clear() {
    try {
      let cleared = false;

      // Try Redis first
      if (this.preferRedis) {
        cleared = await redisHelpers.flushAll();
      }

      // Clear memory cache
      const memCleared = memoryCache.clear();

      return cleared || memCleared;
    } catch (error) {
      logger.error("Cache clear error:", error);
      return false;
    }
  }

  // Cache key generators
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(":")}`;
  }

  // Common cache patterns
  async getOrSet(key, fetchFunction, ttl = 300) {
    try {
      // Try to get from cache first
      let value = await this.get(key);
      if (value !== null) {
        return value;
      }

      // Fetch data and cache it
      value = await fetchFunction();
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      logger.error("Cache getOrSet error:", error);
      // If cache fails, still try to fetch data
      try {
        return await fetchFunction();
      } catch (fetchError) {
        logger.error("Cache getOrSet fetch error:", fetchError);
        return null;
      }
    }
  }

  // Batch operations
  async mget(keys) {
    const results = {};
    for (const key of keys) {
      results[key] = await this.get(key);
    }
    return results;
  }

  async mset(keyValuePairs, ttl = 300) {
    const results = {};
    for (const [key, value] of Object.entries(keyValuePairs)) {
      results[key] = await this.set(key, value, ttl);
    }
    return results;
  }

  // Cache warming
  async warmup(warmupFunctions) {
    logger.info("Starting cache warmup...");
    const results = [];

    for (const [key, fetchFunction, ttl] of warmupFunctions) {
      try {
        const value = await fetchFunction();
        if (value !== null && value !== undefined) {
          await this.set(key, value, ttl || 300);
          results.push({ key, success: true });
        }
      } catch (error) {
        logger.error(`Cache warmup failed for key ${key}:`, error);
        results.push({ key, success: false, error: error.message });
      }
    }

    logger.info(
      `Cache warmup completed: ${results.filter((r) => r.success).length}/${
        results.length
      } successful`
    );
    return results;
  }

  // Get cache statistics
  getStats() {
    return {
      memory: memoryCache.getStats(),
      redis: this.preferRedis ? "connected" : "not connected",
    };
  }

  // Cleanup method
  cleanup() {
    return memoryCache.cleanup();
  }
}

// Create singleton instance
const cache = new CacheManager();

// Predefined cache keys and TTLs
const CACHE_KEYS = {
  USER_PROFILE: (userId) => cache.generateKey("user", userId),
  PORTFOLIO_LIST: (userId) => cache.generateKey("portfolios", userId),
  PORTFOLIO_DETAIL: (portfolioId) =>
    cache.generateKey("portfolio", portfolioId),
  ASSET_PRICE: (symbol) => cache.generateKey("price", symbol),
  MARKET_DATA: (symbols) =>
    cache.generateKey("market", symbols.sort().join(",")),
  USER_TRANSACTIONS: (userId, page) =>
    cache.generateKey("transactions", userId, page),
  PORTFOLIO_PERFORMANCE: (portfolioId) =>
    cache.generateKey("performance", portfolioId),
  ASSET_HISTORY: (symbol, period) =>
    cache.generateKey("history", symbol, period),
};

const CACHE_TTL = {
  USER_PROFILE: 30 * 60, // 30 minutes
  PORTFOLIO_LIST: 10 * 60, // 10 minutes
  PORTFOLIO_DETAIL: 5 * 60, // 5 minutes
  ASSET_PRICE: 5 * 60, // 5 minutes
  MARKET_DATA: 5 * 60, // 5 minutes
  USER_TRANSACTIONS: 15 * 60, // 15 minutes
  PORTFOLIO_PERFORMANCE: 10 * 60, // 10 minutes
  ASSET_HISTORY: 60 * 60, // 1 hour
};

module.exports = {
  cache,
  memoryCache,
  CacheManager,
  CACHE_KEYS,
  CACHE_TTL,
};
