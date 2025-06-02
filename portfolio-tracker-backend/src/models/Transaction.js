const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["buy", "sell", "dividend", "split", "merger"],
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Portfolio",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    fees: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: { type: String, default: "INR", uppercase: true },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    source: {
      type: String,
      enum: ["manual", "import", "api"],
      default: "manual",
    },
    metadata: {
      broker: String,
      orderId: String,
      executionTime: Date,
      marketPrice: Number,
      priceType: {
        type: String,
        enum: ["market", "limit", "stop"],
        default: "market",
      },
    },
    taxes: {
      shortTermGains: {
        type: Number,
        default: 0,
      },
      longTermGains: {
        type: Number,
        default: 0,
      },
      dividendTax: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
transactionSchema.index({ userId: 1 });
transactionSchema.index({ portfolioId: 1 });
transactionSchema.index({ assetId: 1 });
transactionSchema.index({ symbol: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ userId: 1, date: -1 });

// Virtual for net amount (including fees)
transactionSchema.virtual("netAmount").get(function () {
  if (this.type === "buy") {
    return this.totalAmount + this.fees;
  } else if (this.type === "sell") {
    return this.totalAmount - this.fees;
  }
  return this.totalAmount;
});

// Virtual for gain/loss (only applicable for sell transactions)
transactionSchema.virtual("gainLoss").get(function () {
  // This would need to be calculated with reference to the original purchase price
  // For now, return 0 as it requires more complex logic
  return 0;
});

// Method to calculate total amount
transactionSchema.methods.calculateTotalAmount = function () {
  this.totalAmount = this.quantity * this.price;
};

// Method to validate transaction
transactionSchema.methods.validateTransaction = function () {
  const errors = [];

  // Check if selling more than owned (would need asset reference)
  if (this.type === "sell" && this.quantity <= 0) {
    errors.push("Sell quantity must be greater than 0");
  }

  // Check if price is reasonable (basic validation)
  if (this.price <= 0) {
    errors.push("Price must be greater than 0");
  }

  // Check if date is not in the future
  if (this.date > new Date()) {
    errors.push("Transaction date cannot be in the future");
  }

  return errors;
};

// Static method to get transaction summary for a portfolio
transactionSchema.statics.getPortfolioSummary = function (
  portfolioId,
  startDate,
  endDate
) {
  const match = {
    portfolioId: new mongoose.Types.ObjectId(portfolioId),
    isActive: true,
  };

  if (startDate && endDate) {
    match.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
        totalFees: { $sum: "$fees" },
        totalQuantity: { $sum: "$quantity" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
};

// Static method to get recent transactions
transactionSchema.statics.getRecentTransactions = function (
  userId,
  limit = 10
) {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    isActive: true,
  })
    .sort({ date: -1 })
    .limit(limit)
    .populate("assetId", "symbol name type")
    .populate("portfolioId", "name");
};

// Pre-save middleware
transactionSchema.pre("save", function (next) {
  this.calculateTotalAmount();
  const validationErrors = this.validateTransaction();
  if (validationErrors.length > 0) {
    return next(new Error(validationErrors.join(", ")));
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
