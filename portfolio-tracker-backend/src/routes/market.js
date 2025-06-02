const express = require("express");
const { body, query, param } = require("express-validator");
const marketDataService = require("../services/marketDataService");
const assetService = require("../services/assetService");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { marketDataLimiter } = require("../middleware/rateLimiting");
const logger = require("../utils/logger");

const router = express.Router();

// Validation rules
const getQuotesValidation = [
  body("symbols")
    .isArray({ min: 1, max: 10 })
    .withMessage("Symbols must be an array with 1-10 items"),
  body("symbols.*")
    .trim()
    .toUpperCase()
    .isLength({ min: 1, max: 10 })
    .withMessage("Each symbol must be between 1 and 10 characters"),
];

const getHistoricalValidation = [
  param("symbol")
    .trim()
    .toUpperCase()
    .isLength({ min: 1, max: 10 })
    .withMessage("Symbol must be between 1 and 10 characters"),
  query("outputSize")
    .optional()
    .isIn(["compact", "full"])
    .withMessage("Output size must be compact or full"),
];

const getForexValidation = [
  param("from")
    .trim()
    .toUpperCase()
    .isLength({ min: 3, max: 3 })
    .withMessage("From currency must be 3 characters"),
  param("to")
    .trim()
    .toUpperCase()
    .isLength({ min: 3, max: 3 })
    .withMessage("To currency must be 3 characters"),
];

/**
 * @route   POST /api/market/quotes
 * @desc    Get real-time quotes for multiple symbols
 * @access  Public
 */
router.post(
  "/quotes",
  marketDataLimiter,
  getQuotesValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const symbols = req.body.symbols.map((s) => s.toUpperCase());

      const { quotes, errors } = await marketDataService.getBatchQuotes(
        symbols
      );

      res.json({
        success: true,
        data: {
          quotes,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error) {
      logger.error("Get batch quotes error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch quotes",
      });
    }
  }
);

/**
 * @route   GET /api/market/quote/:symbol
 * @desc    Get real-time quote for a single symbol
 * @access  Public
 */
router.get(
  "/quote/:symbol",
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
 * @route   GET /api/market/historical/:symbol
 * @desc    Get historical data for a symbol
 * @access  Public
 */
router.get(
  "/historical/:symbol",
  marketDataLimiter,
  getHistoricalValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const outputSize = req.query.outputSize || "compact";

      const historicalData = await marketDataService.getHistoricalData(
        symbol,
        outputSize
      );

      res.json({
        success: true,
        data: {
          symbol,
          outputSize,
          data: historicalData,
        },
      });
    } catch (error) {
      logger.error("Get historical data error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch historical data",
      });
    }
  }
);

/**
 * @route   GET /api/market/search/:query
 * @desc    Search for stocks in market data
 * @access  Public
 */
router.get(
  "/search/:query",
  marketDataLimiter,
  [
    param("query")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Search query must be between 1 and 50 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const query = req.params.query;
      const results = await marketDataService.searchStocks(query);

      res.json({
        success: true,
        data: {
          query,
          results,
        },
      });
    } catch (error) {
      logger.error("Market search error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Search failed",
      });
    }
  }
);

/**
 * @route   GET /api/market/overview/:symbol
 * @desc    Get company overview
 * @access  Public
 */
router.get(
  "/overview/:symbol",
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
 * @route   GET /api/market/forex/:from/:to
 * @desc    Get forex exchange rate
 * @access  Public
 */
router.get(
  "/forex/:from/:to",
  marketDataLimiter,
  getForexValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const fromCurrency = req.params.from.toUpperCase();
      const toCurrency = req.params.to.toUpperCase();

      const rate = await marketDataService.getForexRates(
        fromCurrency,
        toCurrency
      );

      res.json({
        success: true,
        data: { rate },
      });
    } catch (error) {
      logger.error("Get forex rate error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch forex rate",
      });
    }
  }
);

/**
 * @route   GET /api/market/status
 * @desc    Get market status
 * @access  Public
 */
router.get("/status", async (req, res) => {
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
 * @route   POST /api/market/sync-prices
 * @desc    Sync asset prices with market data (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/sync-prices",
  authenticateToken,
  requireRole("admin"),
  [
    body("symbols")
      .optional()
      .isArray({ min: 1, max: 50 })
      .withMessage("Symbols must be an array with 1-50 items"),
    body("symbols.*")
      .optional()
      .trim()
      .toUpperCase()
      .isLength({ min: 1, max: 10 })
      .withMessage("Each symbol must be between 1 and 10 characters"),
    body("syncAll")
      .optional()
      .isBoolean()
      .withMessage("syncAll must be a boolean"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      let symbols = req.body.symbols;
      const syncAll = req.body.syncAll;

      // If syncAll is true or no symbols provided, get all asset symbols
      if (syncAll || !symbols || symbols.length === 0) {
        const assets = await assetService.getAssets({ limit: 100 });
        symbols = assets.assets.map((asset) => asset.symbol);
      }

      if (symbols.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No symbols to sync",
        });
      }

      const result = await marketDataService.updateAssetPrices(symbols);

      logger.info("Price sync completed by admin", {
        requestedSymbols: symbols.length,
        successful: result.successful,
        failed: result.failed,
      });

      res.json({
        success: true,
        message: `Price sync completed: ${result.successful} successful, ${result.failed} failed`,
        data: result,
      });
    } catch (error) {
      logger.error("Sync prices error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to sync prices",
      });
    }
  }
);

/**
 * @route   GET /api/market/rate-limit-status
 * @desc    Get current rate limit status (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/rate-limit-status",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const status = {
        currentRequestCount: marketDataService.requestCount,
        maxRequestsPerMinute: marketDataService.maxRequestsPerMinute,
        lastResetTime: new Date(marketDataService.lastResetTime),
        remainingRequests: Math.max(
          0,
          marketDataService.maxRequestsPerMinute -
            marketDataService.requestCount
        ),
        nextResetTime: new Date(marketDataService.lastResetTime + 60000),
      };

      res.json({
        success: true,
        data: { rateLimitStatus: status },
      });
    } catch (error) {
      logger.error("Get rate limit status error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch rate limit status",
      });
    }
  }
);

/**
 * @route   POST /api/market/test-connection
 * @desc    Test market data API connection (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/test-connection",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      // Test with a known Indian stock symbol
      const testSymbol = "RELIANCE";
      const startTime = Date.now();

      const quote = await marketDataService.getStockQuote(testSymbol);
      const responseTime = Date.now() - startTime;

      const testResult = {
        status: "success",
        testSymbol,
        responseTime: `${responseTime}ms`,
        apiResponse: {
          symbol: quote.symbol,
          price: quote.price,
          lastUpdated: quote.lastUpdated,
        },
        timestamp: new Date(),
      };

      logger.info("Market data API connection test successful", testResult);

      res.json({
        success: true,
        message: "Market data API connection test successful",
        data: { testResult },
      });
    } catch (error) {
      logger.error("Market data API connection test failed:", error);

      const testResult = {
        status: "failed",
        error: error.message,
        timestamp: new Date(),
      };

      res.status(400).json({
        success: false,
        message: "Market data API connection test failed",
        data: { testResult },
      });
    }
  }
);

/**
 * @route   GET /api/market/usage-stats
 * @desc    Get API usage statistics (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/usage-stats",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      // In a production environment, you would track these stats in a database
      // For now, we'll return current session stats
      const stats = {
        currentSession: {
          requestCount: marketDataService.requestCount,
          maxRequests: marketDataService.maxRequestsPerMinute,
          utilizationPercent:
            (marketDataService.requestCount /
              marketDataService.maxRequestsPerMinute) *
            100,
          sessionStartTime: new Date(marketDataService.lastResetTime),
        },
        recommendations: [
          "Monitor rate limits to avoid API restrictions",
          "Cache frequently requested data to reduce API calls",
          "Consider upgrading to a premium API plan for higher limits",
          "Schedule bulk updates during off-peak hours",
        ],
      };

      res.json({
        success: true,
        data: { usageStats: stats },
      });
    } catch (error) {
      logger.error("Get usage stats error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch usage statistics",
      });
    }
  }
);

/**
 * @route   GET /api/market/price/:symbol
 * @desc    Get current price for a symbol (alias for quote)
 * @access  Public
 */
router.get(
  "/price/:symbol",
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
        data: {
          symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          lastUpdated: quote.lastUpdated,
        },
      });
    } catch (error) {
      logger.error("Get price error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch price",
      });
    }
  }
);

/**
 * @route   GET /api/market/trending
 * @desc    Get trending stocks (gainers and losers)
 * @access  Public
 */
router.get("/trending", marketDataLimiter, async (req, res) => {
  try {
    const trendingData = await marketDataService.getTrendingStocks();
    // Ensure trendingData has the expected structure
    if (!trendingData || typeof trendingData !== "object") {
      return res.json({
        success: true,
        data: { topGainers: [], topLosers: [] },
        fallback: true,
        message: "No trending data available",
      });
    }
    // Defensive: always return topGainers and topLosers arrays
    res.json({
      success: true,
      data: {
        topGainers: Array.isArray(trendingData.topGainers)
          ? trendingData.topGainers
          : [],
        topLosers: Array.isArray(trendingData.topLosers)
          ? trendingData.topLosers
          : [],
      },
    });
  } catch (error) {
    logger.error("Get trending stocks error:", error);
    if (error.response?.status === 429) {
      const fallbackData = { topGainers: [], topLosers: [] };
      res.json({
        success: true,
        data: fallbackData,
        fallback: true,
        message: "Using cached data due to rate limiting",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch trending stocks",
      });
    }
  }
});

/**
 * @route   GET /api/market/top-movers
 * @desc    Get top market movers (alias for trending stocks)
 * @access  Public
 */
router.get("/top-movers", marketDataLimiter, async (req, res) => {
  try {
    const trendingData = await marketDataService.getTrendingStocks();
    // Defensive: always return topGainers and topLosers arrays
    res.json({
      success: true,
      data: {
        topGainers: Array.isArray(trendingData.topGainers)
          ? trendingData.topGainers
          : [],
        topLosers: Array.isArray(trendingData.topLosers)
          ? trendingData.topLosers
          : [],
      },
    });
  } catch (error) {
    logger.error("Get top movers error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch top movers",
    });
  }
});

/**
 * @route   GET /api/market/most-active/nse
 * @desc    Get most active NSE stocks
 * @access  Public
 */
router.get("/most-active/nse", marketDataLimiter, async (req, res) => {
  try {
    const mostActive = await marketDataService.getNSEMostActive();

    res.json({
      success: true,
      data: mostActive,
    });
  } catch (error) {
    logger.error("Get NSE most active error:", error);

    // Return fallback data for rate limiting
    if (error.response?.status === 429) {
      res.json({
        success: true,
        data: [],
        fallback: true,
        message: "Using cached data due to rate limiting",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch NSE most active stocks",
      });
    }
  }
});

/**
 * @route   GET /api/market/most-active/bse
 * @desc    Get most active BSE stocks
 * @access  Public
 */
router.get("/most-active/bse", marketDataLimiter, async (req, res) => {
  try {
    const mostActive = await marketDataService.getBSEMostActive();

    res.json({
      success: true,
      data: mostActive,
    });
  } catch (error) {
    logger.error("Get BSE most active error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch BSE most active stocks",
    });
  }
});

/**
 * @route   GET /api/market/52-week-high-low
 * @desc    Get 52-week high/low data
 * @access  Public
 */
router.get("/52-week-high-low", marketDataLimiter, async (req, res) => {
  try {
    const data = await marketDataService.get52WeekHighLow();

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    logger.error("Get 52-week high/low error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch 52-week high/low data",
    });
  }
});

/**
 * @route   GET /api/market/stats
 * @desc    Get aggregated market statistics
 * @access  Public
 */
router.get("/stats", marketDataLimiter, async (req, res) => {
  try {
    // Make sequential requests to avoid rate limiting
    let trending = { topGainers: [], topLosers: [] };
    let nseActive = [];
    let bseActive = [];

    try {
      trending = await marketDataService.getTrendingStocks();
    } catch (error) {
      logger.warn("Failed to get trending data for stats:", error.message);
    }

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      nseActive = await marketDataService.getNSEMostActive();
    } catch (error) {
      logger.warn("Failed to get NSE active data for stats:", error.message);
    }

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      bseActive = await marketDataService.getBSEMostActive();
    } catch (error) {
      logger.warn("Failed to get BSE active data for stats:", error.message);
    }

    // Calculate aggregate stats
    const totalAssets = (nseActive?.length || 0) + (bseActive?.length || 0);
    const gainersCount = trending?.topGainers?.length || 0;
    const losersCount = trending?.topLosers?.length || 0;

    // Calculate total volume and market cap from available data
    const totalVolume = [
      ...(trending?.topGainers || []),
      ...(trending?.topLosers || []),
      ...(nseActive || []),
      ...(bseActive || []),
    ].reduce((sum, stock) => sum + (stock.volume || 0), 0);

    const totalMarketCap = [
      ...(trending?.topGainers || []),
      ...(trending?.topLosers || []),
    ].reduce((sum, stock) => sum + (stock.marketCap || 0), 0);

    res.json({
      success: true,
      data: {
        totalAssets,
        gainersCount,
        losersCount,
        totalVolume,
        totalMarketCap,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    logger.error("Get market stats error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch market statistics",
    });
  }
});

/**
 * @route   GET /api/market/price-shockers
 * @desc    Get price shockers data
 * @access  Public
 */
router.get("/price-shockers", marketDataLimiter, async (req, res) => {
  try {
    const data = await marketDataService.makeIndianApiRequest(
      "/price_shockers"
    );

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    logger.error("Get price shockers error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch price shockers",
    });
  }
});

module.exports = router;
