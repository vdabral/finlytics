const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const User = require("../models/User");
const Portfolio = require("../models/Portfolio");
const Asset = require("../models/Asset");
const Transaction = require("../models/Transaction");
const DataCleanupJob = require("../jobs/dataCleanupJob");
const EmailNotificationJob = require("../jobs/emailNotificationJob");
const logger = require("../utils/logger");

// Middleware to ensure admin access
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get(
  "/users",
  [
    authenticateToken,
    requireAdmin,
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(["active", "inactive", "all"]),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status || "all";

      let filter = {};
      if (status === "active") filter.isActive = true;
      if (status === "inactive") filter.isActive = false;

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filter)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error("Admin get users error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve users",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   patch:
 *     summary: Update user status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *               isPremium:
 *                 type: boolean
 *               isAdmin:
 *                 type: boolean
 */
router.patch(
  "/users/:userId/status",
  [
    authenticateToken,
    requireAdmin,
    param("userId").isMongoId(),
    body("isActive").optional().isBoolean(),
    body("isPremium").optional().isBoolean(),
    body("isAdmin").optional().isBoolean(),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive, isPremium, isAdmin } = req.body;

      const updateFields = {};
      if (typeof isActive === "boolean") updateFields.isActive = isActive;
      if (typeof isPremium === "boolean") updateFields.isPremium = isPremium;
      if (typeof isAdmin === "boolean") updateFields.isAdmin = isAdmin;

      const user = await User.findByIdAndUpdate(userId, updateFields, {
        new: true,
        select: "-password",
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      logger.info(
        `Admin ${req.user._id} updated user ${userId} status:`,
        updateFields
      );

      res.json({
        success: true,
        message: "User status updated successfully",
        user,
      });
    } catch (error) {
      logger.error("Admin update user status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update user status",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/system/stats:
 *   get:
 *     summary: Get system statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/system/stats",
  [authenticateToken, requireAdmin],
  async (req, res) => {
    try {
      const [
        totalUsers,
        activeUsers,
        premiumUsers,
        totalPortfolios,
        totalAssets,
        totalTransactions,
        recentUsers,
        recentTransactions,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isPremium: true }),
        Portfolio.countDocuments(),
        Asset.countDocuments(),
        Transaction.countDocuments(),
        User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }),
        Transaction.countDocuments({
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }),
      ]);

      // Get top assets by portfolio count
      const topAssets = await Portfolio.aggregate([
        { $unwind: "$assets" },
        { $group: { _id: "$assets.assetId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "assets",
            localField: "_id",
            foreignField: "_id",
            as: "asset",
          },
        },
        { $unwind: "$asset" },
        {
          $project: { symbol: "$asset.symbol", name: "$asset.name", count: 1 },
        },
      ]);

      const stats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          premium: premiumUsers,
          free: totalUsers - premiumUsers,
          recentSignups: recentUsers,
        },
        portfolios: {
          total: totalPortfolios,
          averagePerUser:
            totalUsers > 0 ? (totalPortfolios / totalUsers).toFixed(2) : 0,
        },
        assets: {
          total: totalAssets,
          topAssets,
        },
        transactions: {
          total: totalTransactions,
          recent: recentTransactions,
          averagePerPortfolio:
            totalPortfolios > 0
              ? (totalTransactions / totalPortfolios).toFixed(2)
              : 0,
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV,
        },
      };

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error("Admin get stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve system statistics",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/system/cleanup:
 *   post:
 *     summary: Trigger manual data cleanup (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comprehensive:
 *                 type: boolean
 *                 default: false
 */
router.post(
  "/system/cleanup",
  [
    authenticateToken,
    requireAdmin,
    body("comprehensive").optional().isBoolean(),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { comprehensive = false } = req.body;

      const cleanupJob = new DataCleanupJob();
      await cleanupJob.manualCleanup({ comprehensive });

      logger.info(
        `Admin ${req.user._id} triggered ${
          comprehensive ? "comprehensive" : "standard"
        } cleanup`
      );

      res.json({
        success: true,
        message: `${
          comprehensive ? "Comprehensive" : "Standard"
        } cleanup completed successfully`,
      });
    } catch (error) {
      logger.error("Admin cleanup error:", error);
      res.status(500).json({
        success: false,
        message: "Cleanup failed",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/assets/update-prices:
 *   post:
 *     summary: Trigger manual price update (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbols:
 *                 type: array
 *                 items:
 *                   type: string
 *               forceUpdate:
 *                 type: boolean
 *                 default: false
 */
router.post(
  "/assets/update-prices",
  [
    authenticateToken,
    requireAdmin,
    body("symbols").optional().isArray(),
    body("symbols.*").optional().isString(),
    body("forceUpdate").optional().isBoolean(),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { symbols, forceUpdate = false } = req.body;
      const assetService = require("../services/assetService");

      let assetsToUpdate;
      if (symbols && symbols.length > 0) {
        assetsToUpdate = await Asset.find({ symbol: { $in: symbols } });
      } else {
        // Get all active assets (referenced in portfolios)
        const referencedAssetIds = await Portfolio.aggregate([
          { $unwind: "$assets" },
          { $group: { _id: "$assets.assetId" } },
        ]);

        assetsToUpdate = await Asset.find({
          _id: { $in: referencedAssetIds.map((item) => item._id) },
        });
      }

      const updateResults = [];
      for (const asset of assetsToUpdate) {
        try {
          const updated = await assetService.updateAssetPrice(
            asset.symbol,
            forceUpdate
          );
          updateResults.push({
            symbol: asset.symbol,
            success: true,
            updated,
          });
        } catch (error) {
          updateResults.push({
            symbol: asset.symbol,
            success: false,
            error: error.message,
          });
        }
      }

      logger.info(
        `Admin ${req.user._id} triggered price update for ${assetsToUpdate.length} assets`
      );

      res.json({
        success: true,
        message: "Price update completed",
        results: updateResults,
        summary: {
          total: updateResults.length,
          successful: updateResults.filter((r) => r.success).length,
          failed: updateResults.filter((r) => !r.success).length,
        },
      });
    } catch (error) {
      logger.error("Admin price update error:", error);
      res.status(500).json({
        success: false,
        message: "Price update failed",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/notifications/send:
 *   post:
 *     summary: Send notifications to users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [announcement, maintenance, alert]
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               sendToAll:
 *                 type: boolean
 */
router.post(
  "/notifications/send",
  [
    authenticateToken,
    requireAdmin,
    body("type").isIn(["announcement", "maintenance", "alert"]),
    body("subject").isLength({ min: 1, max: 200 }),
    body("message").isLength({ min: 1, max: 2000 }),
    body("userIds").optional().isArray(),
    body("userIds.*").optional().isMongoId(),
    body("sendToAll").optional().isBoolean(),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { type, subject, message, userIds, sendToAll = false } = req.body;
      const emailService = require("../services/emailService");

      let targetUsers;
      if (sendToAll) {
        targetUsers = await User.find({
          emailVerified: true,
          isActive: true,
        }).select("email name");
      } else if (userIds && userIds.length > 0) {
        targetUsers = await User.find({
          _id: { $in: userIds },
          emailVerified: true,
          isActive: true,
        }).select("email name");
      } else {
        return res.status(400).json({
          success: false,
          message: "Either provide userIds or set sendToAll to true",
        });
      }

      const sendResults = [];
      for (const user of targetUsers) {
        try {
          await emailService.sendAdminNotification(user.email, {
            userName: user.name,
            type,
            subject,
            message,
          });
          sendResults.push({
            email: user.email,
            success: true,
          });
        } catch (error) {
          sendResults.push({
            email: user.email,
            success: false,
            error: error.message,
          });
        }
      }

      logger.info(
        `Admin ${req.user._id} sent ${type} notification to ${targetUsers.length} users`
      );

      res.json({
        success: true,
        message: "Notifications sent",
        results: sendResults,
        summary: {
          total: sendResults.length,
          successful: sendResults.filter((r) => r.success).length,
          failed: sendResults.filter((r) => !r.success).length,
        },
      });
    } catch (error) {
      logger.error("Admin send notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send notifications",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get application logs (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 */
router.get(
  "/logs",
  [
    authenticateToken,
    requireAdmin,
    query("level").optional().isIn(["error", "warn", "info", "debug"]),
    query("limit").optional().isInt({ min: 1, max: 1000 }),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { level, limit = 100 } = req.query;

      // This is a simplified implementation
      // In production, you might read from log files or a logging service
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Application started",
          meta: { component: "server" },
        },
        // Add more logs here or implement actual log reading
      ];

      res.json({
        success: true,
        logs: logs.slice(0, limit),
        filters: { level, limit },
      });
    } catch (error) {
      logger.error("Admin get logs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve logs",
      });
    }
  }
);

module.exports = router;
