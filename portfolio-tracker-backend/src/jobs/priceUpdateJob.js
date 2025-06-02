const cron = require("node-cron");
const marketDataService = require("../services/marketDataService");
const assetService = require("../services/assetService");
const portfolioService = require("../services/portfolioService");
const emailService = require("../services/emailService");
const User = require("../models/User");
const logger = require("../utils/logger");

class PriceUpdateJob {
  constructor() {
    this.isRunning = false;
    this.lastRunTime = null;
    this.successCount = 0;
    this.errorCount = 0;
  }

  /**
   * Initialize price update job
   */
  init() {
    // Schedule price updates every 5 minutes during market hours
    // This respects Alpha Vantage's free tier limit of 5 calls per minute
    cron.schedule("*/5 * * * *", async () => {
      await this.updatePrices();
    });

    // Schedule comprehensive updates every hour
    cron.schedule("0 * * * *", async () => {
      await this.comprehensiveUpdate();
    });

    logger.info("Price update job scheduled");
  }

  /**
   * Update prices for active assets
   */
  async updatePrices() {
    if (this.isRunning) {
      logger.warn("Price update job already running, skipping");
      return;
    }

    this.isRunning = true;
    this.lastRunTime = new Date();

    try {
      logger.info("Starting price update job");

      // Get market status first
      const marketStatus = await marketDataService.getMarketStatus();

      if (!marketStatus.isOpen) {
        logger.info("Market is closed, skipping price updates");
        this.isRunning = false;
        return;
      }

      // Get most actively traded assets (limit to 5 for free tier)
      const activeAssets = await assetService.getAssets({
        limit: 5,
        sortBy: "volume24h",
        sortOrder: "desc",
      });

      if (activeAssets.assets.length === 0) {
        logger.info("No assets found for price update");
        this.isRunning = false;
        return;
      }

      const symbols = activeAssets.assets.map((asset) => asset.symbol);
      logger.info(
        `Updating prices for ${symbols.length} symbols: ${symbols.join(", ")}`
      );

      const result = await marketDataService.updateAssetPrices(symbols);

      this.successCount += result.successful;
      this.errorCount += result.failed;

      logger.info("Price update job completed", {
        successful: result.successful,
        failed: result.failed,
        totalSuccessful: this.successCount,
        totalErrors: this.errorCount,
      });
    } catch (error) {
      this.errorCount++;
      logger.error("Price update job failed:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Comprehensive update including portfolio performance recalculation
   */
  async comprehensiveUpdate() {
    try {
      logger.info("Starting comprehensive update job");

      // Update additional assets (rotate through different assets)
      const allAssets = await assetService.getAssets({ limit: 20 });
      const randomAssets = this.getRandomAssets(allAssets.assets, 3);

      if (randomAssets.length > 0) {
        const symbols = randomAssets.map((asset) => asset.symbol);
        await marketDataService.updateAssetPrices(symbols);
        logger.info(
          `Updated prices for additional assets: ${symbols.join(", ")}`
        );
      }

      // Recalculate portfolio performances for active users
      await this.updatePortfolioPerformances();

      logger.info("Comprehensive update completed");
    } catch (error) {
      logger.error("Comprehensive update failed:", error);
    }
  }

  /**
   * Update portfolio performances for users with recent activity
   */
  async updatePortfolioPerformances() {
    try {
      // Get users who have logged in within the last 7 days
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeUsers = await User.find({
        lastLogin: { $gte: oneWeekAgo },
      }).limit(50); // Limit to prevent overwhelming the system

      for (const user of activeUsers) {
        try {
          const portfolios = await portfolioService.getUserPortfolios(user._id);

          for (const portfolio of portfolios) {
            await portfolioService.calculatePortfolioPerformance(
              portfolio._id,
              user._id
            );
          }

          logger.debug(`Updated portfolio performances for user ${user._id}`);
        } catch (error) {
          logger.error(
            `Failed to update portfolios for user ${user._id}:`,
            error
          );
        }
      }

      logger.info(
        `Updated portfolio performances for ${activeUsers.length} active users`
      );
    } catch (error) {
      logger.error("Failed to update portfolio performances:", error);
    }
  }

  /**
   * Get random assets from the list
   */
  getRandomAssets(assets, count) {
    const shuffled = [...assets].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      successCount: this.successCount,
      errorCount: this.errorCount,
      successRate:
        this.successCount + this.errorCount > 0
          ? (this.successCount / (this.successCount + this.errorCount)) * 100
          : 0,
    };
  }

  /**
   * Manual trigger for price updates (for admin use)
   */
  async triggerManualUpdate(symbols = null) {
    try {
      logger.info("Manual price update triggered");

      if (!symbols) {
        // Update top 5 trending assets
        const trending = await assetService.getTrendingAssets(5);
        symbols = trending.map((asset) => asset.symbol);
      }

      if (symbols.length === 0) {
        throw new Error("No symbols to update");
      }

      const result = await marketDataService.updateAssetPrices(symbols);

      logger.info("Manual price update completed", result);
      return result;
    } catch (error) {
      logger.error("Manual price update failed:", error);
      throw error;
    }
  }
}

module.exports = new PriceUpdateJob();
