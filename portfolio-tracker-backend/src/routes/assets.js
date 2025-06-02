const express = require("express");
const { body, query, param } = require("express-validator");
const assetService = require("../services/assetService");
const marketDataService = require("../services/marketDataService");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  marketDataLimiter,
  generalLimiter,
} = require("../middleware/rateLimiting");
const logger = require("../utils/logger");

const router = express.Router();

// Validation rules
const createAssetValidation = [
  body("symbol")
    .trim()
    .toUpperCase()
    .isLength({ min: 1, max: 10 })
    .withMessage("Symbol must be between 1 and 10 characters"),
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("type")
    .isIn(["stock", "etf", "crypto", "bond", "commodity", "forex"])
    .withMessage("Invalid asset type"),
  body("exchange")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Exchange name must be less than 50 characters"),
  body("currency")
    .optional()
    .isIn([
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CAD",
      "AUD",
      "CHF",
      "CNY",
      "INR",
      "BTC",
      "ETH",
    ])
    .withMessage("Invalid currency"),
  body("currentPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Current price must be a positive number"),
];

const updateAssetValidation = [
  param("id").isMongoId().withMessage("Invalid asset ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("exchange")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Exchange name must be less than 50 characters"),
  body("currency")
    .optional()
    .isIn([
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CAD",
      "AUD",
      "CHF",
      "CNY",
      "INR",
      "BTC",
      "ETH",
    ])
    .withMessage("Invalid currency"),
];

const getAssetsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Search query must be between 1 and 50 characters"),
  query("type")
    .optional()
    .isIn(["stock", "etf", "crypto", "bond", "commodity", "forex"])
    .withMessage("Invalid asset type"),
  query("exchange")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Exchange name must be less than 50 characters"),
  query("sortBy")
    .optional()
    .isIn([
      "symbol",
      "name",
      "currentPrice",
      "priceChangePercent24h",
      "volume24h",
      "marketCap",
    ])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
];

const getPriceHistoryValidation = [
  param("symbol")
    .trim()
    .toUpperCase()
    .isLength({ min: 1, max: 10 })
    .withMessage("Symbol must be between 1 and 10 characters"),
  query("period")
    .optional()
    .isIn(["1d", "7d", "30d", "90d", "1y"])
    .withMessage("Invalid period"),
];

const searchValidation = [
  query("query")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Search query must be between 1 and 50 characters"),
  query("q")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Search query must be between 1 and 50 characters"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

const updatePriceValidation = [
  param("symbol")
    .trim()
    .toUpperCase()
    .isLength({ min: 1, max: 10 })
    .withMessage("Symbol must be between 1 and 10 characters"),
];

/**
 * @route   GET /api/assets
 * @desc    Get assets with filtering and pagination
 * @access  Public
 */
router.get(
  "/",
  getAssetsValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        search: req.query.search,
        type: req.query.type,
        exchange: req.query.exchange,
        sortBy: req.query.sortBy || "symbol",
        sortOrder: req.query.sortOrder || "asc",
      };

      const result = await assetService.getAssets(options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Get assets error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch assets",
      });
    }
  }
);

/**
 * @route   GET /api/assets/search
 * @desc    Search assets by symbol or name
 * @access  Private
 */
router.get(
  "/search",
  authenticateToken,
  searchValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const query = req.query.q || req.query.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Search query is required (use 'q' or 'query' parameter)",
          errors: ["Query parameter is required"],
        });
      }

      const limit = parseInt(req.query.limit) || 10;

      const results = await assetService.searchAssets(query, limit);

      res.json({
        success: true,
        assets: results,
      });
    } catch (error) {
      logger.error("Search assets error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Search failed",
      });
    }
  }
);

/**
 * @route   GET /api/assets/trending
 * @desc    Get trending assets
 * @access  Public (temporarily for testing)
 */
router.get(
  "/trending",
  // authenticateToken, // Temporarily commented out for testing
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const trending = await assetService.getTrendingAssets(limit);

      res.json({
        success: true,
        assets: trending,
      });
    } catch (error) {
      logger.error("Get trending assets error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch trending assets",
      });
    }
  }
);

/**
 * @route   GET /api/assets/gainers
 * @desc    Get top gaining assets
 * @access  Public
 */
router.get(
  "/gainers",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const gainers = await assetService.getTopGainers(limit);

      res.json({
        success: true,
        data: { assets: gainers },
      });
    } catch (error) {
      logger.error("Get top gainers error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch top gainers",
      });
    }
  }
);

/**
 * @route   GET /api/assets/losers
 * @desc    Get top losing assets
 * @access  Public
 */
router.get(
  "/losers",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const losers = await assetService.getTopLosers(limit);

      res.json({
        success: true,
        data: { assets: losers },
      });
    } catch (error) {
      logger.error("Get top losers error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch top losers",
      });
    }
  }
);

/**
 * @route   GET /api/assets/:symbol/quote
 * @desc    Get real-time quote for asset
 * @access  Public
 */
router.get(
  "/:symbol/quote",
  marketDataLimiter,
  [
    param("symbol")
      .trim()
      .toUpperCase()
      .isLength({ min: 1, max: 10 })
      .withMessage("Symbol must be between 1 and 10 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const quote = await marketDataService.getStockQuote(symbol);

      res.json({
        success: true,
        data: { quote },
      });
    } catch (error) {
      logger.error("Get quote error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch quote",
      });
    }
  }
);

/**
 * @route   GET /api/assets/:symbol/history
 * @desc    Get price history for asset
 * @access  Public
 */
router.get(
  "/:symbol/history",
  getPriceHistoryValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const period = req.query.period || "7d";

      const history = await assetService.getAssetPriceHistory(symbol, period);

      res.json({
        success: true,
        data: { history, period },
      });
    } catch (error) {
      logger.error("Get price history error:", error);
      const statusCode = error.message === "Asset not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to fetch price history",
      });
    }
  }
);

/**
 * @route   GET /api/assets/:symbol/overview
 * @desc    Get company overview
 * @access  Public
 */
router.get(
  "/:symbol/overview",
  marketDataLimiter,
  [
    param("symbol")
      .trim()
      .toUpperCase()
      .isLength({ min: 1, max: 10 })
      .withMessage("Symbol must be between 1 and 10 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const overview = await marketDataService.getCompanyOverview(symbol);

      res.json({
        success: true,
        data: { overview },
      });
    } catch (error) {
      logger.error("Get company overview error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch company overview",
      });
    }
  }
);

/**
 * @route   GET /api/assets/:identifier
 * @desc    Get asset by ID or symbol
 * @access  Public
 */
router.get("/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const asset = await assetService.getAsset(identifier);

    res.json({
      success: true,
      data: asset,
    });
  } catch (error) {
    logger.error("Get asset error:", error);
    const statusCode = error.message === "Asset not found" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch asset",
    });
  }
});

/**
 * @route   POST /api/assets
 * @desc    Create a new asset (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/",
  authenticateToken,
  requireRole("admin"),
  createAssetValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const assetData = req.body;
      const asset = await assetService.createAsset(assetData);

      logger.info("Asset created by admin", {
        assetId: asset._id,
        symbol: asset.symbol,
      });

      res.status(201).json({
        success: true,
        message: "Asset created successfully",
        data: { asset },
      });
    } catch (error) {
      logger.error("Create asset error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create asset",
      });
    }
  }
);

/**
 * @route   PUT /api/assets/:id
 * @desc    Update asset (Admin only)
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authenticateToken,
  requireRole("admin"),
  updateAssetValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const assetId = req.params.id;
      const updateData = req.body;

      const asset = await assetService.updateAsset(assetId, updateData);

      logger.info("Asset updated by admin", { assetId, symbol: asset.symbol });

      res.json({
        success: true,
        message: "Asset updated successfully",
        data: { asset },
      });
    } catch (error) {
      logger.error("Update asset error:", error);
      const statusCode = error.message === "Asset not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to update asset",
      });
    }
  }
);

/**
 * @route   DELETE /api/assets/:id
 * @desc    Delete asset (Admin only)
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authenticateToken,
  requireRole("admin"),
  [param("id").isMongoId().withMessage("Invalid asset ID")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const assetId = req.params.id;

      await assetService.deleteAsset(assetId);

      logger.info("Asset deleted by admin", { assetId });

      res.json({
        success: true,
        message: "Asset deleted successfully",
      });
    } catch (error) {
      logger.error("Delete asset error:", error);
      const statusCode = error.message === "Asset not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to delete asset",
      });
    }
  }
);

/**
 * @route   POST /api/assets/:symbol/update-price
 * @desc    Manually update asset price (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/:symbol/update-price",
  authenticateToken,
  requireRole("admin"),
  marketDataLimiter,
  updatePriceValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();

      // Get latest quote from market data service
      const quote = await marketDataService.getStockQuote(symbol);

      // Update asset with new price data
      const asset = await assetService.updateAssetPrice(symbol, {
        price: quote.price,
        volume: quote.volume,
        marketCap: null, // Alpha Vantage doesn't provide market cap in quotes
      });

      logger.info("Asset price updated manually by admin", {
        symbol,
        price: quote.price,
      });

      res.json({
        success: true,
        message: "Asset price updated successfully",
        data: {
          asset: {
            symbol: asset.symbol,
            currentPrice: asset.currentPrice,
            priceChange24h: asset.priceChange24h,
            priceChangePercent24h: asset.priceChangePercent24h,
            lastUpdated: asset.lastUpdated,
          },
        },
      });
    } catch (error) {
      logger.error("Update asset price error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update asset price",
      });
    }
  }
);

/**
 * @route   POST /api/assets/batch-update-prices
 * @desc    Batch update multiple asset prices (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/batch-update-prices",
  authenticateToken,
  requireRole("admin"),
  [
    body("symbols")
      .isArray({ min: 1, max: 20 })
      .withMessage("Symbols must be an array with 1-20 items"),
    body("symbols.*")
      .trim()
      .toUpperCase()
      .isLength({ min: 1, max: 10 })
      .withMessage("Each symbol must be between 1 and 10 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const symbols = req.body.symbols.map((s) => s.toUpperCase());

      const result = await marketDataService.updateAssetPrices(symbols);

      logger.info("Batch price update completed by admin", result);

      res.json({
        success: true,
        message: `Batch update completed: ${result.successful} successful, ${result.failed} failed`,
        data: result,
      });
    } catch (error) {
      logger.error("Batch update prices error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update asset prices",
      });
    }
  }
);

/**
 * @route   GET /api/assets/market/status
 * @desc    Get market status
 * @access  Public
 */
router.get("/market/status", async (req, res) => {
  try {
    const status = await marketDataService.getMarketStatus();

    res.json({
      success: true,
      data: { status },
    });
  } catch (error) {
    logger.error("Get market status error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch market status",
    });
  }
});

/**
 * @route   POST /api/assets/search/external
 * @desc    Search for assets in external API
 * @access  Public
 */
router.post(
  "/search/external",
  marketDataLimiter,
  [
    body("query")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Search query must be between 1 and 50 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const query = req.body.query;
      const results = await marketDataService.searchStocks(query);

      res.json({
        success: true,
        data: { results },
      });
    } catch (error) {
      logger.error("External search error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "External search failed",
      });
    }
  }
);

/**
 * @route   GET /api/assets/:symbol
 * @desc    Get asset details by symbol
 * @access  Private
 */
router.get(
  "/:symbol",
  authenticateToken,
  [
    param("symbol")
      .trim()
      .toUpperCase()
      .isLength({ min: 1, max: 10 })
      .withMessage("Symbol must be between 1 and 10 characters")
      .isAlphanumeric()
      .withMessage("Symbol must contain only letters and numbers")
      .custom((value) => {
        // Additional validation for common invalid patterns
        const invalidPatterns = [
          "ETERNAL",
          "TEST",
          "DEMO",
          "SAMPLE",
          "EXAMPLE",
          "NULL",
          "UNDEFINED",
          "NONE",
          "INVALID",
        ];
        if (invalidPatterns.includes(value.toUpperCase())) {
          throw new Error("Invalid asset symbol");
        }
        return true;
      }),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();

      // Log the symbol being requested for debugging
      logger.info(`Asset lookup requested for symbol: ${symbol}`);

      const asset = await assetService.getAssetBySymbol(symbol);

      if (!asset) {
        logger.warn(`Asset not found for symbol: ${symbol}`);
        return res.status(404).json({
          success: false,
          message: `Asset with symbol '${symbol}' not found`,
          symbol: symbol,
        });
      }

      res.json({
        success: true,
        data: asset,
      });
    } catch (error) {
      logger.error(`Get asset error for symbol ${req.params.symbol}:`, error);

      // More specific error handling
      let statusCode = 500;
      let message = "Failed to fetch asset";

      if (error.message === "Asset not found") {
        statusCode = 404;
        message = `Asset with symbol '${req.params.symbol}' not found`;
      } else if (error.message.includes("Invalid asset symbol")) {
        statusCode = 400;
        message = `Invalid asset symbol: '${req.params.symbol}'`;
      } else if (error.message.includes("validation")) {
        statusCode = 400;
        message = error.message;
      }

      res.status(statusCode).json({
        success: false,
        message: message,
        symbol: req.params.symbol,
      });
    }
  }
);

/**
 * @route   GET /api/assets/:symbol/price-history
 * @desc    Get price history for asset
 * @access  Private
 */
router.get(
  "/:symbol/price-history",
  authenticateToken,
  getPriceHistoryValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const period = req.query.period || "7d";
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      const history = await marketDataService.getPriceHistory(
        symbol,
        period,
        startDate,
        endDate
      );

      res.json({
        success: true,
        priceHistory: history,
      });
    } catch (error) {
      logger.error("Get price history error:", error);
      const statusCode =
        error.message === "Asset not found" ||
        error.message.includes("not found")
          ? 404
          : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to fetch price history",
      });
    }
  }
);

/**
 * @route   GET /api/assets/:symbol/company-overview
 * @desc    Get company overview
 * @access  Private
 */
router.get(
  "/:symbol/company-overview",
  authenticateToken,
  marketDataLimiter,
  [
    param("symbol")
      .trim()
      .toUpperCase()
      .isLength({ min: 1, max: 10 })
      .withMessage("Symbol must be between 1 and 10 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const overview = await marketDataService.getCompanyOverview(symbol);

      res.json({
        success: true,
        overview: overview,
      });
    } catch (error) {
      logger.error("Get company overview error:", error);
      const statusCode = error.message === "Asset not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to fetch company overview",
      });
    }
  }
);

module.exports = router;
