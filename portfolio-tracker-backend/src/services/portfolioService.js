const Portfolio = require("../models/Portfolio");
const Asset = require("../models/Asset");
const Transaction = require("../models/Transaction");
const { calculateMetrics } = require("../utils/helpers");
const { cache } = require("../utils/cache");
const logger = require("../utils/logger");

class PortfolioService {
  /**
   * Create a new portfolio for a user
   */
  async createPortfolio(userId, portfolioData) {
    try {
      const portfolio = new Portfolio({
        userId,
        ...portfolioData,
      });

      await portfolio.save();
      logger.info(`Portfolio created for user ${userId}`, {
        portfolioId: portfolio._id,
      });

      // Clear user's portfolio cache
      await cache.del(`user_portfolios_${userId}`);

      return portfolio;
    } catch (error) {
      logger.error("Error creating portfolio:", error);
      throw error;
    }
  }
  /**
   * Get all portfolios for a user
   */
  async getUserPortfolios(userId) {
    try {
      const cacheKey = `user_portfolios_${userId}`;
      let portfolios = await cache.get(cacheKey);

      if (!portfolios) {
        portfolios = await Portfolio.find({ userId })
          .sort({ createdAt: -1 })
          .lean();

        // Cache for 5 minutes
        await cache.set(cacheKey, portfolios, 300);
      }

      return portfolios;
    } catch (error) {
      logger.error("Error fetching user portfolios:", error);
      throw error;
    }
  }
  /**
   * Get portfolio by ID with permission check
   */
  async getPortfolioById(portfolioId, userId) {
    try {
      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        userId,
      }).populate("assets");

      if (!portfolio) {
        throw new Error("Portfolio not found");
      }

      return portfolio;
    } catch (error) {
      logger.error("Error fetching portfolio:", error);
      throw error;
    }
  }

  /**
   * Update portfolio
   */
  async updatePortfolio(portfolioId, userId, updateData) {
    try {
      const portfolio = await Portfolio.findOneAndUpdate(
        { _id: portfolioId, userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!portfolio) {
        throw new Error("Portfolio not found");
      }

      // Clear cache
      await cache.del(`user_portfolios_${userId}`);

      logger.info(`Portfolio updated`, { portfolioId, userId });
      return portfolio;
    } catch (error) {
      logger.error("Error updating portfolio:", error);
      throw error;
    }
  }

  /**
   * Delete portfolio
   */
  async deletePortfolio(portfolioId, userId) {
    try {
      const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });

      if (!portfolio) {
        throw new Error("Portfolio not found");
      }

      // Delete all related transactions
      await Transaction.deleteMany({ portfolioId });

      // Delete the portfolio
      await Portfolio.findByIdAndDelete(portfolioId);

      // Clear cache
      await cache.del(`user_portfolios_${userId}`);

      logger.info(`Portfolio deleted`, { portfolioId, userId });
      return { message: "Portfolio deleted successfully" };
    } catch (error) {
      logger.error("Error deleting portfolio:", error);
      throw error;
    }
  }
  /**
   * Add asset to portfolio
   */ async addAssetToPortfolio(portfolioId, userId, assetData) {
    try {
      const { assetId, quantity, purchasePrice, fees } = assetData;

      // Check if portfolioId is a valid ObjectId
      const mongoose = require("mongoose");
      if (!mongoose.Types.ObjectId.isValid(portfolioId)) {
        throw new Error("Portfolio not found");
      }

      const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
      if (!portfolio) {
        throw new Error("Portfolio not found");
      }

      // Get asset details
      const Asset = require("../models/Asset");
      const asset = await Asset.findById(assetId);
      if (!asset) {
        throw new Error("Asset not found");
      }

      // Check if asset already exists in portfolio
      const existingAsset = portfolio.assets.find(
        (id) => id.toString() === assetId
      );

      if (!existingAsset) {
        // Add new asset reference
        portfolio.assets.push(assetId);
      } // Create a buy transaction
      const Transaction = require("../models/Transaction");
      const transaction = new Transaction({
        type: "buy",
        assetId,
        portfolioId,
        userId,
        symbol: asset.symbol,
        quantity: parseFloat(quantity),
        price: parseFloat(purchasePrice),
        fees: fees ? parseFloat(fees) : 0,
        totalAmount: parseFloat(quantity) * parseFloat(purchasePrice),
        currency: portfolio.currency || "USD",
      });

      await transaction.save();
      await portfolio.save();

      // Return populated portfolio with computed holdings
      const updatedPortfolio = await this.getPortfolioWithHoldings(
        portfolioId,
        userId
      );

      // Clear cache
      await cache.del(`user_portfolios_${userId}`);

      logger.info("Asset added to portfolio", {
        portfolioId,
        assetId,
        quantity,
        userId,
      });

      return updatedPortfolio;
    } catch (error) {
      logger.error("Error adding asset to portfolio:", error);
      throw error;
    }
  }

  /**
   * Remove asset from portfolio
   */
  async removeAssetFromPortfolio(portfolioId, userId, assetId, quantity) {
    try {
      const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
      if (!portfolio) {
        throw new Error("Portfolio not found");
      }

      const holdingIndex = portfolio.holdings.findIndex(
        (holding) => holding.assetId.toString() === assetId
      );

      if (holdingIndex === -1) {
        throw new Error("Asset not found in portfolio");
      }

      const holding = portfolio.holdings[holdingIndex];

      if (holding.quantity < quantity) {
        throw new Error("Insufficient quantity to remove");
      }

      if (holding.quantity === quantity) {
        // Remove the entire holding
        portfolio.holdings.splice(holdingIndex, 1);
      } else {
        // Reduce the quantity
        holding.quantity -= quantity;
      }

      await portfolio.save();

      // Clear cache
      await cache.del(`user_portfolios_${userId}`);

      logger.info(`Asset removed from portfolio`, {
        portfolioId,
        assetId,
        quantity,
      });
      return portfolio;
    } catch (error) {
      logger.error("Error removing asset from portfolio:", error);
      throw error;
    }
  }
  /**
   * Calculate portfolio performance
   */
  async calculatePortfolioPerformance(portfolioId, userId) {
    try {
      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        userId,
      }).populate("assets");
      if (!portfolio) {
        throw new Error("Portfolio not found");
      }

      let totalValue = 0;
      let totalCost = 0;
      const assetsWithMetrics = [];

      for (const asset of portfolio.assets) {
        const currentPrice = asset.currentPrice || 0;
        // For simplicity, assume 1 share of each asset
        const quantity = 1;
        const averagePrice = currentPrice; // Simplified

        const assetValue = quantity * currentPrice;
        const assetCost = quantity * averagePrice;

        totalValue += assetValue;
        totalCost += assetCost;

        assetsWithMetrics.push({
          ...asset.toObject(),
          quantity,
          currentPrice,
          currentValue: assetValue,
          costBasis: assetCost,
          unrealizedGainLoss: assetValue - assetCost,
          unrealizedGainLossPercent:
            assetCost > 0 ? ((assetValue - assetCost) / assetCost) * 100 : 0,
        });
      }
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent =
        totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

      const performance = {
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent,
        assets: assetsWithMetrics,
      };

      // Update portfolio performance
      portfolio.performance = {
        totalValue,
        totalReturn: totalGainLoss,
        totalReturnPercent: totalGainLossPercent,
        lastUpdated: new Date(),
      };

      await portfolio.save();

      logger.info(`Portfolio performance calculated`, {
        portfolioId,
        totalValue,
        totalGainLoss,
      });
      return performance;
    } catch (error) {
      logger.error("Error calculating portfolio performance:", error);
      throw error;
    }
  }

  /**
   * Get portfolio transactions
   */
  async getPortfolioTransactions(portfolioId, userId, options = {}) {
    try {
      const { page = 1, limit = 20, type, assetId } = options;

      const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
      if (!portfolio) {
        throw new Error("Portfolio not found");
      }

      const query = { portfolioId };

      if (type) query.type = type;
      if (assetId) query.assetId = assetId;
      const transactions = await Transaction.find(query)
        .populate("assetId", "symbol name")
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Transaction.countDocuments(query);

      return {
        transactions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      };
    } catch (error) {
      logger.error("Error fetching portfolio transactions:", error);
      throw error;
    }
  }

  /**
   * Get portfolio analytics
   */
  async getPortfolioAnalytics(portfolioId, userId, period = "1M") {
    try {
      const cacheKey = `portfolio_analytics_${portfolioId}_${period}`;
      let analytics = await cache.get(cacheKey);

      if (!analytics) {
        const portfolio = await Portfolio.findOne({
          _id: portfolioId,
          userId,
        }).populate("assets");

        if (!portfolio) {
          throw new Error("Portfolio not found");
        }

        // Calculate various metrics
        const { diversification, allocation, risk } =
          calculateMetrics(portfolio);

        analytics = {
          diversification,
          allocation,
          risk,
          period,
          calculatedAt: new Date(),
        };

        // Cache for 1 hour
        await cache.set(cacheKey, analytics, 3600);
      }

      return analytics;
    } catch (error) {
      logger.error("Error calculating portfolio analytics:", error);
      throw error;
    }
  }

  /**
   * Get portfolio with computed holdings from transactions
   */
  async getPortfolioWithHoldings(portfolioId, userId) {
    try {
      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        userId,
      }).populate("assets");
      if (!portfolio) {
        throw new Error("Portfolio not found");
      }

      // Get all transactions for this portfolio
      const Transaction = require("../models/Transaction");
      const transactions = await Transaction.find({ portfolioId }).populate(
        "assetId"
      );

      // Calculate holdings from transactions
      const holdingsMap = new Map();

      transactions.forEach((transaction) => {
        const assetId = transaction.assetId._id.toString();
        const existing = holdingsMap.get(assetId);

        if (transaction.type === "buy") {
          if (existing) {
            existing.quantity += transaction.quantity;
            existing.totalCost += transaction.totalAmount;
            existing.averagePrice = existing.totalCost / existing.quantity;
          } else {
            holdingsMap.set(assetId, {
              assetId: transaction.assetId,
              symbol: transaction.symbol,
              quantity: transaction.quantity,
              totalCost: transaction.totalAmount,
              averagePrice: transaction.price,
            });
          }
        } else if (transaction.type === "sell" && existing) {
          existing.quantity -= transaction.quantity;
          existing.totalCost -= existing.averagePrice * transaction.quantity;
          if (existing.quantity <= 0) {
            holdingsMap.delete(assetId);
          }
        }
      });

      // Convert holdings map to array
      const holdings = Array.from(holdingsMap.values());

      // Return portfolio with holdings
      const portfolioObj = portfolio.toObject();
      portfolioObj.assets = holdings;

      return portfolioObj;
    } catch (error) {
      logger.error("Error getting portfolio with holdings:", error);
      throw error;
    }
  }
}

module.exports = new PortfolioService();
