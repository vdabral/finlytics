const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const redis = require("../config/redis");
const marketDataService = require("../services/marketDataService");
const logger = require("../utils/logger");
const { promisify } = require("util");

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the application and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                     cache:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                     marketData:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *       500:
 *         description: Service is unhealthy
 */
router.get("/health", async (req, res) => {
  const startTime = Date.now();
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  try {
    // Check database connection
    const dbStart = Date.now();
    await mongoose.connection.db.admin().ping();
    healthStatus.services.database = {
      status: "healthy",
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    healthStatus.services.database = {
      status: "unhealthy",
      error: error.message,
    };
    healthStatus.status = "degraded";
  }

  // Check Redis connection
  try {
    const redisStart = Date.now();
    if (redis && redis.ping) {
      await promisify(redis.ping).bind(redis)();
      healthStatus.services.cache = {
        status: "healthy",
        responseTime: Date.now() - redisStart,
      };
    } else {
      healthStatus.services.cache = {
        status: "not_configured",
        message: "Using in-memory cache fallback",
      };
    }
  } catch (error) {
    healthStatus.services.cache = {
      status: "unhealthy",
      error: error.message,
    };
    healthStatus.status = "degraded";
  }

  // Check market data service
  try {
    const marketStart = Date.now();
    await marketDataService.healthCheck();
    healthStatus.services.marketData = {
      status: "healthy",
      responseTime: Date.now() - marketStart,
    };
  } catch (error) {
    healthStatus.services.marketData = {
      status: "unhealthy",
      error: error.message,
    };
    healthStatus.status = "degraded";
  }

  const responseTime = Date.now() - startTime;
  healthStatus.responseTime = responseTime;

  const httpStatus = healthStatus.status === "ok" ? 200 : 500;
  res.status(httpStatus).json(healthStatus);
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check endpoint
 *     description: Returns whether the application is ready to accept traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get("/health/ready", async (req, res) => {
  try {
    // Check if essential services are available
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Readiness check failed:", error);
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check endpoint
 *     description: Returns whether the application is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get("/health/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Application metrics endpoint
 *     description: Returns various application metrics for monitoring
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 system:
 *                   type: object
 *                 database:
 *                   type: object
 *                 api:
 *                   type: object
 *       401:
 *         description: Unauthorized access
 */
router.get("/metrics", async (req, res) => {
  try {
    const metrics = await getApplicationMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error("Failed to collect metrics:", error);
    res.status(500).json({
      error: "Failed to collect metrics",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Application status endpoint
 *     description: Returns detailed application status and configuration
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Application status
 */
router.get("/status", (req, res) => {
  const status = {
    application: {
      name: "Investment Portfolio Tracker",
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || 3000,
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    features: {
      authentication: true,
      realTimeUpdates: true,
      emailNotifications: !!process.env.SMTP_HOST,
      premiumFeatures: true,
      rateLimiting: true,
    },
    limits: {
      freeApiCalls: 5,
      premiumApiCalls: 100,
      portfoliosPerUser: process.env.NODE_ENV === "production" ? 10 : 50,
      assetsPerPortfolio: 100,
    },
  };

  res.json(status);
});

async function getApplicationMetrics() {
  const User = require("../models/User");
  const Portfolio = require("../models/Portfolio");
  const Asset = require("../models/Asset");
  const Transaction = require("../models/Transaction");

  const [
    userCount,
    portfolioCount,
    assetCount,
    transactionCount,
    activeUsers,
    premiumUsers,
  ] = await Promise.all([
    User.countDocuments(),
    Portfolio.countDocuments(),
    Asset.countDocuments(),
    Transaction.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isPremium: true }),
  ]);

  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      loadAverage:
        process.platform !== "win32" ? require("os").loadavg() : null,
    },
    database: {
      collections: {
        users: userCount,
        portfolios: portfolioCount,
        assets: assetCount,
        transactions: transactionCount,
      },
      connectionState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
    application: {
      users: {
        total: userCount,
        active: activeUsers,
        premium: premiumUsers,
        freeUsers: userCount - premiumUsers,
      },
      portfolios: {
        total: portfolioCount,
        averagePerUser:
          userCount > 0 ? (portfolioCount / userCount).toFixed(2) : 0,
      },
      transactions: {
        total: transactionCount,
        averagePerPortfolio:
          portfolioCount > 0
            ? (transactionCount / portfolioCount).toFixed(2)
            : 0,
      },
    },
    api: {
      rateLimits: {
        freeUserLimit: 100,
        premiumUserLimit: 1000,
        marketDataLimit: 5,
      },
      endpoints: {
        total: getEndpointCount(),
        authenticated: getAuthenticatedEndpointCount(),
      },
    },
  };
}

function getEndpointCount() {
  // This would count all registered routes
  // For now, returning a static count
  return 25;
}

function getAuthenticatedEndpointCount() {
  // This would count authenticated routes
  // For now, returning a static count
  return 20;
}

module.exports = router;
