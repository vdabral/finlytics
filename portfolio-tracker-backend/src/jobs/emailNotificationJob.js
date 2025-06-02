const cron = require("node-cron");
const logger = require("../utils/logger");
const emailService = require("../services/emailService");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User");
const Asset = require("../models/Asset");

class EmailNotificationJob {
  constructor() {
    this.isRunning = false;
  }

  start() {
    // Send daily portfolio summaries at 9 AM
    cron.schedule("0 9 * * *", async () => {
      if (this.isRunning) return;

      this.isRunning = true;
      logger.info("Starting daily portfolio summary email job");

      try {
        await this.sendDailyPortfolioSummaries();
      } catch (error) {
        logger.error("Daily portfolio summary job failed:", error);
      } finally {
        this.isRunning = false;
      }
    });

    // Send weekly portfolio reports on Sundays at 10 AM
    cron.schedule("0 10 * * 0", async () => {
      if (this.isRunning) return;

      this.isRunning = true;
      logger.info("Starting weekly portfolio report email job");

      try {
        await this.sendWeeklyPortfolioReports();
      } catch (error) {
        logger.error("Weekly portfolio report job failed:", error);
      } finally {
        this.isRunning = false;
      }
    });

    // Send market alerts immediately when triggered
    this.setupMarketAlerts();

    logger.info("Email notification jobs scheduled");
  }

  async sendDailyPortfolioSummaries() {
    try {
      const users = await User.find({
        emailVerified: true,
        "notificationSettings.dailySummary": true,
      });

      for (const user of users) {
        try {
          const portfolios = await Portfolio.find({
            userId: user._id,
          }).populate("assets.assetId");

          if (portfolios.length === 0) continue;

          // Calculate daily performance for all portfolios
          const portfolioSummaries = await Promise.all(
            portfolios.map(async (portfolio) => {
              const performance = await this.calculateDailyPerformance(
                portfolio
              );
              return {
                name: portfolio.name,
                totalValue: portfolio.totalValue,
                dailyChange: performance.dailyChange,
                dailyChangePercent: performance.dailyChangePercent,
                topPerformer: performance.topPerformer,
                worstPerformer: performance.worstPerformer,
              };
            })
          );

          // Send email
          await emailService.sendDailyPortfolioSummary(user.email, {
            userName: user.name,
            portfolios: portfolioSummaries,
            totalPortfolioValue: portfolioSummaries.reduce(
              (sum, p) => sum + p.totalValue,
              0
            ),
            totalDailyChange: portfolioSummaries.reduce(
              (sum, p) => sum + p.dailyChange,
              0
            ),
          });

          logger.info(`Daily summary sent to ${user.email}`);
        } catch (error) {
          logger.error(`Failed to send daily summary to ${user.email}:`, error);
        }
      }
    } catch (error) {
      logger.error("Failed to send daily portfolio summaries:", error);
      throw error;
    }
  }

  async sendWeeklyPortfolioReports() {
    try {
      const users = await User.find({
        emailVerified: true,
        "notificationSettings.weeklyReport": true,
      });

      for (const user of users) {
        try {
          const portfolios = await Portfolio.find({
            userId: user._id,
          }).populate("assets.assetId");

          if (portfolios.length === 0) continue;

          // Calculate weekly performance for all portfolios
          const portfolioReports = await Promise.all(
            portfolios.map(async (portfolio) => {
              const performance = await this.calculateWeeklyPerformance(
                portfolio
              );
              return {
                name: portfolio.name,
                totalValue: portfolio.totalValue,
                weeklyChange: performance.weeklyChange,
                weeklyChangePercent: performance.weeklyChangePercent,
                monthlyChange: performance.monthlyChange,
                monthlyChangePercent: performance.monthlyChangePercent,
                topAssets: performance.topAssets,
                allocation: performance.allocation,
                recommendations: performance.recommendations,
              };
            })
          );

          // Send email
          await emailService.sendWeeklyPortfolioReport(user.email, {
            userName: user.name,
            portfolios: portfolioReports,
            weekStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            weekEndDate: new Date(),
          });

          logger.info(`Weekly report sent to ${user.email}`);
        } catch (error) {
          logger.error(`Failed to send weekly report to ${user.email}:`, error);
        }
      }
    } catch (error) {
      logger.error("Failed to send weekly portfolio reports:", error);
      throw error;
    }
  }

  setupMarketAlerts() {
    // This would be called by other services when market conditions trigger alerts
    this.sendMarketAlert = async (alertData) => {
      try {
        const users = await User.find({
          emailVerified: true,
          "notificationSettings.marketAlerts": true,
        });

        for (const user of users) {
          try {
            await emailService.sendMarketAlert(user.email, {
              userName: user.name,
              alert: alertData,
            });
          } catch (error) {
            logger.error(
              `Failed to send market alert to ${user.email}:`,
              error
            );
          }
        }
      } catch (error) {
        logger.error("Failed to send market alerts:", error);
      }
    };
  }

  async calculateDailyPerformance(portfolio) {
    // Get price changes for all assets in portfolio
    const assetPerformances = await Promise.all(
      portfolio.assets.map(async (holding) => {
        const asset = holding.assetId;
        const currentPrice = asset.currentPrice || 0;
        const previousPrice = asset.previousClose || currentPrice;

        const priceChange = currentPrice - previousPrice;
        const priceChangePercent =
          previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
        const holdingValue = holding.quantity * currentPrice;
        const holdingChange = holding.quantity * priceChange;

        return {
          symbol: asset.symbol,
          name: asset.name,
          quantity: holding.quantity,
          currentPrice,
          priceChange,
          priceChangePercent,
          holdingValue,
          holdingChange,
        };
      })
    );

    const totalDailyChange = assetPerformances.reduce(
      (sum, asset) => sum + asset.holdingChange,
      0
    );
    const totalValue = assetPerformances.reduce(
      (sum, asset) => sum + asset.holdingValue,
      0
    );
    const dailyChangePercent =
      totalValue > 0
        ? (totalDailyChange / (totalValue - totalDailyChange)) * 100
        : 0;

    // Find top and worst performers
    const sortedByPercent = [...assetPerformances].sort(
      (a, b) => b.priceChangePercent - a.priceChangePercent
    );
    const topPerformer = sortedByPercent[0];
    const worstPerformer = sortedByPercent[sortedByPercent.length - 1];

    return {
      dailyChange: totalDailyChange,
      dailyChangePercent,
      topPerformer,
      worstPerformer,
      assets: assetPerformances,
    };
  }

  async calculateWeeklyPerformance(portfolio) {
    // Similar to daily but with weekly calculations
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const assetPerformances = await Promise.all(
      portfolio.assets.map(async (holding) => {
        const asset = holding.assetId;

        // Get historical prices (this would need to be implemented based on your price history storage)
        const currentPrice = asset.currentPrice || 0;
        const weekAgoPrice =
          this.getHistoricalPrice(asset, weekAgo) || currentPrice;
        const monthAgoPrice =
          this.getHistoricalPrice(asset, monthAgo) || currentPrice;

        const weeklyChange = (currentPrice - weekAgoPrice) * holding.quantity;
        const monthlyChange = (currentPrice - monthAgoPrice) * holding.quantity;
        const weeklyChangePercent =
          weekAgoPrice > 0
            ? ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100
            : 0;
        const monthlyChangePercent =
          monthAgoPrice > 0
            ? ((currentPrice - monthAgoPrice) / monthAgoPrice) * 100
            : 0;

        return {
          symbol: asset.symbol,
          name: asset.name,
          quantity: holding.quantity,
          currentPrice,
          weeklyChange,
          monthlyChange,
          weeklyChangePercent,
          monthlyChangePercent,
          holdingValue: holding.quantity * currentPrice,
        };
      })
    );

    const totalWeeklyChange = assetPerformances.reduce(
      (sum, asset) => sum + asset.weeklyChange,
      0
    );
    const totalMonthlyChange = assetPerformances.reduce(
      (sum, asset) => sum + asset.monthlyChange,
      0
    );
    const totalValue = assetPerformances.reduce(
      (sum, asset) => sum + asset.holdingValue,
      0
    );

    // Calculate allocation percentages
    const allocation = assetPerformances.map((asset) => ({
      symbol: asset.symbol,
      name: asset.name,
      percentage: totalValue > 0 ? (asset.holdingValue / totalValue) * 100 : 0,
      value: asset.holdingValue,
    }));

    // Top performing assets
    const topAssets = [...assetPerformances]
      .sort((a, b) => b.weeklyChangePercent - a.weeklyChangePercent)
      .slice(0, 3);

    // Generate basic recommendations
    const recommendations = this.generateRecommendations(
      assetPerformances,
      allocation
    );

    return {
      weeklyChange: totalWeeklyChange,
      weeklyChangePercent:
        totalValue > 0
          ? (totalWeeklyChange / (totalValue - totalWeeklyChange)) * 100
          : 0,
      monthlyChange: totalMonthlyChange,
      monthlyChangePercent:
        totalValue > 0
          ? (totalMonthlyChange / (totalValue - totalMonthlyChange)) * 100
          : 0,
      topAssets,
      allocation,
      recommendations,
    };
  }

  getHistoricalPrice(asset, date) {
    // This is a placeholder - you would implement actual historical price lookup
    // from your price history storage in the Asset model
    if (asset.priceHistory && asset.priceHistory.length > 0) {
      const historicalPrice = asset.priceHistory.find(
        (price) => Math.abs(new Date(price.date) - date) < 24 * 60 * 60 * 1000 // Within 24 hours
      );
      return historicalPrice ? historicalPrice.price : asset.currentPrice;
    }
    return asset.currentPrice;
  }

  generateRecommendations(assetPerformances, allocation) {
    const recommendations = [];

    // Check for concentration risk
    const highConcentration = allocation.filter(
      (asset) => asset.percentage > 25
    );
    if (highConcentration.length > 0) {
      recommendations.push({
        type: "diversification",
        message: `Consider reducing concentration in ${highConcentration
          .map((a) => a.symbol)
          .join(", ")} (${highConcentration
          .map((a) => a.percentage.toFixed(1))
          .join("%, ")}% of portfolio)`,
      });
    }

    // Check for underperforming assets
    const underperformers = assetPerformances.filter(
      (asset) => asset.weeklyChangePercent < -10
    );
    if (underperformers.length > 0) {
      recommendations.push({
        type: "review",
        message: `Review positions in ${underperformers
          .map((a) => a.symbol)
          .join(", ")} - down ${underperformers
          .map((a) => Math.abs(a.weeklyChangePercent).toFixed(1))
          .join("%, ")}% this week`,
      });
    }

    // Check for strong performers
    const strongPerformers = assetPerformances.filter(
      (asset) => asset.weeklyChangePercent > 15
    );
    if (strongPerformers.length > 0) {
      recommendations.push({
        type: "rebalance",
        message: `Consider taking profits on ${strongPerformers
          .map((a) => a.symbol)
          .join(", ")} - up ${strongPerformers
          .map((a) => a.weeklyChangePercent.toFixed(1))
          .join("%, ")}% this week`,
      });
    }

    return recommendations;
  }
}

module.exports = EmailNotificationJob;
