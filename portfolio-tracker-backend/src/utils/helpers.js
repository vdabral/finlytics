const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const logger = require("./logger");

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

// Generate secure random token
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash password or any string
const hashString = (str, salt = null) => {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(str, actualSalt, 10000, 64, "sha512")
    .toString("hex");
  return { hash, salt: actualSalt };
};

// Verify hashed string
const verifyHash = (str, hash, salt) => {
  const verifyHash = crypto
    .pbkdf2Sync(str, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === verifyHash;
};

// Generate JWT tokens
const generateTokens = (payload) => {
  try {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "15m",
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
    });

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error("Token generation error:", error);
    throw new Error("Failed to generate tokens");
  }
};

// Verify JWT token
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw error;
  }
};

// Format currency
const formatCurrency = (amount, currency = "INR", locale = "en-IN") => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `₹${amount.toFixed(2)}`;
  }
};

// Format percentage
const formatPercentage = (value, decimals = 2) => {
  return `${value.toFixed(decimals)}%`;
};

// Calculate percentage change
const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

// Calculate compound annual growth rate (CAGR)
const calculateCAGR = (initialValue, finalValue, periods) => {
  if (initialValue <= 0 || finalValue <= 0 || periods <= 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / periods) - 1) * 100;
};

// Calculate simple moving average
const calculateSMA = (values, period) => {
  if (values.length < period) return null;
  const sum = values.slice(-period).reduce((acc, val) => acc + val, 0);
  return sum / period;
};

// Calculate volatility (standard deviation)
const calculateVolatility = (values) => {
  if (values.length < 2) return 0;

  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  const squaredDifferences = values.map((val) => Math.pow(val - mean, 2));
  const variance =
    squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length;

  return Math.sqrt(variance);
};

// Calculate Sharpe ratio (simplified)
const calculateSharpeRatio = (returns, riskFreeRate = 0.02) => {
  if (returns.length < 2) return 0;

  const avgReturn = returns.reduce((acc, val) => acc + val, 0) / returns.length;
  const volatility = calculateVolatility(returns);

  if (volatility === 0) return 0;

  return (avgReturn - riskFreeRate) / volatility;
};

// Pagination helper
const getPaginationData = (page = 1, limit = 10, total = 0) => {
  const currentPage = Math.max(1, parseInt(page));
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
  const totalPages = Math.ceil(total / itemsPerPage);
  const skip = (currentPage - 1) * itemsPerPage;

  return {
    page: currentPage,
    limit: itemsPerPage,
    total,
    totalPages,
    skip,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
  };
};

// API response formatter
const formatResponse = (
  success = true,
  data = null,
  message = "",
  pagination = null
) => {
  const response = {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
};

// Error response formatter
const formatErrorResponse = (message, code = null, details = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  return response;
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!hasNumbers) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length,
  };
};

// Sanitize input
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
};

// Generate slug from string
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Deep clone object
const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Sleep function
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      logger.warn(
        `Retry attempt ${i + 1} failed, retrying in ${delay}ms:`,
        error.message
      );
      await sleep(delay);
    }
  }
};

// Date helpers
const dateHelpers = {
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  addMonths: (date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  },

  addYears: (date, years) => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  },

  getDaysDifference: (date1, date2) => {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  },

  isWeekend: (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  },

  isBusinessDay: (date) => {
    return !dateHelpers.isWeekend(date);
  },

  formatDate: (date, format = "YYYY-MM-DD") => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    switch (format) {
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      default:
        return d.toISOString().split("T")[0];
    }
  },
};

module.exports = {
  generateRandomString,
  generateSecureToken,
  hashString,
  verifyHash,
  generateTokens,
  verifyToken,
  formatCurrency,
  formatPercentage,
  calculatePercentageChange,
  calculateCAGR,
  calculateSMA,
  calculateVolatility,
  calculateSharpeRatio,
  getPaginationData,
  formatResponse,
  formatErrorResponse,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  generateSlug,
  deepClone,
  debounce,
  throttle,
  sleep,
  retryWithBackoff,
  dateHelpers,
};
