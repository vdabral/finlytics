const express = require("express");
const indianStockApiService = require("../services/indianStockApiService");
const { authenticateToken } = require("../middleware/auth");
const { marketDataLimiter } = require("../middleware/rateLimiting");
const logger = require("../utils/logger");

const router = express.Router();

/**
 * @swagger
 * /api/indian-stocks/trending:
 *   get:
 *     summary: Get trending Indian stocks
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trending stocks data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/trending",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const trendingData = await indianStockApiService.getTrendingStocks();
      res.json({
        success: true,
        data: trendingData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error fetching trending stocks:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch trending stocks",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/stock/{name}:
 *   get:
 *     summary: Get stock details by company name
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Company name (e.g., RELIANCE, TCS, HDFC BANK)
 *     responses:
 *       200:
 *         description: Stock details
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/stock/:name",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const { name } = req.params;
      const stockData = await indianStockApiService.getStockDetails(name);
      res.json({
        success: true,
        data: stockData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        `Error fetching stock details for ${req.params.name}:`,
        error
      );
      res.status(500).json({
        success: false,
        error: "Failed to fetch stock details",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/nse-most-active:
 *   get:
 *     summary: Get NSE most active stocks
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: NSE most active stocks
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/nse-most-active",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const nseData = await indianStockApiService.getNSEMostActive();
      res.json({
        success: true,
        data: nseData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error fetching NSE most active stocks:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch NSE most active stocks",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/bse-most-active:
 *   get:
 *     summary: Get BSE most active stocks
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: BSE most active stocks
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/bse-most-active",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const bseData = await indianStockApiService.getBSEMostActive();
      res.json({
        success: true,
        data: bseData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error fetching BSE most active stocks:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch BSE most active stocks",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/news:
 *   get:
 *     summary: Get market news
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Market news data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/news", authenticateToken, marketDataLimiter, async (req, res) => {
  try {
    const newsData = await indianStockApiService.getMarketNews();
    res.json({
      success: true,
      data: newsData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error fetching market news:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch market news",
    });
  }
});

/**
 * @swagger
 * /api/indian-stocks/historical/{name}:
 *   get:
 *     summary: Get historical data for a stock
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Company name (e.g., RELIANCE, TCS, HDFC BANK)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "1y"
 *         description: Time period for historical data
 *     responses:
 *       200:
 *         description: Historical stock data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/historical/:name",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const { name } = req.params;
      const { period = "1y" } = req.query;
      const historicalData = await indianStockApiService.getHistoricalData(
        name,
        period
      );
      res.json({
        success: true,
        data: historicalData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        `Error fetching historical data for ${req.params.name}:`,
        error
      );
      res.status(500).json({
        success: false,
        error: "Failed to fetch historical data",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/price-shockers:
 *   get:
 *     summary: Get price shockers
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Price shockers data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/price-shockers",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const shockersData = await indianStockApiService.getPriceShockers();
      res.json({
        success: true,
        data: shockersData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error fetching price shockers:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch price shockers",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/ipo:
 *   get:
 *     summary: Get IPO data
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: IPO data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/ipo", authenticateToken, marketDataLimiter, async (req, res) => {
  try {
    const ipoData = await indianStockApiService.getIpoData();
    res.json({
      success: true,
      data: ipoData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error fetching IPO data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch IPO data",
    });
  }
});

/**
 * @swagger
 * /api/indian-stocks/commodities:
 *   get:
 *     summary: Get commodities data
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Commodities data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/commodities",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const commoditiesData = await indianStockApiService.getCommoditiesData();
      res.json({
        success: true,
        data: commoditiesData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error fetching commodities data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch commodities data",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/mutual-funds:
 *   get:
 *     summary: Get mutual funds data
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mutual funds data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/mutual-funds",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const mutualFundsData = await indianStockApiService.getMutualFundsData();
      res.json({
        success: true,
        data: mutualFundsData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error fetching mutual funds data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch mutual funds data",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/industry-search:
 *   get:
 *     summary: Search stocks by industry
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: industry
 *         required: true
 *         schema:
 *           type: string
 *         description: Industry name to search
 *     responses:
 *       200:
 *         description: Industry search results
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/industry-search",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const { industry } = req.query;
      if (!industry) {
        return res.status(400).json({
          success: false,
          error: "Industry parameter is required",
        });
      }
      const industryData = await indianStockApiService.searchByIndustry(
        industry
      );
      res.json({
        success: true,
        data: industryData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error searching industry ${req.query.industry}:`, error);
      res.status(500).json({
        success: false,
        error: "Failed to search industry",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/forecasts/{name}:
 *   get:
 *     summary: Get stock forecasts
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Company name (e.g., RELIANCE, TCS, HDFC BANK)
 *     responses:
 *       200:
 *         description: Stock forecasts
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/forecasts/:name",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const { name } = req.params;
      const forecastData = await indianStockApiService.getStockForecasts(name);
      res.json({
        success: true,
        data: forecastData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error fetching forecasts for ${req.params.name}:`, error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch stock forecasts",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/corporate-actions:
 *   get:
 *     summary: Get corporate actions
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Corporate actions data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/corporate-actions",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const corporateData = await indianStockApiService.getCorporateActions();
      res.json({
        success: true,
        data: corporateData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error fetching corporate actions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch corporate actions",
      });
    }
  }
);

/**
 * @swagger
 * /api/indian-stocks/52-week-high-low:
 *   get:
 *     summary: Get 52-week high/low data
 *     tags: [Indian Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 52-week high/low data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/52-week-high-low",
  authenticateToken,
  marketDataLimiter,
  async (req, res) => {
    try {
      const highLowData = await indianStockApiService.get52WeekHighLowData();
      res.json({
        success: true,
        data: highLowData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error fetching 52-week high/low data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch 52-week high/low data",
      });
    }
  }
);

module.exports = router;
