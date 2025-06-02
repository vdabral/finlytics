const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import routes
const authRoutes = require("./src/routes/auth");
const portfolioRoutes = require("./src/routes/portfolios");
const assetRoutes = require("./src/routes/assets");
const marketRoutes = require("./src/routes/market");
const adminRoutes = require("./src/routes/admin");
const monitoringRoutes = require("./src/routes/monitoring");
const indianStocksRoutes = require("./src/routes/indianStocks");

// Import middleware
const errorHandler = require("./src/middleware/errorHandler");
const { createVersionedRouter } = require("./src/middleware/versioning");
const logger = require("./src/utils/logger");

// Import configurations
const { swaggerSetup } = require("./src/config/swagger");

// Import services and jobs
const priceUpdateJob = require("./src/jobs/priceUpdateJob");
const EmailNotificationJob = require("./src/jobs/emailNotificationJob");
const DataCleanupJob = require("./src/jobs/dataCleanupJob");
const SocketHandlers = require("./src/handlers/socketHandlers");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // if you use cookies/auth
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Database connection (only connect if not in test mode)
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      logger.info("Connected to MongoDB");
    })
    .catch((error) => {
      logger.error("MongoDB connection error:", error);
      process.exit(1);
    });
}

// Initialize socket handlers
let socketHandlers;
try {
  socketHandlers = new SocketHandlers(io);
  logger.info("Socket handlers initialized");
} catch (error) {
  logger.error("Failed to initialize socket handlers:", error);
}

// Make io and socketHandlers available to routes
app.set("io", io);
app.set("socketHandlers", socketHandlers);

// Setup API documentation
swaggerSetup(app);

// Create versioned router
const versionedRouter = createVersionedRouter();

// Health check and monitoring endpoints
app.use("/", monitoringRoutes);

// API routes with versioning
app.use("/api/v1/auth", versionedRouter, authRoutes);
app.use("/api/v1/portfolios", versionedRouter, portfolioRoutes);
app.use("/api/v1/assets", versionedRouter, assetRoutes);
app.use("/api/v1/market", versionedRouter, marketRoutes);
app.use("/api/v1/admin", versionedRouter, adminRoutes);
app.use("/api/v1/indian-stocks", versionedRouter, indianStocksRoutes);

// Legacy routes (without versioning for backward compatibility)
app.use("/api/auth", authRoutes);
app.use("/api/portfolios", portfolioRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/indian-stocks", indianStocksRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start the server only if not in test mode and not required as module
if (process.env.NODE_ENV !== "test" && require.main === module) {
  server.listen(PORT, () => {
    logger.info(
      `Server running on port ${PORT} in ${
        process.env.NODE_ENV || "development"
      } mode`
    );
    logger.info(
      `API Documentation available at http://localhost:${PORT}/api-docs`
    ); // Start background jobs
    try {
      priceUpdateJob.init();

      const emailJob = new EmailNotificationJob();
      emailJob.start();

      const cleanupJob = new DataCleanupJob();
      cleanupJob.start();

      logger.info("Background jobs started successfully");
    } catch (error) {
      logger.error("Failed to start background jobs:", error);
    }
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");

  // Cleanup socket handlers
  if (socketHandlers) {
    socketHandlers.destroy();
  }

  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");

  // Cleanup socket handlers
  if (socketHandlers) {
    socketHandlers.destroy();
  }

  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Export app for testing and server for production
module.exports = app;
