const { body, param, query, validationResult } = require("express-validator");
const mongoose = require("mongoose");

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  handleValidationErrors,
];

const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validatePasswordReset = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  handleValidationErrors,
];

const validatePasswordUpdate = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  handleValidationErrors,
];

// Change password validation
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  handleValidationErrors,
];

// Password reset token validation
const validatePasswordResetToken = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
];

// Portfolio validation rules
const validatePortfolio = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Portfolio name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage("Currency must be a valid 3-letter code"),
  handleValidationErrors,
];

const validatePortfolioUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Portfolio name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage("Currency must be a valid 3-letter code"),
  handleValidationErrors,
];

// Asset validation rules
const validateAsset = [
  body("symbol")
    .trim()
    .isLength({ min: 1, max: 10 })
    .isAlphanumeric()
    .toUpperCase()
    .withMessage("Symbol must be 1-10 alphanumeric characters"),
  body("name")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Asset name must be between 1 and 200 characters"),
  body("type")
    .isIn([
      "stock",
      "crypto",
      "etf",
      "mutual_fund",
      "bond",
      "commodity",
      "forex",
    ])
    .withMessage("Invalid asset type"),
  body("quantity")
    .isFloat({ min: 0 })
    .withMessage("Quantity must be a positive number"),
  body("averagePrice")
    .isFloat({ min: 0 })
    .withMessage("Average price must be a positive number"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage("Currency must be a valid 3-letter code"),
  handleValidationErrors,
];

const validateAssetUpdate = [
  body("quantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Quantity must be a positive number"),
  body("averagePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Average price must be a positive number"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),
  handleValidationErrors,
];

// Transaction validation rules
const validateTransaction = [
  body("type")
    .isIn(["buy", "sell", "dividend", "split", "merger"])
    .withMessage("Invalid transaction type"),
  body("symbol")
    .trim()
    .isLength({ min: 1, max: 10 })
    .isAlphanumeric()
    .toUpperCase()
    .withMessage("Symbol must be 1-10 alphanumeric characters"),
  body("quantity")
    .isFloat({ min: 0 })
    .withMessage("Quantity must be a positive number"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in ISO 8601 format"),
  body("fees")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fees must be a positive number or zero"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
  handleValidationErrors,
];

// MongoDB ObjectId validation
const validateObjectId = (field = "id") => [
  param(field).custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("Invalid ID format");
    }
    return true;
  }),
  handleValidationErrors,
];

// Query parameter validation
const validatePaginationQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sort")
    .optional()
    .isIn([
      "name",
      "createdAt",
      "updatedAt",
      "totalValue",
      "-name",
      "-createdAt",
      "-updatedAt",
      "-totalValue",
    ])
    .withMessage("Invalid sort field"),
  handleValidationErrors,
];

const validateDateRangeQuery = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be in ISO 8601 format"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be in ISO 8601 format"),
  query("startDate")
    .optional()
    .custom((value, { req }) => {
      if (req.query.endDate && new Date(value) > new Date(req.query.endDate)) {
        throw new Error("Start date must be before end date");
      }
      return true;
    }),
  handleValidationErrors,
];

// Search validation
const validateSearch = [
  query("q")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),
  handleValidationErrors,
];

// Market data validation
const validateMarketDataRequest = [
  query("symbols").custom((value) => {
    if (typeof value === "string") {
      value = [value];
    }
    if (!Array.isArray(value) || value.length === 0 || value.length > 10) {
      throw new Error("Symbols must be an array with 1-10 items");
    }
    for (const symbol of value) {
      if (
        typeof symbol !== "string" ||
        symbol.length === 0 ||
        symbol.length > 10
      ) {
        throw new Error(
          "Each symbol must be a non-empty string with maximum 10 characters"
        );
      }
    }
    return true;
  }),
  handleValidationErrors,
];

// Alert validation
const validateAlert = [
  body("type")
    .isIn(["price_above", "price_below", "percentage_change"])
    .withMessage("Invalid alert type"),
  body("value")
    .isFloat({ min: 0 })
    .withMessage("Alert value must be a positive number"),
  handleValidationErrors,
];

module.exports = {
  // User validations
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordUpdate,

  // Portfolio validations
  validatePortfolio,
  validatePortfolioUpdate,

  // Asset validations
  validateAsset,
  validateAssetUpdate,

  // Transaction validations
  validateTransaction,

  // General validations
  validateObjectId,
  validatePaginationQuery,
  validateDateRangeQuery,
  validateSearch,
  validateMarketDataRequest,
  validateAlert,

  // Helper
  handleValidationErrors,
  changePasswordValidation,
  validatePasswordResetToken,
};
