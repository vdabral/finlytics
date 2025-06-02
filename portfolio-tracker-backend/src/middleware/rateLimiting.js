const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 500 : 100, // More lenient for development
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 50 : 5, // More lenient for development
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

// Rate limiting for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: "Too many password reset attempts, please try again later.",
    retryAfter: "1 hour",
  },
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many password reset attempts, please try again later.",
      retryAfter: "1 hour",
    });
  },
});

// Rate limiting for market data requests (Indian API tier limitation)
const marketDataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === "development" ? 100 : 50, // More generous for Indian API
  message: {
    success: false,
    message: "Too many market data requests, please try again later.",
    retryAfter: "1 minute",
  },
  handler: (req, res) => {
    logger.warn(`Market data rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many market data requests, please try again later.",
      retryAfter: "1 minute",
    });
  },
});

// Rate limiting for portfolio creation (prevent spam)
const portfolioCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 portfolio creations per hour
  message: {
    success: false,
    message: "Too many portfolio creation attempts, please try again later.",
    retryAfter: "1 hour",
  },
  keyGenerator: (req) => {
    // Use user ID instead of IP for authenticated requests
    return req.user ? req.user._id.toString() : req.ip;
  },
  handler: (req, res) => {
    logger.warn(
      `Portfolio creation rate limit exceeded for user: ${
        req.user?._id || req.ip
      }`
    );
    res.status(429).json({
      success: false,
      message: "Too many portfolio creation attempts, please try again later.",
      retryAfter: "1 hour",
    });
  },
});

// Rate limiting for transaction creation
const transactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each user to 50 transaction creations per 15 minutes
  message: {
    success: false,
    message: "Too many transaction requests, please try again later.",
    retryAfter: "15 minutes",
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  handler: (req, res) => {
    logger.warn(
      `Transaction rate limit exceeded for user: ${req.user?._id || req.ip}`
    );
    res.status(429).json({
      success: false,
      message: "Too many transaction requests, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

// Rate limiting for email sending
const emailLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // limit each IP to 10 emails per day (EmailJS free tier consideration)
  message: {
    success: false,
    message: "Daily email limit reached, please try again tomorrow.",
    retryAfter: "24 hours",
  },
  handler: (req, res) => {
    logger.warn(`Email rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Daily email limit reached, please try again tomorrow.",
      retryAfter: "24 hours",
    });
  },
});

// Sliding window rate limiter for premium users (more generous limits)
const premiumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Check if user is premium
    if (req.user && req.user.isPremium()) {
      return 500; // Premium users get 500 requests per 15 minutes
    }
    return 100; // Free users get 100 requests per 15 minutes
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  message: (req) => ({
    success: false,
    message:
      req.user && req.user.isPremium()
        ? "Premium rate limit exceeded, please try again later."
        : "Rate limit exceeded. Upgrade to premium for higher limits.",
    retryAfter: "15 minutes",
  }),
  handler: (req, res) => {
    const userType = req.user && req.user.isPremium() ? "premium" : "free";
    logger.warn(
      `${userType} rate limit exceeded for user: ${req.user?._id || req.ip}`
    );

    const message =
      req.user && req.user.isPremium()
        ? "Premium rate limit exceeded, please try again later."
        : "Rate limit exceeded. Upgrade to premium for higher limits.";

    res.status(429).json({
      success: false,
      message,
      retryAfter: "15 minutes",
    });
  },
});

// Custom rate limiter that considers user subscription
const createUserBasedLimiter = (
  freeLimit,
  premiumLimit,
  windowMs = 15 * 60 * 1000
) => {
  return rateLimit({
    windowMs,
    max: (req) => {
      if (req.user && req.user.isPremium()) {
        return premiumLimit;
      }
      return freeLimit;
    },
    keyGenerator: (req) => {
      return req.user ? req.user._id.toString() : req.ip;
    },
    message: (req) => ({
      success: false,
      message:
        req.user && req.user.isPremium()
          ? `Premium rate limit exceeded (${premiumLimit} requests per ${
              windowMs / 60000
            } minutes)`
          : `Rate limit exceeded (${freeLimit} requests per ${
              windowMs / 60000
            } minutes). Upgrade to premium for higher limits.`,
      retryAfter: `${windowMs / 60000} minutes`,
    }),
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  marketDataLimiter,
  portfolioCreationLimiter,
  transactionLimiter,
  emailLimiter,
  premiumLimiter,
  createUserBasedLimiter,
};
