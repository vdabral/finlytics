const cron = require("node-cron");
const logger = require("../utils/logger");
const User = require("../models/User");
const Portfolio = require("../models/Portfolio");
const Asset = require("../models/Asset");
const Transaction = require("../models/Transaction");

class DataCleanupJob {
  constructor() {
    this.isRunning = false;
  }

  start() {
    // Run cleanup daily at 2 AM
    cron.schedule("0 2 * * *", async () => {
      if (this.isRunning) return;

      this.isRunning = true;
      logger.info("Starting daily data cleanup job");

      try {
        await this.runCleanupTasks();
      } catch (error) {
        logger.error("Data cleanup job failed:", error);
      } finally {
        this.isRunning = false;
      }
    });

    // Run comprehensive cleanup weekly on Sundays at 3 AM
    cron.schedule("0 3 * * 0", async () => {
      if (this.isRunning) return;

      this.isRunning = true;
      logger.info("Starting weekly comprehensive cleanup job");

      try {
        await this.runComprehensiveCleanup();
      } catch (error) {
        logger.error("Comprehensive cleanup job failed:", error);
      } finally {
        this.isRunning = false;
      }
    });

    logger.info("Data cleanup jobs scheduled");
  }

  async runCleanupTasks() {
    try {
      await Promise.all([
        this.cleanupExpiredTokens(),
        this.cleanupOldPriceHistory(),
        this.cleanupInactiveUsers(),
        this.optimizeDatabase(),
      ]);

      logger.info("Daily cleanup tasks completed successfully");
    } catch (error) {
      logger.error("Failed to complete daily cleanup tasks:", error);
      throw error;
    }
  }

  async runComprehensiveCleanup() {
    try {
      await Promise.all([
        this.cleanupExpiredTokens(),
        this.cleanupOldPriceHistory(),
        this.cleanupInactiveUsers(),
        this.cleanupOrphanedData(),
        this.compactPriceHistory(),
        this.cleanupOldTransactions(),
        this.optimizeDatabase(),
      ]);

      logger.info("Comprehensive cleanup tasks completed successfully");
    } catch (error) {
      logger.error("Failed to complete comprehensive cleanup tasks:", error);
      throw error;
    }
  }

  async cleanupExpiredTokens() {
    try {
      const now = new Date();

      // Clean up expired password reset tokens
      const passwordResetResult = await User.updateMany(
        {
          passwordResetToken: { $exists: true },
          passwordResetExpires: { $lt: now },
        },
        {
          $unset: {
            passwordResetToken: "",
            passwordResetExpires: "",
          },
        }
      );

      // Clean up expired email verification tokens
      const emailVerificationResult = await User.updateMany(
        {
          emailVerificationToken: { $exists: true },
          emailVerificationExpires: { $lt: now },
        },
        {
          $unset: {
            emailVerificationToken: "",
            emailVerificationExpires: "",
          },
        }
      );

      logger.info(
        `Cleaned up ${passwordResetResult.modifiedCount} expired password reset tokens`
      );
      logger.info(
        `Cleaned up ${emailVerificationResult.modifiedCount} expired email verification tokens`
      );
    } catch (error) {
      logger.error("Failed to cleanup expired tokens:", error);
      throw error;
    }
  }

  async cleanupOldPriceHistory() {
    try {
      // Keep only last 2 years of price history for free tier users
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const result = await Asset.updateMany(
        {},
        {
          $pull: {
            priceHistory: {
              date: { $lt: twoYearsAgo },
            },
          },
        }
      );

      logger.info(
        `Cleaned up old price history from ${result.modifiedCount} assets`
      );
    } catch (error) {
      logger.error("Failed to cleanup old price history:", error);
      throw error;
    }
  }

  async cleanupInactiveUsers() {
    try {
      // Mark users as inactive if they haven't logged in for 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const inactiveUsersResult = await User.updateMany(
        {
          lastLogin: { $lt: sixMonthsAgo },
          isActive: true,
        },
        {
          $set: { isActive: false },
        }
      );

      // Delete unverified users older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const unverifiedUsersResult = await User.deleteMany({
        emailVerified: false,
        createdAt: { $lt: thirtyDaysAgo },
      });

      logger.info(
        `Marked ${inactiveUsersResult.modifiedCount} users as inactive`
      );
      logger.info(
        `Deleted ${unverifiedUsersResult.deletedCount} unverified users`
      );
    } catch (error) {
      logger.error("Failed to cleanup inactive users:", error);
      throw error;
    }
  }

  async cleanupOrphanedData() {
    try {
      // Find and delete portfolios without valid users
      const orphanedPortfolios = await Portfolio.find({
        userId: { $nin: await User.distinct("_id") },
      });

      if (orphanedPortfolios.length > 0) {
        await Portfolio.deleteMany({
          _id: { $in: orphanedPortfolios.map((p) => p._id) },
        });
        logger.info(`Deleted ${orphanedPortfolios.length} orphaned portfolios`);
      }

      // Find and delete transactions without valid portfolios
      const orphanedTransactions = await Transaction.find({
        portfolioId: { $nin: await Portfolio.distinct("_id") },
      });

      if (orphanedTransactions.length > 0) {
        await Transaction.deleteMany({
          _id: { $in: orphanedTransactions.map((t) => t._id) },
        });
        logger.info(
          `Deleted ${orphanedTransactions.length} orphaned transactions`
        );
      }

      // Clean up assets that are no longer referenced in any portfolio
      const referencedAssetIds = await Portfolio.aggregate([
        { $unwind: "$assets" },
        { $group: { _id: "$assets.assetId" } },
      ]);

      const referencedIds = referencedAssetIds.map((item) => item._id);
      const unreferencedAssets = await Asset.find({
        _id: { $nin: referencedIds },
      });

      if (unreferencedAssets.length > 0) {
        await Asset.deleteMany({
          _id: { $in: unreferencedAssets.map((a) => a._id) },
        });
        logger.info(`Deleted ${unreferencedAssets.length} unreferenced assets`);
      }
    } catch (error) {
      logger.error("Failed to cleanup orphaned data:", error);
      throw error;
    }
  }

  async compactPriceHistory() {
    try {
      // For assets with extensive price history, keep only weekly data for older periods
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const assets = await Asset.find({
        "priceHistory.50": { $exists: true }, // Assets with more than 50 price points
      });

      for (const asset of assets) {
        const oldHistory = asset.priceHistory.filter(
          (p) => new Date(p.date) < oneYearAgo
        );
        const recentHistory = asset.priceHistory.filter(
          (p) => new Date(p.date) >= oneYearAgo
        );

        // Keep only weekly data for old history (every 7th entry)
        const compactedOldHistory = oldHistory.filter(
          (_, index) => index % 7 === 0
        );

        asset.priceHistory = [...compactedOldHistory, ...recentHistory];
        await asset.save();
      }

      logger.info(`Compacted price history for ${assets.length} assets`);
    } catch (error) {
      logger.error("Failed to compact price history:", error);
      throw error;
    }
  }

  async cleanupOldTransactions() {
    try {
      // For free tier users, keep only last 3 years of transactions
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      // Get free tier users (assuming isPremium flag exists)
      const freeUsers = await User.find({
        $or: [{ isPremium: false }, { isPremium: { $exists: false } }],
      }).select("_id");

      const freeUserIds = freeUsers.map((u) => u._id);

      // Get portfolios for free users
      const freeUserPortfolios = await Portfolio.find({
        userId: { $in: freeUserIds },
      }).select("_id");

      const portfolioIds = freeUserPortfolios.map((p) => p._id);

      // Delete old transactions for free users
      const result = await Transaction.deleteMany({
        portfolioId: { $in: portfolioIds },
        date: { $lt: threeYearsAgo },
      });

      logger.info(
        `Deleted ${result.deletedCount} old transactions for free tier users`
      );
    } catch (error) {
      logger.error("Failed to cleanup old transactions:", error);
      throw error;
    }
  }

  async optimizeDatabase() {
    try {
      // This would typically involve database-specific optimization commands
      // For MongoDB, we can suggest reindexing and compaction

      // Note: These operations should be used carefully in production
      // and may require maintenance windows

      logger.info(
        "Database optimization suggestions logged for manual execution"
      );

      // Log optimization suggestions
      const optimizationSuggestions = [
        "Consider running db.collection.reIndex() on heavily used collections",
        "Monitor index usage and remove unused indexes",
        'Consider running db.runCommand({compact: "collection_name"}) during maintenance windows',
        "Review slow query logs and optimize queries",
        "Consider implementing proper database sharding if data grows significantly",
      ];

      optimizationSuggestions.forEach((suggestion) => {
        logger.info(`DB Optimization: ${suggestion}`);
      });
    } catch (error) {
      logger.error("Failed to run database optimization:", error);
      throw error;
    }
  }

  // Method to manually trigger cleanup (useful for testing or emergency cleanup)
  async manualCleanup(options = {}) {
    if (this.isRunning) {
      throw new Error("Cleanup job is already running");
    }

    this.isRunning = true;
    logger.info("Starting manual cleanup job");

    try {
      if (options.comprehensive) {
        await this.runComprehensiveCleanup();
      } else {
        await this.runCleanupTasks();
      }

      logger.info("Manual cleanup completed successfully");
    } catch (error) {
      logger.error("Manual cleanup failed:", error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Get cleanup statistics
  async getCleanupStats() {
    try {
      const stats = {
        users: {
          total: await User.countDocuments(),
          active: await User.countDocuments({ isActive: true }),
          verified: await User.countDocuments({ emailVerified: true }),
          withExpiredTokens: await User.countDocuments({
            $or: [
              { passwordResetExpires: { $lt: new Date() } },
              { emailVerificationExpires: { $lt: new Date() } },
            ],
          }),
        },
        portfolios: {
          total: await Portfolio.countDocuments(),
          active: await Portfolio.countDocuments({
            userId: {
              $in: await User.find({ isActive: true }).distinct("_id"),
            },
          }),
        },
        assets: {
          total: await Asset.countDocuments(),
          withPriceHistory: await Asset.countDocuments({
            "priceHistory.0": { $exists: true },
          }),
        },
        transactions: {
          total: await Transaction.countDocuments(),
          lastMonth: await Transaction.countDocuments({
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          }),
        },
      };

      return stats;
    } catch (error) {
      logger.error("Failed to get cleanup stats:", error);
      throw error;
    }
  }
}

module.exports = DataCleanupJob;
