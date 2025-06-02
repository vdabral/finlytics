const winston = require("winston");
const path = require("path");

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define which transports the logger must use
const transports = [
  // Console transport for all environments
  new winston.transports.Console({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: process.env.NODE_ENV === "production" ? format : consoleFormat,
  }),
];

// Add file transports only in production or when explicitly enabled
if (
  process.env.NODE_ENV === "production" ||
  process.env.LOG_TO_FILE === "true"
) {
  // Ensure logs directory exists
  const fs = require("fs");
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // HTTP requests log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "http.log"),
      level: "http",
      format,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3,
      tailable: true,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  levels,
  format,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
if (process.env.NODE_ENV === "production") {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "exceptions.log"),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3,
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "rejections.log"),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3,
    })
  );
}

// Add request ID to log context if available
const originalLog = logger.log;
logger.log = function (level, message, meta = {}) {
  if (typeof level === "object") {
    meta = level;
    message = meta.message;
    level = meta.level || "info";
  }

  // Add timestamp if not present
  if (!meta.timestamp) {
    meta.timestamp = new Date().toISOString();
  }

  return originalLog.call(this, level, message, meta);
};

// Helper methods for structured logging
logger.logRequest = (req, res, responseTime) => {
  logger.http("HTTP Request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userId: req.user ? req.user._id : null,
    requestId: req.requestId || null,
  });
};

logger.logError = (error, req = null, additionalInfo = {}) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...additionalInfo,
  };

  if (req) {
    errorLog.request = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user ? req.user._id : null,
      requestId: req.requestId || null,
    };
  }

  logger.error("Application Error", errorLog);
};

logger.logSecurity = (event, details, req = null) => {
  const securityLog = {
    event,
    details,
    timestamp: new Date().toISOString(),
  };

  if (req) {
    securityLog.request = {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      method: req.method,
      userId: req.user ? req.user._id : null,
    };
  }

  logger.warn("Security Event", securityLog);
};

logger.logPerformance = (operation, duration, additionalInfo = {}) => {
  logger.info("Performance Metric", {
    operation,
    duration: `${duration}ms`,
    ...additionalInfo,
    timestamp: new Date().toISOString(),
  });
};

logger.logDatabase = (operation, collection, duration, details = {}) => {
  logger.debug("Database Operation", {
    operation,
    collection,
    duration: `${duration}ms`,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

logger.logExternalAPI = (
  service,
  endpoint,
  duration,
  statusCode,
  details = {}
) => {
  logger.info("External API Call", {
    service,
    endpoint,
    duration: `${duration}ms`,
    statusCode,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Create a stream for Morgan HTTP logger
logger.stream = {
  write: function (message) {
    logger.http(message.trim());
  },
};

module.exports = logger;
