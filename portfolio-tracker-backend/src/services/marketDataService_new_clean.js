// Market data service with comprehensive functionality
const marketDataService = {
  // Rate limiting properties for compatibility
  requestCount: 0,
  maxRequestsPerMinute: 5,
  lastResetTime: Date.now(),

  async getStockQuote(symbol) {
    try {
      // Return mock data for now
      const basePrice = this.getBasePriceForSymbol(symbol);
      const changePercent = (Math.random() - 0.5) * 10;
      const change = (basePrice * changePercent) / 100;
      const currentPrice = basePrice + change;

      return {
        symbol: symbol,
        name: this.getCompanyName(symbol),
        price: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        high: Math.round((currentPrice + Math.random() * 50) * 100) / 100,
        low: Math.round((currentPrice - Math.random() * 50) * 100) / 100,
        open: Math.round((basePrice + (Math.random() - 0.5) * 100) * 100) / 100,
        previousClose: Math.round(basePrice * 100) / 100,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        marketCap: null,
        exchange: symbol.includes(".BSE") ? "BSE" : "NSE",
        lastUpdated: new Date().toISOString().split("T")[0],
        source: "mock_data",
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error.message);
      throw error;
    }
  },

  async getBatchQuotes(symbols) {
    try {
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        throw new Error("Symbols array is required and cannot be empty");
      }

      console.log(`Getting batch quotes for ${symbols.length} symbols`);

      const quotes = [];
      const errors = [];
      const batchSize = 5;

      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);

        const batchPromises = batch.map(async (symbol) => {
          try {
            const quote = await this.getStockQuote(symbol);
            return { success: true, quote };
          } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error.message);
            return {
              success: false,
              symbol,
              error: error.message,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach((result) => {
          if (result.success) {
            quotes.push(result.quote);
          } else {
            errors.push({ symbol: result.symbol, error: result.error });
          }
        });

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < symbols.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log(
        `Batch quotes completed: ${quotes.length} successful, ${errors.length} errors`
      );

      return { quotes, errors };
    } catch (error) {
      console.error("Error in getBatchQuotes:", error.message);
      throw error;
    }
  },

  async getTrendingStocks() {
    try {
      const symbols = ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY"];
      const quotes = [];
      for (const symbol of symbols) {
        try {
          const quote = await this.getStockQuote(symbol);
          quotes.push(quote);
        } catch (err) {
          console.error(
            `Error fetching trending stock for ${symbol}:`,
            err.message
          );
        }
      }
      // Split into gainers and losers
      const topGainers = quotes
        .filter((q) => q.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent);
      const topLosers = quotes
        .filter((q) => q.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent);
      return { topGainers: topGainers || [], topLosers: topLosers || [] };
    } catch (error) {
      console.error("Error getting trending stocks:", error.message);
      return { topGainers: [], topLosers: [] };
    }
  },

  async getNSEMostActive() {
    try {
      const symbols = [
        "RELIANCE",
        "TCS",
        "HDFCBANK",
        "ICICIBANK",
        "INFY",
        "ITC",
        "SBIN",
      ];
      const quotes = [];

      for (const symbol of symbols) {
        const quote = await this.getStockQuote(symbol);
        quotes.push(quote);
      }

      return quotes.sort((a, b) => b.volume - a.volume);
    } catch (error) {
      console.error("Error getting NSE most active:", error.message);
      throw error;
    }
  },

  async getBSEMostActive() {
    try {
      const symbols = [
        "RELIANCE.BSE",
        "TCS.BSE",
        "HDFCBANK.BSE",
        "ICICIBANK.BSE",
      ];
      const quotes = [];

      for (const symbol of symbols) {
        const quote = await this.getStockQuote(symbol);
        quotes.push(quote);
      }

      return quotes.sort((a, b) => b.volume - a.volume);
    } catch (error) {
      console.error("Error getting BSE most active:", error.message);
      throw error;
    }
  },

  async get52WeekHighLow(symbol) {
    try {
      const basePrice = this.getBasePriceForSymbol(symbol);
      return {
        symbol,
        high: Math.round(basePrice * 1.3 * 100) / 100,
        low: Math.round(basePrice * 0.7 * 100) / 100,
        period: "52weeks",
      };
    } catch (error) {
      console.error(`Error getting 52-week data for ${symbol}:`, error.message);
      throw error;
    }
  },

  async getHistoricalData(
    symbol,
    period = "1y",
    startDate = null,
    endDate = null
  ) {
    try {
      return this.generateMockHistoricalData(
        symbol,
        period,
        startDate,
        endDate
      );
    } catch (error) {
      console.error(
        `Error getting historical data for ${symbol}:`,
        error.message
      );
      throw error;
    }
  },

  async searchStocks(query) {
    try {
      const mockStocks = [
        {
          symbol: "RELIANCE",
          name: "Reliance Industries Limited",
          exchange: "NSE",
        },
        {
          symbol: "TCS",
          name: "Tata Consultancy Services Limited",
          exchange: "NSE",
        },
        { symbol: "HDFCBANK", name: "HDFC Bank Limited", exchange: "NSE" },
        { symbol: "ICICIBANK", name: "ICICI Bank Limited", exchange: "NSE" },
        { symbol: "INFY", name: "Infosys Limited", exchange: "NSE" },
        { symbol: "ITC", name: "ITC Limited", exchange: "NSE" },
        { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },
        {
          symbol: "BHARTIARTL",
          name: "Bharti Airtel Limited",
          exchange: "NSE",
        },
      ];

      return mockStocks
        .filter(
          (stock) =>
            stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
            stock.name.toLowerCase().includes(query.toLowerCase())
        )
        .map((stock) => ({
          symbol: stock.symbol,
          name: stock.name,
          type: "Equity",
          region: "India",
          marketOpen: "09:15",
          marketClose: "15:30",
          timezone: "Asia/Kolkata",
          currency: "INR",
          matchScore: 1.0,
        }));
    } catch (error) {
      console.error(
        `Error searching stocks for query "${query}":`,
        error.message
      );
      throw error;
    }
  },

  async getCompanyOverview(symbol) {
    try {
      const basePrice = this.getBasePriceForSymbol(symbol);
      const mockData = {
        RELIANCE: {
          description:
            "Reliance Industries Limited is an Indian multinational conglomerate company headquartered in Mumbai, Maharashtra, India.",
          sector: "Energy",
          industry: "Oil & Gas Integrated",
        },
        TCS: {
          description:
            "Tata Consultancy Services is an Indian multinational information technology services and consulting company.",
          sector: "Information Technology",
          industry: "Information Technology Services",
        },
        HDFCBANK: {
          description:
            "HDFC Bank Limited is an Indian banking and financial services company.",
          sector: "Financial Services",
          industry: "Private Sector Bank",
        },
      };

      const baseSymbol = symbol.replace(/\.(NSE|BSE)$/, "");
      const companyData = mockData[baseSymbol] || {
        description: `${this.getCompanyName(
          symbol
        )} is a leading company in its sector.`,
        sector: "General",
        industry: "General",
      };

      return {
        symbol: symbol,
        name: this.getCompanyName(symbol),
        description: companyData.description,
        sector: companyData.sector,
        industry: companyData.industry,
        marketCap: (basePrice * 1000000000).toString(),
        peRatio: (15 + Math.random() * 20).toFixed(2),
        pegRatio: (1 + Math.random() * 2).toFixed(2),
        bookValue: (basePrice * 0.8).toFixed(2),
        dividendPerShare: (basePrice * 0.02).toFixed(2),
        dividendYield: (1 + Math.random() * 3).toFixed(2),
        eps: (basePrice * 0.05).toFixed(2),
        profitMargin: (5 + Math.random() * 15).toFixed(2),
        "52WeekHigh": (basePrice * 1.3).toFixed(2),
        "52WeekLow": (basePrice * 0.7).toFixed(2),
        beta: (0.8 + Math.random() * 0.4).toFixed(2),
      };
    } catch (error) {
      console.error(
        `Error getting company overview for ${symbol}:`,
        error.message
      );
      throw error;
    }
  },

  async getMarketStatus() {
    try {
      const now = new Date();
      const istTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const isWeekend = istTime.getDay() === 0 || istTime.getDay() === 6;

      const marketStart = 9 * 60 + 15; // 9:15 AM in minutes
      const marketEnd = 15 * 60 + 30; // 3:30 PM in minutes
      const currentTime = hours * 60 + minutes;

      const isOpen =
        !isWeekend && currentTime >= marketStart && currentTime <= marketEnd;

      const nextOpenDate = new Date(istTime);
      const nextCloseDate = new Date(istTime);

      if (isWeekend || currentTime > marketEnd) {
        // Market is closed, next open is next business day at 9:15
        while (nextOpenDate.getDay() === 0 || nextOpenDate.getDay() === 6) {
          nextOpenDate.setDate(nextOpenDate.getDate() + 1);
        }
        nextOpenDate.setHours(9, 15, 0, 0);
      }

      if (currentTime < marketStart) {
        nextOpenDate.setHours(9, 15, 0, 0);
      }

      if (isOpen) {
        nextCloseDate.setHours(15, 30, 0, 0);
      } else {
        nextCloseDate.setDate(nextCloseDate.getDate() + 1);
        while (nextCloseDate.getDay() === 0 || nextCloseDate.getDay() === 6) {
          nextCloseDate.setDate(nextCloseDate.getDate() + 1);
        }
        nextCloseDate.setHours(15, 30, 0, 0);
      }

      return {
        isOpen,
        nextOpen: nextOpenDate.toISOString(),
        nextClose: nextCloseDate.toISOString(),
        timezone: "Asia/Kolkata",
        currentTime: istTime.toISOString(),
        marketHours: {
          open: "09:15",
          close: "15:30",
        },
      };
    } catch (error) {
      console.error("Error getting market status:", error.message);

      // Fallback mock data
      const now = new Date();
      const hours = now.getHours();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;

      return {
        isOpen: !isWeekend && hours >= 9 && hours < 16,
        nextOpen: "2025-05-31T09:15:00Z",
        nextClose: "2025-05-31T15:30:00Z",
        timezone: "Asia/Kolkata",
        currentTime: now.toISOString(),
        marketHours: {
          open: "09:15",
          close: "15:30",
        },
      };
    }
  },

  async updateAssetPrices(symbols) {
    try {
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        throw new Error("Symbols array is required and cannot be empty");
      }

      console.log(`Updating prices for ${symbols.length} assets`);

      const prices = {};
      const errors = [];

      for (const symbol of symbols) {
        try {
          const quote = await this.getStockQuote(symbol);
          prices[symbol] = quote.price;
        } catch (error) {
          console.error(`Error updating price for ${symbol}:`, error.message);
          errors.push({ symbol, error: error.message });
        }
      }

      console.log(
        `Price update completed: ${Object.keys(prices).length} successful, ${
          errors.length
        } errors`
      );

      return {
        prices,
        errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error in updateAssetPrices:", error.message);
      throw error;
    }
  },

  async getPriceShockers(changeThreshold = 5) {
    try {
      const symbols = [
        "RELIANCE",
        "TCS",
        "HDFCBANK",
        "ICICIBANK",
        "INFY",
        "ITC",
        "SBIN",
        "BHARTIARTL",
      ];
      const shockers = [];

      for (const symbol of symbols) {
        const quote = await this.getStockQuote(symbol);
        if (Math.abs(quote.changePercent) >= changeThreshold) {
          shockers.push(quote);
        }
      }

      return shockers.sort(
        (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
      );
    } catch (error) {
      console.error("Error getting price shockers:", error.message);
      throw error;
    }
  },

  async getForexRates(fromCurrency, toCurrency) {
    try {
      // Mock forex data
      return {
        fromCurrency: fromCurrency || "USD",
        toCurrency: toCurrency || "INR",
        exchangeRate: 83.25,
        lastRefreshed: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting forex rates:", error.message);
      throw error;
    }
  },

  async getPriceHistory(symbol, period = "1y") {
    try {
      return await this.getHistoricalData(symbol, period);
    } catch (error) {
      console.error(
        `Error getting price history for ${symbol}:`,
        error.message
      );
      throw error;
    }
  },

  async healthCheck() {
    try {
      // Try to make a simple API call to check if the service is working
      const testSymbol = "RELIANCE";
      await this.getStockQuote(testSymbol);

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "mock_market_data",
        requestCount: this.requestCount,
        maxRequestsPerMinute: this.maxRequestsPerMinute,
        version: "1.0.0",
      };
    } catch (error) {
      console.error("Health check failed:", error.message);
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        service: "mock_market_data",
        error: error.message,
        requestCount: this.requestCount,
        maxRequestsPerMinute: this.maxRequestsPerMinute,
        version: "1.0.0",
      };
    }
  },

  // Helper methods
  getCompanyName(symbol) {
    const companyNames = {
      RELIANCE: "Reliance Industries Limited",
      TCS: "Tata Consultancy Services Limited",
      HDFCBANK: "HDFC Bank Limited",
      ICICIBANK: "ICICI Bank Limited",
      HINDUNILVR: "Hindustan Unilever Limited",
      INFY: "Infosys Limited",
      ITC: "ITC Limited",
      SBIN: "State Bank of India",
      BHARTIARTL: "Bharti Airtel Limited",
      KOTAKBANK: "Kotak Mahindra Bank Limited",
    };

    const baseSymbol = symbol.replace(/\.(NSE|BSE)$/, "");
    return companyNames[baseSymbol] || `${symbol} Limited`;
  },

  getBasePriceForSymbol(symbol) {
    const basePrices = {
      RELIANCE: 2400,
      TCS: 3500,
      HDFCBANK: 1600,
      ICICIBANK: 950,
      INFY: 1400,
      ITC: 450,
      SBIN: 600,
      BHARTIARTL: 850,
    };

    const baseSymbol = symbol.replace(/\.(NSE|BSE)$/, "");
    return basePrices[baseSymbol] || 1000;
  },

  generateMockHistoricalData(symbol, period, startDate, endDate) {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const data = [];

    const start = startDate
      ? new Date(startDate)
      : this.calculateStartDate(period);
    const end = endDate ? new Date(endDate) : new Date();

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        // Skip weekends
        const randomChange = (Math.random() - 0.5) * 100;
        const price = basePrice + randomChange;

        data.push({
          date: d.toISOString().split("T")[0],
          open: Math.round(price * 100) / 100,
          high: Math.round((price + Math.random() * 50) * 100) / 100,
          low: Math.round((price - Math.random() * 50) * 100) / 100,
          close: Math.round((price + (Math.random() - 0.5) * 20) * 100) / 100,
          volume: Math.floor(Math.random() * 1000000) + 100000,
        });
      }
    }

    return data;
  },

  calculateStartDate(period) {
    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case "1d":
        startDate.setDate(now.getDate() - 1);
        break;
      case "5d":
        startDate.setDate(now.getDate() - 5);
        break;
      case "1m":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "ytd":
        startDate.setMonth(0, 1);
        break;
      case "1y":
      default:
        startDate.setFullYear(now.getFullYear() - 1);
    }

    return startDate.toISOString().split("T")[0];
  },
};

module.exports = marketDataService;
