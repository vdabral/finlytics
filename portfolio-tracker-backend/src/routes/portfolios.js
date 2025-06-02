const express = require("express");
const { body, query, param } = require("express-validator");
const portfolioService = require("../services/portfolioService");
const assetService = require("../services/assetService");
const indianStockApiService = require("../services/indianStockApiService");
const { authenticateToken } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { portfolioCreationLimiter } = require("../middleware/rateLimiting");
const logger = require("../utils/logger");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation rules
const createPortfolioValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Portfolio name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  body("currency")
    .optional()
    .isIn(["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"])
    .withMessage("Invalid currency"),
  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic must be a boolean"),
  handleValidationErrors,
];

const updatePortfolioValidation = [
  param("id").isMongoId().withMessage("Invalid portfolio ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Portfolio name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  body("currency")
    .optional()
    .isIn(["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"])
    .withMessage("Invalid currency"),
  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic must be a boolean"),
  handleValidationErrors,
];

const addAssetValidation = [
  body().custom((value, { req }) => {
    // Allow either assetId OR symbol
    if (req.body.assetId && req.body.symbol) {
      throw new Error("Provide either assetId or symbol, not both");
    }
    if (!req.body.assetId && !req.body.symbol) {
      throw new Error("Either assetId or symbol is required");
    }
    if (
      req.body.assetId &&
      !require("mongoose").Types.ObjectId.isValid(req.body.assetId)
    ) {
      throw new Error("Invalid asset ID");
    }
    if (req.body.symbol && typeof req.body.symbol !== "string") {
      throw new Error("Symbol must be a string");
    }
    return true;
  }),
  body("quantity")
    .isFloat({ min: 0.000001 })
    .withMessage("Quantity must be a positive number"),
  body().custom((value, { req }) => {
    // Accept either purchasePrice or averagePrice
    const price = req.body.purchasePrice || req.body.averagePrice;
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      throw new Error(
        "Purchase price or average price must be a positive number"
      );
    }
    return true;
  }),
  handleValidationErrors,
];

const removeAssetValidation = [
  param("id").isMongoId().withMessage("Invalid portfolio ID"),
  body("assetId").isMongoId().withMessage("Invalid asset ID"),
  body("quantity")
    .isFloat({ min: 0.000001 })
    .withMessage("Quantity must be a positive number"),
  handleValidationErrors,
];

const getTransactionsValidation = [
  param("id").isMongoId().withMessage("Invalid portfolio ID"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("type")
    .optional()
    .isIn(["buy", "sell", "dividend", "split", "transfer"])
    .withMessage("Invalid transaction type"),
  query("assetId").optional().isMongoId().withMessage("Invalid asset ID"),
  handleValidationErrors,
];

const getAnalyticsValidation = [
  param("id").isMongoId().withMessage("Invalid portfolio ID"),
  query("period")
    .optional()
    .isIn(["1D", "7D", "1M", "3M", "6M", "1Y", "ALL"])
    .withMessage("Invalid period"),
  handleValidationErrors,
];

/**
 * @route   POST /api/portfolios
 * @desc    Create a new portfolio
 * @access  Private
 */
router.post(
  "/",
  portfolioCreationLimiter,
  createPortfolioValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const portfolioData = req.body;

      const portfolio = await portfolioService.createPortfolio(
        userId,
        portfolioData
      );

      logger.info("Portfolio created", { portfolioId: portfolio._id, userId });

      res.status(201).json({
        success: true,
        message: "Portfolio created successfully",
        portfolio,
      });
    } catch (error) {
      logger.error("Create portfolio error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create portfolio",
      });
    }
  }
);

/**
 * @route   GET /api/portfolios
 * @desc    Get user's portfolios
 * @access  Private
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolios = await portfolioService.getUserPortfolios(userId);

    res.json({
      success: true,
      portfolios,
    });
  } catch (error) {
    logger.error("Get portfolios error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch portfolios",
    });
  }
});

/**
 * @route   GET /api/portfolios/:id
 * @desc    Get portfolio by ID
 * @access  Private
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid portfolio ID")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user.id;

      const portfolio = await portfolioService.getPortfolioById(
        portfolioId,
        userId
      );

      res.json({
        success: true,
        data: { portfolio },
      });
    } catch (error) {
      logger.error("Get portfolio error:", error);
      const statusCode = error.message === "Portfolio not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to fetch portfolio",
      });
    }
  }
);

/**
 * @route   PUT /api/portfolios/:id
 * @desc    Update portfolio
 * @access  Private
 */
router.put(
  "/:id",
  updatePortfolioValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user.id;
      const updateData = req.body;

      const portfolio = await portfolioService.updatePortfolio(
        portfolioId,
        userId,
        updateData
      );

      logger.info("Portfolio updated", { portfolioId, userId });

      res.json({
        success: true,
        message: "Portfolio updated successfully",
        data: { portfolio },
      });
    } catch (error) {
      logger.error("Update portfolio error:", error);
      const statusCode = error.message === "Portfolio not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to update portfolio",
      });
    }
  }
);

/**
 * @route   DELETE /api/portfolios/:id
 * @desc    Delete portfolio
 * @access  Private
 */
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid portfolio ID")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user.id;

      await portfolioService.deletePortfolio(portfolioId, userId);

      logger.info("Portfolio deleted", { portfolioId, userId });

      res.json({
        success: true,
        message: "Portfolio deleted successfully",
      });
    } catch (error) {
      logger.error("Delete portfolio error:", error);
      const statusCode = error.message === "Portfolio not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to delete portfolio",
      });
    }
  }
);

/**
 * @route   POST /api/portfolios/:id/assets
 * @desc    Add asset to portfolio
 * @access  Private
 */
router.post(
  "/:id/assets",
  addAssetValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user.id;
      let assetData = { ...req.body };

      // Normalize price field
      if (assetData.averagePrice && !assetData.purchasePrice) {
        assetData.purchasePrice = assetData.averagePrice;
      }

      // If symbol is provided instead of assetId, resolve it
      if (assetData.symbol && !assetData.assetId) {
        try {
          // Try to find existing asset by symbol first
          let asset = null;
          try {
            asset = await assetService.getAssetBySymbol(assetData.symbol);

            // If getAssetBySymbol returned market data without _id, we need to create the asset
            if (asset && !asset._id) {
              logger.info(
                `Market data found for ${assetData.symbol}, creating asset in database`
              );

              asset = await assetService.findOrCreateAsset({
                symbol: assetData.symbol.toUpperCase(),
                name: asset.name || asset.companyName || assetData.symbol,
                type: assetData.assetType || "stock",
                exchange: "NSE", // Default to NSE for Indian stocks
                currentPrice: asset.currentPrice || asset.price || 0,
                industry: asset.industry || "Unknown",
              });
            }
          } catch (error) {
            // Asset not found, create it using Indian Stock API
            logger.info(
              `Asset not found for symbol ${assetData.symbol}, creating from Indian Stock API`
            );

            const stockData = await indianStockApiService.getStockDetails(
              assetData.symbol
            );

            // Create new asset from stock data
            asset = await assetService.findOrCreateAsset({
              symbol: assetData.symbol.toUpperCase(),
              name: stockData.companyName || assetData.symbol,
              type: assetData.assetType || "stock",
              exchange: "NSE", // Default to NSE for Indian stocks
              currentPrice: stockData.currentPrice || 0,
              industry: stockData.industry || "Unknown",
            });
          }

          if (asset && asset._id) {
            assetData.assetId = asset._id.toString();
          } else {
            throw new Error(
              `Unable to resolve asset for symbol: ${assetData.symbol}`
            );
          }
        } catch (error) {
          logger.error(
            `Error resolving asset symbol ${assetData.symbol}:`,
            error
          );
          return res.status(400).json({
            success: false,
            message: `Failed to resolve asset symbol: ${assetData.symbol}. ${error.message}`,
          });
        }
      }

      const portfolio = await portfolioService.addAssetToPortfolio(
        portfolioId,
        userId,
        assetData
      );

      logger.info("Asset added to portfolio", {
        portfolioId,
        assetId: assetData.assetId,
        symbol: assetData.symbol,
        userId,
      });

      res.json({
        success: true,
        message: "Asset added to portfolio successfully",
        portfolio,
      });
    } catch (error) {
      logger.error("Add asset to portfolio error:", error);
      const statusCode = error.message === "Portfolio not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to add asset to portfolio",
      });
    }
  }
);

/**
 * @route   DELETE /api/portfolios/:id/assets
 * @desc    Remove asset from portfolio
 * @access  Private
 */
router.delete(
  "/:id/assets",
  removeAssetValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user.id;
      const { assetId, quantity } = req.body;

      const portfolio = await portfolioService.removeAssetFromPortfolio(
        portfolioId,
        userId,
        assetId,
        quantity
      );

      logger.info("Asset removed from portfolio", {
        portfolioId,
        assetId,
        quantity,
        userId,
      });

      res.json({
        success: true,
        message: "Asset removed from portfolio successfully",
        data: { portfolio },
      });
    } catch (error) {
      logger.error("Remove asset from portfolio error:", error);
      const statusCode = error.message === "Portfolio not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to remove asset from portfolio",
      });
    }
  }
);

/**
 * @route   GET /api/portfolios/:id/performance
 * @desc    Get portfolio performance
 * @access  Private
 */
router.get(
  "/:id/performance",
  [param("id").isMongoId().withMessage("Invalid portfolio ID")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user.id;

      const performance = await portfolioService.calculatePortfolioPerformance(
        portfolioId,
        userId
      );

      res.json({
        success: true,
        performance,
      });
    } catch (error) {
      logger.error("Get portfolio performance error:", error);
      const statusCode = error.message === "Portfolio not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to calculate portfolio performance",
      });
    }
  }
);

/**
 * @route   GET /api/portfolios/:id/transactions
 * @desc    Get portfolio transactions
 * @access  Private
 */
router.get(
  "/:id/transactions",
  getTransactionsValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user.id;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        type: req.query.type,
        assetId: req.query.assetId,
      };

      const result = await portfolioService.getPortfolioTransactions(
        portfolioId,
        userId,
        options
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Get portfolio transactions error:", error);
      const statusCode = error.message === "Portfolio not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to fetch portfolio transactions",
      });
    }
  }
);

/**
 * @route   GET /api/portfolios/:id/analytics
 * @desc    Get portfolio analytics
 * @access  Private
 */
router.get(
  "/:id/analytics",
  getAnalyticsValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user.id;
      const period = req.query.period || "1M";

      const analytics = await portfolioService.getPortfolioAnalytics(
        portfolioId,
        userId,
        period
      );

      res.json({
        success: true,
        data: { analytics },
      });
    } catch (error) {
      logger.error("Get portfolio analytics error:", error);
      const statusCode = error.message === "Portfolio not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to fetch portfolio analytics",
      });
    }
  }
);

/**
 * @route   POST /api/portfolios/:id/refresh
 * @desc    Refresh portfolio data (recalculate performance)
 * @access  Private
 */
router.post(
  "/:id/refresh",
  [param("id").isMongoId().withMessage("Invalid portfolio ID")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const portfolioId = req.params.id;
      const userId = req.user.id;

      // Recalculate portfolio performance with fresh data
      const performance = await portfolioService.calculatePortfolioPerformance(
        portfolioId,
        userId
      );

      logger.info("Portfolio data refreshed", { portfolioId, userId });

      res.json({
        success: true,
        message: "Portfolio data refreshed successfully",
        data: { performance },
      });
    } catch (error) {
      logger.error("Refresh portfolio error:", error);
      const statusCode = error.message === "Portfolio not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to refresh portfolio data",
      });
    }
  }
);

/**
 * @route   GET /api/portfolios/summary/all
 * @desc    Get summary of all user portfolios
 * @access  Private
 */
router.get("/summary/all", async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolios = await portfolioService.getUserPortfolios(userId);

    // Calculate overall summary
    let totalValue = 0;
    let totalCost = 0;
    let totalGainLoss = 0;

    const portfolioSummaries = await Promise.all(
      portfolios.map(async (portfolio) => {
        try {
          const performance =
            await portfolioService.calculatePortfolioPerformance(
              portfolio._id,
              userId
            );

          totalValue += performance.totalValue || 0;
          totalCost += performance.totalCost || 0;
          totalGainLoss += performance.totalGainLoss || 0;

          return {
            id: portfolio._id,
            name: portfolio.name,
            currency: portfolio.currency,
            performance,
          };
        } catch (error) {
          logger.error(
            `Error calculating performance for portfolio ${portfolio._id}:`,
            error
          );
          return {
            id: portfolio._id,
            name: portfolio.name,
            currency: portfolio.currency,
            performance: null,
            error: error.message,
          };
        }
      })
    );

    const totalGainLossPercent =
      totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    const summary = {
      totalPortfolios: portfolios.length,
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      portfolios: portfolioSummaries,
    };

    res.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    logger.error("Get portfolios summary error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch portfolios summary",
    });
  }
});

module.exports = router;
