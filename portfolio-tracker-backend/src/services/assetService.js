const Asset = require("../models/Asset");
const { cache } = require("../utils/cache");
const logger = require("../utils/logger");
const { formatCurrency } = require("../utils/helpers");
const marketDataService = require("./marketDataService");

class AssetService {
  /**
   * Create a new asset
   */
  async createAsset(assetData) {
    try {
      const existingAsset = await Asset.findOne({ symbol: assetData.symbol });

      if (existingAsset) {
        throw new Error("Asset with this symbol already exists");
      }

      const asset = new Asset(assetData);
      await asset.save();

      logger.info(`Asset created`, { symbol: asset.symbol, name: asset.name });

      // Clear assets cache
      await cache.del("all_assets");
      return asset;
    } catch (error) {
      logger.error("Error creating asset:", error);
      throw error;
    }
  }

  /**
   * Find or create an asset by symbol
   */
  async findOrCreateAsset(assetData) {
    try {
      // First try to find existing asset
      const existingAsset = await Asset.findOne({ symbol: assetData.symbol });

      if (existingAsset) {
        logger.info(`Asset found`, {
          symbol: existingAsset.symbol,
          id: existingAsset._id,
        });
        return existingAsset;
      }

      // Create new asset if not found
      const asset = new Asset(assetData);
      await asset.save();

      logger.info(`Asset created`, {
        symbol: asset.symbol,
        name: asset.name,
        id: asset._id,
      });

      // Clear assets cache
      await cache.del("all_assets");

      return asset;
    } catch (error) {
      logger.error("Error finding or creating asset:", error);
      throw error;
    }
  }

  /**
   * Get all assets with optional filtering and pagination
   */
  async getAssets(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        type,
        exchange,
        sortBy = "symbol",
        sortOrder = "asc",
      } = options;

      const query = {};

      if (search) {
        query.$or = [
          { symbol: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
        ];
      }

      if (type) query.type = type;
      if (exchange) query.exchange = exchange;

      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      const assets = await Asset.find(query)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select("-priceHistory -__v");

      const total = await Asset.countDocuments(query);

      return {
        assets,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error("Error fetching assets:", error);
      throw error;
    }
  }
  /**
   * Get asset by ID or symbol
   */
  async getAsset(identifier) {
    try {
      const cacheKey = `asset_${identifier}`;
      let asset = await cache.get(cacheKey);

      if (!asset) {
        // Check if identifier is a valid ObjectId format
        const mongoose = require("mongoose");
        if (
          mongoose.Types.ObjectId.isValid(identifier) &&
          identifier.length === 24
        ) {
          // Try to find by ID first
          asset = await Asset.findById(identifier);
        }

        // If not found by ID or identifier is not ObjectId, try by symbol
        if (!asset) {
          asset = await Asset.findOne({ symbol: identifier.toUpperCase() });
        }

        // If still not found, try Indian Stock API
        if (!asset) {
          try {
            const marketDataService = require("./marketDataService");
            asset = await marketDataService.getStockQuote(identifier);
          } catch (err) {
            // If Indian API also fails, throw not found
            throw new Error("Asset not found");
          }
        }

        // Cache for 10 minutes
        await cache.set(cacheKey, asset, 600);
      }

      return asset;
    } catch (error) {
      logger.error("Error fetching asset:", error);
      throw error;
    }
  }
  /**
   * Get asset by symbol specifically
   */
  async getAssetBySymbol(symbol) {
    try {
      const upperSymbol = symbol.toUpperCase();
      const cacheKey = `asset_symbol_${upperSymbol}`;
      let asset = await cache.get(cacheKey);

      if (!asset) {
        // Try to get from database first, but don't let it block for too long
        try {
          asset = await Promise.race([
            Asset.findOne({ symbol: upperSymbol }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Database timeout")), 2000)
            ),
          ]);
        } catch (dbError) {
          logger.warn(
            `Database lookup failed for ${upperSymbol}, falling back to market data:`,
            dbError.message
          );
          asset = null;
        }

        // If not found in DB or DB unavailable, try market data service
        if (!asset) {
          try {
            const marketDataService = require("./marketDataService");
            asset = await marketDataService.getStockQuote(upperSymbol);
            logger.info(
              `Asset data retrieved from market service for ${upperSymbol}`
            );
          } catch (err) {
            logger.error(
              `Market data service also failed for ${upperSymbol}:`,
              err.message
            );
            throw new Error("Asset not found");
          }
        }

        // Cache for 10 minutes if we have data
        if (asset) {
          await cache.set(cacheKey, asset, 600);
        }
      }

      return asset;
    } catch (error) {
      logger.error("Error fetching asset:", error);
      throw error;
    }
  }

  /**
   * Update asset information
   */
  async updateAsset(assetId, updateData) {
    try {
      const asset = await Asset.findByIdAndUpdate(
        assetId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!asset) {
        throw new Error("Asset not found");
      }

      // Clear cache
      await cache.del(`asset_${assetId}`);
      await cache.del(`asset_${asset.symbol}`);
      await cache.del("all_assets");

      logger.info(`Asset updated`, { assetId, symbol: asset.symbol });
      return asset;
    } catch (error) {
      logger.error("Error updating asset:", error);
      throw error;
    }
  }

  /**
   * Update asset price
   */
  async updateAssetPrice(symbol, priceData) {
    try {
      const { price, volume, marketCap } = priceData;

      const asset = await Asset.findOne({ symbol: symbol.toUpperCase() });

      if (!asset) {
        throw new Error("Asset not found");
      }

      const previousPrice = asset.currentPrice;
      const priceChange = price - previousPrice;
      const priceChangePercent =
        previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

      // Update current price and metrics
      asset.currentPrice = price;
      asset.volume24h = volume;
      asset.marketCap = marketCap;
      asset.priceChange24h = priceChange;
      asset.priceChangePercent24h = priceChangePercent;
      asset.lastUpdated = new Date();

      // Add to price history (keep last 1000 entries)
      asset.priceHistory.push({
        price,
        volume,
        timestamp: new Date(),
      });

      if (asset.priceHistory.length > 1000) {
        asset.priceHistory = asset.priceHistory.slice(-1000);
      }

      await asset.save();

      // Clear cache
      await cache.del(`asset_${asset._id}`);
      await cache.del(`asset_${symbol}`);

      logger.info(`Asset price updated`, {
        symbol,
        price: formatCurrency(price),
        change: `${priceChangePercent.toFixed(2)}%`,
      });

      return asset;
    } catch (error) {
      logger.error("Error updating asset price:", error);
      throw error;
    }
  }

  /**
   * Batch update multiple asset prices
   */
  async batchUpdatePrices(priceUpdates) {
    try {
      const updatePromises = priceUpdates.map(({ symbol, ...priceData }) =>
        this.updateAssetPrice(symbol, priceData)
      );

      const results = await Promise.allSettled(updatePromises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      logger.info(`Batch price update completed`, {
        successful,
        failed,
        total: priceUpdates.length,
      });

      return { successful, failed, total: priceUpdates.length };
    } catch (error) {
      logger.error("Error in batch price update:", error);
      throw error;
    }
  }

  /**
   * Get asset price history
   */
  async getAssetPriceHistory(symbol, period = "7d") {
    try {
      const cacheKey = `price_history_${symbol}_${period}`;
      let priceHistory = await cache.get(cacheKey);

      if (!priceHistory) {
        const asset = await Asset.findOne({ symbol: symbol.toUpperCase() });

        if (!asset) {
          throw new Error("Asset not found");
        }

        // Calculate date range based on period
        const now = new Date();
        let startDate;

        switch (period) {
          case "1d":
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "7d":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "90d":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case "1y":
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        priceHistory = asset.priceHistory.filter(
          (entry) => entry.timestamp >= startDate
        );

        // Cache for different durations based on period
        const cacheDuration =
          period === "1d" ? 300 : period === "7d" ? 900 : 1800;
        await cache.set(cacheKey, priceHistory, cacheDuration);
      }

      return priceHistory;
    } catch (error) {
      logger.error("Error fetching price history:", error);
      throw error;
    }
  }

  /**
   * Search assets by symbol or name
   */
  async searchAssets(query, limit = 10) {
    try {
      const cacheKey = `asset_search_${query}_${limit}`;
      let results = await cache.get(cacheKey);

      if (!results) {
        results = await Asset.find({
          $or: [
            { symbol: { $regex: query, $options: "i" } },
            { name: { $regex: query, $options: "i" } },
          ],
        })
          .select(
            "symbol name type exchange currentPrice priceChangePercent24h"
          )
          .limit(limit)
          .sort({ symbol: 1 });

        // Cache for 5 minutes
        await cache.set(cacheKey, results, 300);
      }

      return results;
    } catch (error) {
      logger.error("Error searching assets:", error);
      throw error;
    }
  }

  /**
   * Get trending assets
   */ async getTrendingAssets(limit = 10) {
    try {
      const cacheKey = `trending_assets_${limit}`;
      let trending = await cache.get(cacheKey);

      if (!trending) {
        trending = await Asset.find({
          currentPrice: { $gt: 0 },
          isActive: true,
        })
          .select("symbol name type currentPrice gainLossPercentage metadata")
          .sort({ currentPrice: -1, gainLossPercentage: -1 })
          .limit(limit);

        // Transform the data to match frontend expectations
        trending = trending.map((asset) => ({
          _id: asset._id,
          id: asset._id.toString(),
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          currentPrice: asset.currentPrice,
          change: asset.gainLoss || 0,
          changePercent: asset.gainLossPercentage || 0,
          priceChange24h: asset.gainLoss || 0,
          marketCap: asset.metadata?.marketCap || 0,
          volume: asset.metadata?.volume || 0,
          exchange: asset.exchange || "",
          sector: asset.sector || "",
          industry: asset.industry || "",
          description: asset.metadata?.description || "",
          previousClose: asset.currentPrice * 0.99, // Fallback calculation
          pe: asset.metadata?.peRatio || 0,
          eps: 0, // Not available in current model
          dividendYield: asset.metadata?.dividendYield || 0,
          beta: asset.metadata?.beta || 0,
          fiftyTwoWeekHigh: asset.currentPrice * 1.2, // Fallback calculation
          fiftyTwoWeekLow: asset.currentPrice * 0.8, // Fallback calculation
          lastUpdated: asset.metadata?.lastPriceUpdate || asset.updatedAt,
        }));

        // Cache for 15 minutes
        await cache.set(cacheKey, trending, 900);
      }

      return trending;
    } catch (error) {
      logger.error("Error fetching trending assets:", error);
      throw error;
    }
  }
  /**
   * Get top gainers
   */
  async getTopGainers(limit = 10) {
    try {
      const cacheKey = `top_gainers_${limit}`;
      let gainers = await cache.get(cacheKey);

      if (!gainers) {
        gainers = await Asset.find({
          gainLossPercentage: { $gt: 0 },
          currentPrice: { $gt: 0 },
          isActive: true,
        })
          .select("symbol name type currentPrice gainLossPercentage metadata")
          .sort({ gainLossPercentage: -1 })
          .limit(limit);

        // Transform the data to match frontend expectations
        gainers = gainers.map((asset) => ({
          _id: asset._id,
          id: asset._id.toString(),
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          currentPrice: asset.currentPrice,
          change: asset.gainLoss || 0,
          changePercent: asset.gainLossPercentage || 0,
          priceChange24h: asset.gainLoss || 0,
          marketCap: asset.metadata?.marketCap || 0,
          volume: asset.metadata?.volume || 0,
          exchange: asset.exchange || "",
          sector: asset.sector || "",
          industry: asset.industry || "",
          description: asset.metadata?.description || "",
          previousClose: asset.currentPrice * 0.99,
          pe: asset.metadata?.peRatio || 0,
          eps: 0,
          dividendYield: asset.metadata?.dividendYield || 0,
          beta: asset.metadata?.beta || 0,
          fiftyTwoWeekHigh: asset.currentPrice * 1.2,
          fiftyTwoWeekLow: asset.currentPrice * 0.8,
          lastUpdated: asset.metadata?.lastPriceUpdate || asset.updatedAt,
        }));

        // Cache for 15 minutes
        await cache.set(cacheKey, gainers, 900);
      }

      return gainers;
    } catch (error) {
      logger.error("Error fetching top gainers:", error);
      throw error;
    }
  }

  /**
   * Get top losers
   */ async getTopLosers(limit = 10) {
    try {
      const cacheKey = `top_losers_${limit}`;
      let losers = await cache.get(cacheKey);

      if (!losers) {
        losers = await Asset.find({
          gainLossPercentage: { $lt: 0 },
          currentPrice: { $gt: 0 },
          isActive: true,
        })
          .select("symbol name type currentPrice gainLossPercentage metadata")
          .sort({ gainLossPercentage: 1 })
          .limit(limit);

        // Transform the data to match frontend expectations
        losers = losers.map((asset) => ({
          _id: asset._id,
          id: asset._id.toString(),
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          currentPrice: asset.currentPrice,
          change: asset.gainLoss || 0,
          changePercent: asset.gainLossPercentage || 0,
          priceChange24h: asset.gainLoss || 0,
          marketCap: asset.metadata?.marketCap || 0,
          volume: asset.metadata?.volume || 0,
          exchange: asset.exchange || "",
          sector: asset.sector || "",
          industry: asset.industry || "",
          description: asset.metadata?.description || "",
          previousClose: asset.currentPrice * 1.01,
          pe: asset.metadata?.peRatio || 0,
          eps: 0,
          dividendYield: asset.metadata?.dividendYield || 0,
          beta: asset.metadata?.beta || 0,
          fiftyTwoWeekHigh: asset.currentPrice * 1.2,
          fiftyTwoWeekLow: asset.currentPrice * 0.8,
          lastUpdated: asset.metadata?.lastPriceUpdate || asset.updatedAt,
        }));

        // Cache for 10 minutes
        await cache.set(cacheKey, losers, 600);
      }

      return losers;
    } catch (error) {
      logger.error("Error fetching top losers:", error);
      throw error;
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId) {
    try {
      const asset = await Asset.findByIdAndDelete(assetId);

      if (!asset) {
        throw new Error("Asset not found");
      }

      // Clear cache
      await cache.del(`asset_${assetId}`);
      await cache.del(`asset_${asset.symbol}`);
      await cache.del("all_assets");

      logger.info(`Asset deleted`, { assetId, symbol: asset.symbol });
      return { message: "Asset deleted successfully" };
    } catch (error) {
      logger.error("Error deleting asset:", error);
      throw error;
    }
  }
}

module.exports = new AssetService();
