const axios = require("axios");
const logger = require("../utils/logger");
const { cache } = require("../utils/cache");

class IndianStockApiService {
  constructor() {
    this.baseURL =
      process.env.INDIAN_STOCK_API_BASE_URL || "https://stock.indianapi.in";
    this.apiKey = process.env.INDIAN_STOCK_API_KEY;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        "X-Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.info(
          `Indian Stock API Request: ${config.method?.toUpperCase()} ${
            config.url
          }`
        );
        return config;
      },
      (error) => {
        logger.error("Indian Stock API Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.info(
          `Indian Stock API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        logger.error("Indian Stock API Response Error:", {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }
  /**
   * Get stock details by name (company name)
   */
  async getStockDetails(name) {
    try {
      const cacheKey = `stock_details_${name}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/stock", {
        params: { name },
      });

      const rawData = response.data;

      // Normalize the response structure to match expected format
      const stockData = {
        symbol: name, // Use the requested name as symbol
        price: rawData.currentPrice,
        companyName: rawData.companyName,
        industry: rawData.industry,
        companyProfile: rawData.companyProfile,
        currentPrice: rawData.currentPrice,
        stockTechnicalData: rawData.stockTechnicalData,
        percentChange: rawData.percentChange,
        yearHigh: rawData.yearHigh,
        yearLow: rawData.yearLow,
        financials: rawData.financials,
        keyMetrics: rawData.keyMetrics,
        futureExpiryDates: rawData.futureExpiryDates,
        futureOverviewData: rawData.futureOverviewData,
        initialStockFinancialData: rawData.initialStockFinancialData,
        analystView: rawData.analystView,
        recosBar: rawData.recosBar,
        riskMeter: rawData.riskMeter,
        shareholding: rawData.shareholding,
        stockCorporateActionData: rawData.stockCorporateActionData,
        stockDetailsReusableData: rawData.stockDetailsReusableData,
        stockFinancialData: rawData.stockFinancialData,
        recentNews: rawData.recentNews,
      };

      // Cache for 5 minutes
      await cache.setex(cacheKey, 300, JSON.stringify(stockData));

      return stockData;
    } catch (error) {
      logger.error(`Error fetching stock details for ${name}:`, error);
      throw new Error(`Failed to fetch stock details: ${error.message}`);
    }
  }

  /**
   * Get trending stocks
   */
  async getTrendingStocks() {
    try {
      const cacheKey = "trending_stocks";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/trending");
      const trendingData = response.data;

      // Cache for 5 minutes
      await cache.setex(cacheKey, 300, JSON.stringify(trendingData));

      return trendingData;
    } catch (error) {
      logger.error("Error fetching trending stocks:", error);
      throw new Error(`Failed to fetch trending stocks: ${error.message}`);
    }
  }

  /**
   * Get NSE most active stocks
   */
  async getNSEMostActive() {
    try {
      const cacheKey = "nse_most_active";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/NSE_most_active");
      const activeData = response.data;

      // Cache for 5 minutes
      await cache.setex(cacheKey, 300, JSON.stringify(activeData));

      return activeData;
    } catch (error) {
      logger.error("Error fetching NSE most active stocks:", error);
      throw new Error(
        `Failed to fetch NSE most active stocks: ${error.message}`
      );
    }
  }

  /**
   * Get BSE most active stocks
   */
  async getBSEMostActive() {
    try {
      const cacheKey = "bse_most_active";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/BSE_most_active");
      const activeData = response.data;

      // Cache for 5 minutes
      await cache.setex(cacheKey, 300, JSON.stringify(activeData));

      return activeData;
    } catch (error) {
      logger.error("Error fetching BSE most active stocks:", error);
      throw new Error(
        `Failed to fetch BSE most active stocks: ${error.message}`
      );
    }
  }

  /**
   * Get market news
   */
  async getMarketNews() {
    try {
      const cacheKey = "market_news";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/news");
      const newsData = response.data;

      // Cache for 10 minutes
      await cache.setex(cacheKey, 600, JSON.stringify(newsData));

      return newsData;
    } catch (error) {
      logger.error("Error fetching market news:", error);
      throw new Error(`Failed to fetch market news: ${error.message}`);
    }
  }
  /**
   * Get historical data for a stock
   * Note: Indian Stock API historical_data endpoint has complex requirements.
   * For now, we'll generate mock historical data based on current price.
   */
  async getHistoricalData(name, period = "1y") {
    try {
      const cacheKey = `historical_data_${name}_${period}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      // Try the actual API first with correct parameters
      try {
        const response = await this.axiosInstance.get("/historical_data", {
          params: {
            stock_name: name,
            filter: this._mapPeriodToFilter(period),
          },
        });

        const historicalData = response.data;
        await cache.setex(cacheKey, 1800, JSON.stringify(historicalData));
        return historicalData;
      } catch (apiError) {
        logger.warn(
          `Indian Stock API historical data not available for ${name}, generating fallback data`
        );

        // Fallback: Generate mock historical data based on current stock price
        const stockDetails = await this.getStockDetails(name);
        const currentPrice = stockDetails.currentPrice || 100;
        const historicalData = this._generateMockHistoricalData(
          currentPrice,
          period
        );

        // Cache for shorter time since it's mock data
        await cache.setex(cacheKey, 300, JSON.stringify(historicalData));
        return historicalData;
      }
    } catch (error) {
      logger.error(`Error fetching historical data for ${name}:`, error);
      throw new Error(`Failed to fetch historical data: ${error.message}`);
    }
  }

  /**
   * Get price shockers
   */
  async getPriceShockers() {
    try {
      const cacheKey = "price_shockers";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/price_shockers");
      const shockersData = response.data;

      // Cache for 5 minutes
      await cache.setex(cacheKey, 300, JSON.stringify(shockersData));

      return shockersData;
    } catch (error) {
      logger.error("Error fetching price shockers:", error);
      throw new Error(`Failed to fetch price shockers: ${error.message}`);
    }
  }

  /**
   * Get IPO data
   */
  async getIpoData() {
    try {
      const cacheKey = "ipo_data";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/ipo");
      const ipoData = response.data;

      // Cache for 1 hour
      await cache.setex(cacheKey, 3600, JSON.stringify(ipoData));

      return ipoData;
    } catch (error) {
      logger.error("Error fetching IPO data:", error);
      throw new Error(`Failed to fetch IPO data: ${error.message}`);
    }
  }

  /**
   * Get commodities data
   */
  async getCommoditiesData() {
    try {
      const cacheKey = "commodities_data";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/commodities");
      const commoditiesData = response.data;

      // Cache for 10 minutes
      await cache.setex(cacheKey, 600, JSON.stringify(commoditiesData));

      return commoditiesData;
    } catch (error) {
      logger.error("Error fetching commodities data:", error);
      throw new Error(`Failed to fetch commodities data: ${error.message}`);
    }
  }

  /**
   * Get mutual funds data
   */
  async getMutualFundsData() {
    try {
      const cacheKey = "mutual_funds_data";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/mutual_funds");
      const mutualFundsData = response.data;

      // Cache for 30 minutes
      await cache.setex(cacheKey, 1800, JSON.stringify(mutualFundsData));

      return mutualFundsData;
    } catch (error) {
      logger.error("Error fetching mutual funds data:", error);
      throw new Error(`Failed to fetch mutual funds data: ${error.message}`);
    }
  }

  /**
   * Search for stocks by industry
   */
  async searchByIndustry(industry) {
    try {
      const cacheKey = `industry_search_${industry}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/industry_search", {
        params: { industry },
      });

      const industryData = response.data;

      // Cache for 1 hour
      await cache.setex(cacheKey, 3600, JSON.stringify(industryData));

      return industryData;
    } catch (error) {
      logger.error(`Error searching industry ${industry}:`, error);
      throw new Error(`Failed to search industry: ${error.message}`);
    }
  }
  /**
   * Get stock forecasts
   * Note: Indian Stock API stock_forecasts endpoint requires specific financial metrics.
   * For general stock price forecasting, we'll provide a simplified forecast.
   */
  async getStockForecasts(name) {
    try {
      const cacheKey = `stock_forecasts_${name}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      // Try to get financial forecasts with valid parameters
      try {
        const response = await this.axiosInstance.get("/stock_forecasts", {
          params: {
            stock_id: name,
            measure_code: "EPS", // Earnings Per Share
            period_type: "Annual",
            data_type: "forecast",
            age: "1",
          },
        });

        const forecastData = response.data;
        await cache.setex(cacheKey, 3600, JSON.stringify(forecastData));
        return forecastData;
      } catch (apiError) {
        logger.warn(
          `Indian Stock API forecasts not available for ${name}, generating fallback forecast`
        );

        // Fallback: Generate mock forecast based on current stock data
        const stockDetails = await this.getStockDetails(name);
        const currentPrice = stockDetails.currentPrice || 100;
        const forecast = this._generateMockForecast(currentPrice, stockDetails);

        // Cache for shorter time since it's mock data
        await cache.setex(cacheKey, 600, JSON.stringify(forecast));
        return forecast;
      }
    } catch (error) {
      logger.error(`Error fetching forecasts for ${name}:`, error);
      throw new Error(`Failed to fetch stock forecasts: ${error.message}`);
    }
  }

  /**
   * Get corporate actions
   */
  async getCorporateActions() {
    try {
      const cacheKey = "corporate_actions";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get("/corporate_actions");
      const corporateData = response.data;

      // Cache for 1 hour
      await cache.setex(cacheKey, 3600, JSON.stringify(corporateData));

      return corporateData;
    } catch (error) {
      logger.error("Error fetching corporate actions:", error);
      throw new Error(`Failed to fetch corporate actions: ${error.message}`);
    }
  }

  /**
   * Get 52-week high/low data
   */
  async get52WeekHighLowData() {
    try {
      const cacheKey = "52_week_high_low";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const response = await this.axiosInstance.get(
        "/fetch_52_week_high_low_data"
      );
      const highLowData = response.data;

      // Cache for 1 hour
      await cache.setex(cacheKey, 3600, JSON.stringify(highLowData));

      return highLowData;
    } catch (error) {
      logger.error("Error fetching 52-week high/low data:", error);
      throw new Error(
        `Failed to fetch 52-week high/low data: ${error.message}`
      );
    }
  }

  /**
   * Helper method to map period to API filter format
   */
  _mapPeriodToFilter(period) {
    const filterMap = {
      "1d": "1D",
      "1w": "1W",
      "1m": "1M",
      "3m": "3M",
      "6m": "6M",
      "1y": "1Y",
      "5y": "5Y",
    };
    return filterMap[period] || "1M";
  }

  /**
   * Generate mock historical data based on current price
   */
  _generateMockHistoricalData(currentPrice, period) {
    const days = this._getPeriodDays(period);
    const data = [];
    const basePrice = currentPrice;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Generate realistic price variation (±5% random walk)
      const variation = (Math.random() - 0.5) * 0.1; // ±5%
      const price = basePrice * (1 + variation * (i / days));

      data.push({
        date: date.toISOString().split("T")[0],
        open: price * 0.998,
        high: price * 1.015,
        low: price * 0.985,
        close: price,
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });
    }

    return data;
  }

  /**
   * Generate mock forecast based on current stock data
   */
  _generateMockForecast(currentPrice, stockDetails) {
    const percentChange = stockDetails.percentChange || 0;
    const trend = percentChange > 0 ? "bullish" : "bearish";

    return {
      symbol: stockDetails.companyName,
      current_price: currentPrice,
      forecast_1w: currentPrice * (1 + (percentChange / 100) * 0.1),
      forecast_1m: currentPrice * (1 + (percentChange / 100) * 0.3),
      forecast_3m: currentPrice * (1 + (percentChange / 100) * 0.7),
      trend: trend,
      confidence: Math.floor(Math.random() * 30) + 60, // 60-90%
      generated_at: new Date().toISOString(),
      disclaimer: "This is a generated forecast based on current trends",
    };
  }

  /**
   * Get number of days for a given period
   */
  _getPeriodDays(period) {
    const periodMap = {
      "1d": 1,
      "1w": 7,
      "1m": 30,
      "3m": 90,
      "6m": 180,
      "1y": 365,
      "5y": 1825,
    };
    return periodMap[period] || 30;
  }
}

module.exports = new IndianStockApiService();
