const Redis = require("ioredis");
const logger = require("../utils/logger");

let redis = null;

// Initialize Redis connection (optional - fallback to memory cache if not available)
const initRedis = () => {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_PASSWORD) {
    try {
      redis = new Redis({
        host: process.env.UPSTASH_REDIS_URL,
        port: process.env.UPSTASH_REDIS_PORT || 6379,
        password: process.env.UPSTASH_REDIS_PASSWORD,
        tls: {},
        maxRetriesPerRequest: 1, // Limit retries for free tier
        retryDelayOnFailover: 100,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      redis.on("connect", () => {
        logger.info("Redis connected successfully");
      });

      redis.on("error", (err) => {
        logger.error("Redis connection error:", err);
        redis = null; // Fall back to memory cache
      });

      redis.on("close", () => {
        logger.warn("Redis connection closed");
        redis = null;
      });

      return redis;
    } catch (error) {
      logger.error("Error initializing Redis:", error);
      redis = null;
    }
  } else {
    logger.info("Redis not configured, using in-memory cache");
  }

  return null;
};

// Redis helper functions
const redisHelpers = {
  async get(key) {
    if (!redis) return null;
    try {
      return await redis.get(key);
    } catch (error) {
      logger.error("Redis get error:", error);
      return null;
    }
  },

  async set(key, value, ttl = 300) {
    if (!redis) return false;
    try {
      if (ttl) {
        await redis.setex(key, ttl, value);
      } else {
        await redis.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error("Redis set error:", error);
      return false;
    }
  },

  async del(key) {
    if (!redis) return false;
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error("Redis del error:", error);
      return false;
    }
  },

  async exists(key) {
    if (!redis) return false;
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error("Redis exists error:", error);
      return false;
    }
  },

  async flushAll() {
    if (!redis) return false;
    try {
      await redis.flushall();
      return true;
    } catch (error) {
      logger.error("Redis flushall error:", error);
      return false;
    }
  },
};

module.exports = {
  initRedis,
  redis: () => redis,
  redisHelpers,
};
