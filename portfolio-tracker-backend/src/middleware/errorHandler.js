const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user ? req.user._id : null,
    timestamp: new Date().toISOString(),
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Invalid resource ID format";
    error = {
      message,
      statusCode: 400,
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = "Duplicate field value entered";

    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    if (field) {
      message = `${
        field.charAt(0).toUpperCase() + field.slice(1)
      } already exists`;
    }

    error = {
      message,
      statusCode: 400,
    };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = {
      message,
      statusCode: 400,
    };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = {
      message: "Invalid token",
      statusCode: 401,
    };
  }

  if (err.name === "TokenExpiredError") {
    error = {
      message: "Token expired",
      statusCode: 401,
    };
  }

  // Multer errors (file upload)
  if (err.code === "LIMIT_FILE_SIZE") {
    error = {
      message: "File too large",
      statusCode: 400,
    };
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    error = {
      message: "Too many files uploaded",
      statusCode: 400,
    };
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    error = {
      message: "Unexpected file field",
      statusCode: 400,
    };
  }

  // API rate limit errors
  if (err.message && err.message.includes("rate limit")) {
    error = {
      message: err.message,
      statusCode: 429,
    };
  }

  // Database connection errors
  if (
    err.name === "MongoNetworkError" ||
    err.name === "MongooseServerSelectionError"
  ) {
    error = {
      message: "Database connection error. Please try again later.",
      statusCode: 503,
    };
  }

  // External API errors
  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
    error = {
      message: "External service unavailable. Please try again later.",
      statusCode: 503,
    };
  }

  // Market data API specific errors
  if (err.message && err.message.includes("Alpha Vantage")) {
    error = {
      message: "Market data service temporarily unavailable",
      statusCode: 503,
    };
  }

  // Redis connection errors
  if (err.code === "ECONNREFUSED" && err.message.includes("Redis")) {
    logger.warn("Redis connection failed, falling back to memory cache");
    // Don't return error for Redis failures, just log and continue
    return next();
  }

  // Email service errors
  if (err.message && err.message.includes("email")) {
    error = {
      message: "Email service temporarily unavailable",
      statusCode: 503,
    };
  }

  // File system errors
  if (err.code === "ENOENT") {
    error = {
      message: "File not found",
      statusCode: 404,
    };
  }

  if (err.code === "EACCES") {
    error = {
      message: "Permission denied",
      statusCode: 403,
    };
  }

  // Syntax errors in request
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    error = {
      message: "Invalid JSON in request body",
      statusCode: 400,
    };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Prepare error response
  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" &&
      statusCode === 500 && {
        stack: err.stack,
        originalError: err,
      }),
  };

  // Add request ID for tracking (if you implement request ID middleware)
  if (req.requestId) {
    errorResponse.requestId = req.requestId;
  }

  // Add error code for client-side handling
  if (statusCode === 400) {
    errorResponse.code = "VALIDATION_ERROR";
  } else if (statusCode === 401) {
    errorResponse.code = "AUTHENTICATION_ERROR";
  } else if (statusCode === 403) {
    errorResponse.code = "AUTHORIZATION_ERROR";
  } else if (statusCode === 404) {
    errorResponse.code = "NOT_FOUND";
  } else if (statusCode === 429) {
    errorResponse.code = "RATE_LIMIT_ERROR";
  } else if (statusCode === 500) {
    errorResponse.code = "INTERNAL_ERROR";
  } else if (statusCode === 503) {
    errorResponse.code = "SERVICE_UNAVAILABLE";
  }

  res.status(statusCode).json(errorResponse);
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  logger.error("Unhandled Promise Rejection:", err);
  // Don't exit process in production, just log the error
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  // Exit process for uncaught exceptions as they can leave the app in an unstable state
  process.exit(1);
});

module.exports = errorHandler;
