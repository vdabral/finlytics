const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const marketDataService = require("../services/marketDataService");
const Portfolio = require("../models/Portfolio");

class SocketHandlers {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
    this.subscribedSymbols = new Map();
    this.priceUpdateInterval = null;

    this.setupMiddleware();
    this.setupEventHandlers();

    // Only start price updates in non-test environment
    if (process.env.NODE_ENV !== "test") {
      this.startPriceUpdates();
    }
  }

  setupMiddleware() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await require("../models/User")
          .findById(decoded.userId)
          .select("-password");

        if (!user) {
          return next(new Error("User not found"));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        logger.error("Socket authentication error:", error);
        next(new Error("Authentication failed"));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      logger.info(`User connected: ${socket.userId}`);
      this.handleConnection(socket);

      socket.on("subscribe_portfolio", (data) =>
        this.handlePortfolioSubscription(socket, data)
      );
      socket.on("subscribe_symbols", (data) =>
        this.handleSymbolSubscription(socket, data)
      );
      socket.on("unsubscribe_symbols", (data) =>
        this.handleSymbolUnsubscription(socket, data)
      );
      socket.on("get_live_price", (data) =>
        this.handleLivePriceRequest(socket, data)
      );
      socket.on("disconnect", () => this.handleDisconnection(socket));
    });
  }

  handleConnection(socket) {
    this.connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      subscribedSymbols: new Set(),
      portfolioId: null,
    });

    // Send initial connection success
    socket.emit("connected", {
      message: "Connected to real-time updates",
      userId: socket.userId,
    });
  }

  async handlePortfolioSubscription(socket, data) {
    try {
      const { portfolioId } = data;

      // Verify user owns this portfolio
      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        userId: socket.userId,
      }).populate("assets.assetId");

      if (!portfolio) {
        socket.emit("error", {
          message: "Portfolio not found or access denied",
        });
        return;
      }

      // Update user's portfolio subscription
      const userConnection = this.connectedUsers.get(socket.userId);
      if (userConnection) {
        userConnection.portfolioId = portfolioId;

        // Subscribe to all symbols in the portfolio
        const symbols = portfolio.assets.map((asset) => asset.assetId.symbol);
        userConnection.subscribedSymbols = new Set(symbols);

        // Add symbols to global subscription tracking
        symbols.forEach((symbol) => {
          if (!this.subscribedSymbols.has(symbol)) {
            this.subscribedSymbols.set(symbol, new Set());
          }
          this.subscribedSymbols.get(symbol).add(socket.userId);
        });
      }

      socket.emit("portfolio_subscribed", {
        portfolioId,
        symbols: Array.from(userConnection.subscribedSymbols),
      });

      logger.info(
        `User ${socket.userId} subscribed to portfolio ${portfolioId}`
      );
    } catch (error) {
      logger.error("Portfolio subscription error:", error);
      socket.emit("error", { message: "Failed to subscribe to portfolio" });
    }
  }

  handleSymbolSubscription(socket, data) {
    try {
      const { symbols } = data;

      if (!Array.isArray(symbols) || symbols.length === 0) {
        socket.emit("error", { message: "Invalid symbols provided" });
        return;
      }

      const userConnection = this.connectedUsers.get(socket.userId);
      if (userConnection) {
        symbols.forEach((symbol) => {
          userConnection.subscribedSymbols.add(symbol.toUpperCase());

          // Add to global subscription tracking
          if (!this.subscribedSymbols.has(symbol)) {
            this.subscribedSymbols.set(symbol, new Set());
          }
          this.subscribedSymbols.get(symbol).add(socket.userId);
        });
      }

      socket.emit("symbols_subscribed", {
        symbols: symbols.map((s) => s.toUpperCase()),
      });

      logger.info(
        `User ${socket.userId} subscribed to symbols: ${symbols.join(", ")}`
      );
    } catch (error) {
      logger.error("Symbol subscription error:", error);
      socket.emit("error", { message: "Failed to subscribe to symbols" });
    }
  }

  handleSymbolUnsubscription(socket, data) {
    try {
      const { symbols } = data;

      if (!Array.isArray(symbols)) {
        socket.emit("error", { message: "Invalid symbols provided" });
        return;
      }

      const userConnection = this.connectedUsers.get(socket.userId);
      if (userConnection) {
        symbols.forEach((symbol) => {
          userConnection.subscribedSymbols.delete(symbol.toUpperCase());

          // Remove from global subscription tracking
          if (this.subscribedSymbols.has(symbol)) {
            this.subscribedSymbols.get(symbol).delete(socket.userId);

            // If no users subscribed to this symbol, remove it
            if (this.subscribedSymbols.get(symbol).size === 0) {
              this.subscribedSymbols.delete(symbol);
            }
          }
        });
      }

      socket.emit("symbols_unsubscribed", {
        symbols: symbols.map((s) => s.toUpperCase()),
      });

      logger.info(
        `User ${socket.userId} unsubscribed from symbols: ${symbols.join(", ")}`
      );
    } catch (error) {
      logger.error("Symbol unsubscription error:", error);
      socket.emit("error", { message: "Failed to unsubscribe from symbols" });
    }
  }
  async handleLivePriceRequest(socket, data) {
    try {
      const { symbol } = data;

      if (!symbol) {
        socket.emit("error", { message: "Symbol is required" });
        return;
      }

      const priceData = await marketDataService.getStockQuote(symbol);

      socket.emit("live_price", {
        symbol: symbol.toUpperCase(),
        ...priceData,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error("Live price request error:", error);
      socket.emit("error", { message: "Failed to get live price" });
    }
  }

  handleDisconnection(socket) {
    logger.info(`User disconnected: ${socket.userId}`);

    // Clean up user connection and subscriptions
    const userConnection = this.connectedUsers.get(socket.userId);
    if (userConnection) {
      // Remove user from all symbol subscriptions
      userConnection.subscribedSymbols.forEach((symbol) => {
        if (this.subscribedSymbols.has(symbol)) {
          this.subscribedSymbols.get(symbol).delete(socket.userId);

          // If no users subscribed to this symbol, remove it
          if (this.subscribedSymbols.get(symbol).size === 0) {
            this.subscribedSymbols.delete(symbol);
          }
        }
      });

      this.connectedUsers.delete(socket.userId);
    }
  }

  startPriceUpdates() {
    // Update prices every 30 seconds for subscribed symbols
    this.priceUpdateInterval = setInterval(async () => {
      await this.broadcastPriceUpdates();
    }, 30000);
  }

  async broadcastPriceUpdates() {
    try {
      const symbols = Array.from(this.subscribedSymbols.keys());

      if (symbols.length === 0) return;

      // Batch process symbols to respect API rate limits
      const batchSize = 5; // Alpha Vantage free tier allows 5 calls per minute
      const batches = [];

      for (let i = 0; i < symbols.length; i += batchSize) {
        batches.push(symbols.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (symbol) => {
            try {
              const priceData = await marketDataService.getStockQuote(symbol);
              const subscribedUsers = this.subscribedSymbols.get(symbol);

              if (subscribedUsers && subscribedUsers.size > 0) {
                const updateData = {
                  symbol,
                  ...priceData,
                  timestamp: new Date(),
                };

                // Send price update to all subscribed users
                subscribedUsers.forEach((userId) => {
                  const userConnection = this.connectedUsers.get(userId);
                  if (userConnection) {
                    this.io
                      .to(userConnection.socketId)
                      .emit("price_update", updateData);
                  }
                });
              }
            } catch (error) {
              logger.error(`Failed to update price for ${symbol}:`, error);
            }
          })
        );

        // Wait between batches to respect rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 12000)); // 12 seconds between batches
        }
      }
    } catch (error) {
      logger.error("Price update broadcast error:", error);
    }
  }

  // Method to broadcast portfolio performance updates
  async broadcastPortfolioUpdate(userId, portfolioId, performanceData) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection && userConnection.portfolioId === portfolioId) {
      this.io.to(userConnection.socketId).emit("portfolio_update", {
        portfolioId,
        performance: performanceData,
        timestamp: new Date(),
      });
    }
  }

  // Method to broadcast market alerts
  broadcastMarketAlert(alert) {
    this.io.emit("market_alert", {
      ...alert,
      timestamp: new Date(),
    });
  }

  // Cleanup method
  destroy() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    this.connectedUsers.clear();
    this.subscribedSymbols.clear();
  }
}

module.exports = SocketHandlers;
