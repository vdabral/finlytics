const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "stock",
        "crypto",
        "etf",
        "mutual_fund",
        "bond",
        "commodity",
        "forex",
      ],
      default: "stock",
    },
    // Portfolio-specific fields (optional for general asset catalog)
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Portfolio",
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    quantity: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    averagePrice: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    currentPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    gainLoss: {
      type: Number,
      default: 0,
    },
    gainLossPercentage: {
      type: Number,
      default: 0,
    },
    sector: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    exchange: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    priceHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        volume: {
          type: Number,
          default: 0,
        },
      },
    ],
    alerts: [
      {
        type: {
          type: String,
          enum: ["price_above", "price_below", "percentage_change"],
          required: true,
        },
        value: {
          type: Number,
          required: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        lastTriggered: Date,
      },
    ],
    metadata: {
      lastPriceUpdate: {
        type: Date,
        default: Date.now,
      },
      priceSource: {
        type: String,
        enum: [
          "alpha_vantage",
          "indian_stock_api",
          "financial_modeling_prep",
          "yahoo_finance",
          "manual",
        ],
        default: "alpha_vantage",
      },
      marketCap: Number,
      peRatio: Number,
      dividendYield: Number,
      beta: Number,
      description: String,
      website: String,
      logo: String,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
assetSchema.index({ portfolioId: 1 });
assetSchema.index({ userId: 1 });
assetSchema.index({ symbol: 1 });
assetSchema.index({ type: 1 });
assetSchema.index({ portfolioId: 1, symbol: 1 }, { unique: true });
assetSchema.index({ "priceHistory.date": 1 });
assetSchema.index({ "metadata.lastPriceUpdate": 1 });

// Virtual for weight in portfolio (calculated on demand)
assetSchema.virtual("weight").get(function () {
  // This will be calculated in the portfolio context
  return this._weight || 0;
});

// Virtual for daily change
assetSchema.virtual("dailyChange").get(function () {
  if (this.priceHistory && this.priceHistory.length >= 2) {
    const current = this.currentPrice;
    const previous = this.priceHistory[this.priceHistory.length - 2].price;
    return {
      value: current - previous,
      percentage: previous > 0 ? ((current - previous) / previous) * 100 : 0,
    };
  }
  return { value: 0, percentage: 0 };
});

// Method to calculate current metrics
assetSchema.methods.calculateMetrics = function () {
  this.totalCost = this.quantity * this.averagePrice;
  this.currentValue = this.quantity * this.currentPrice;
  this.gainLoss = this.currentValue - this.totalCost;
  this.gainLossPercentage =
    this.totalCost > 0 ? (this.gainLoss / this.totalCost) * 100 : 0;
};

// Method to update price
assetSchema.methods.updatePrice = function (
  newPrice,
  source = "alpha_vantage"
) {
  if (newPrice && newPrice > 0) {
    this.currentPrice = newPrice;
    this.metadata.lastPriceUpdate = new Date();
    this.metadata.priceSource = source;

    // Add to price history if price has changed
    const lastHistoryEntry = this.priceHistory[this.priceHistory.length - 1];
    if (!lastHistoryEntry || lastHistoryEntry.price !== newPrice) {
      this.priceHistory.push({
        date: new Date(),
        price: newPrice,
      });

      // Keep only last 90 days for free version
      const daysToKeep = 90;
      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      );
      this.priceHistory = this.priceHistory.filter(
        (entry) => entry.date >= cutoffDate
      );
    }

    this.calculateMetrics();
  }
};

// Method to add transaction
assetSchema.methods.addTransaction = function (transaction) {
  this.transactions.push(transaction._id);

  // Recalculate average price based on all transactions
  // This is a simplified calculation - in production, you'd want to handle this more carefully
  if (transaction.type === "buy") {
    const totalCost =
      this.quantity * this.averagePrice +
      transaction.quantity * transaction.price;
    const totalQuantity = this.quantity + transaction.quantity;

    this.quantity = totalQuantity;
    this.averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  } else if (transaction.type === "sell") {
    this.quantity = Math.max(0, this.quantity - transaction.quantity);
  }

  this.calculateMetrics();
};

// Method to check alerts
assetSchema.methods.checkAlerts = function () {
  const triggeredAlerts = [];

  for (const alert of this.alerts) {
    if (!alert.isActive) continue;

    let shouldTrigger = false;

    switch (alert.type) {
      case "price_above":
        shouldTrigger = this.currentPrice >= alert.value;
        break;
      case "price_below":
        shouldTrigger = this.currentPrice <= alert.value;
        break;
      case "percentage_change":
        shouldTrigger = Math.abs(this.gainLossPercentage) >= alert.value;
        break;
    }

    if (
      shouldTrigger &&
      (!alert.lastTriggered ||
        Date.now() - alert.lastTriggered.getTime() > 24 * 60 * 60 * 1000)
    ) {
      alert.lastTriggered = new Date();
      triggeredAlerts.push(alert);
    }
  }

  return triggeredAlerts;
};

// Pre-save middleware
assetSchema.pre("save", function (next) {
  this.calculateMetrics();
  next();
});

module.exports = mongoose.model("Asset", assetSchema);
