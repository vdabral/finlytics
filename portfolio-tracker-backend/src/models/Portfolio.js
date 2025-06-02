const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    currency: { type: String, default: "INR", uppercase: true },
    totalValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGainLoss: {
      type: Number,
      default: 0,
    },
    totalGainLossPercentage: {
      type: Number,
      default: 0,
    },
    assets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Asset",
      },
    ],
    performance: {
      daily: {
        value: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
      weekly: {
        value: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
      monthly: {
        value: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
      yearly: {
        value: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
    },
    history: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        totalValue: {
          type: Number,
          required: true,
        },
        totalCost: {
          type: Number,
          required: true,
        },
        gainLoss: {
          type: Number,
          required: true,
        },
        gainLossPercentage: {
          type: Number,
          required: true,
        },
      },
    ],
    settings: {
      autoRebalance: {
        type: Boolean,
        default: false,
      },
      riskLevel: {
        type: String,
        enum: ["conservative", "moderate", "aggressive"],
        default: "moderate",
      },
      rebalanceThreshold: {
        type: Number,
        default: 5,
        min: 1,
        max: 20,
      },
    },
    alerts: [
      {
        type: {
          type: String,
          enum: ["price_change", "percentage_change", "value_threshold"],
          required: true,
        },
        condition: {
          type: String,
          enum: ["above", "below"],
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
portfolioSchema.index({ userId: 1 });
portfolioSchema.index({ userId: 1, isDefault: 1 });
portfolioSchema.index({ userId: 1, isActive: 1 });
portfolioSchema.index({ "history.date": 1 });

// Virtual for asset count
portfolioSchema.virtual("assetCount").get(function () {
  return this.assets ? this.assets.length : 0;
});

// Virtual for diversity score (simple calculation)
portfolioSchema.virtual("diversityScore").get(function () {
  if (!this.assets || this.assets.length === 0) return 0;

  // Simple diversity score based on number of assets
  // More sophisticated calculation would consider asset types, sectors, etc.
  const assetCount = this.assets.length;
  if (assetCount <= 1) return 20;
  if (assetCount <= 3) return 40;
  if (assetCount <= 5) return 60;
  if (assetCount <= 10) return 80;
  return 100;
});

// Method to calculate portfolio metrics
portfolioSchema.methods.calculateMetrics = function () {
  if (!this.totalCost || this.totalCost === 0) {
    this.totalGainLoss = 0;
    this.totalGainLossPercentage = 0;
  } else {
    this.totalGainLoss = this.totalValue - this.totalCost;
    this.totalGainLossPercentage =
      ((this.totalValue - this.totalCost) / this.totalCost) * 100;
  }
};

// Method to add history entry
portfolioSchema.methods.addHistoryEntry = function () {
  // Only add if values have changed or it's been more than 24 hours
  const lastEntry = this.history[this.history.length - 1];
  const now = new Date();

  if (
    !lastEntry ||
    lastEntry.totalValue !== this.totalValue ||
    now - lastEntry.date > 24 * 60 * 60 * 1000
  ) {
    this.history.push({
      date: now,
      totalValue: this.totalValue,
      totalCost: this.totalCost,
      gainLoss: this.totalGainLoss,
      gainLossPercentage: this.totalGainLossPercentage,
    });

    // Keep only last 90 days for free version
    const daysToKeep = 90;
    const cutoffDate = new Date(
      now.getTime() - daysToKeep * 24 * 60 * 60 * 1000
    );
    this.history = this.history.filter((entry) => entry.date >= cutoffDate);
  }
};

// Method to update performance metrics
portfolioSchema.methods.updatePerformance = function () {
  if (this.history.length < 2) return;

  const current = this.history[this.history.length - 1];
  const now = new Date();

  // Daily performance (compare with yesterday)
  const yesterday = this.history.find((entry) => {
    const daysDiff = (now - entry.date) / (1000 * 60 * 60 * 24);
    return daysDiff >= 0.8 && daysDiff <= 1.2;
  });

  if (yesterday) {
    this.performance.daily.value = current.totalValue - yesterday.totalValue;
    this.performance.daily.percentage =
      yesterday.totalValue > 0
        ? ((current.totalValue - yesterday.totalValue) / yesterday.totalValue) *
          100
        : 0;
  }

  // Weekly performance
  const weekAgo = this.history.find((entry) => {
    const daysDiff = (now - entry.date) / (1000 * 60 * 60 * 24);
    return daysDiff >= 6 && daysDiff <= 8;
  });

  if (weekAgo) {
    this.performance.weekly.value = current.totalValue - weekAgo.totalValue;
    this.performance.weekly.percentage =
      weekAgo.totalValue > 0
        ? ((current.totalValue - weekAgo.totalValue) / weekAgo.totalValue) * 100
        : 0;
  }

  // Monthly performance
  const monthAgo = this.history.find((entry) => {
    const daysDiff = (now - entry.date) / (1000 * 60 * 60 * 24);
    return daysDiff >= 28 && daysDiff <= 32;
  });

  if (monthAgo) {
    this.performance.monthly.value = current.totalValue - monthAgo.totalValue;
    this.performance.monthly.percentage =
      monthAgo.totalValue > 0
        ? ((current.totalValue - monthAgo.totalValue) / monthAgo.totalValue) *
          100
        : 0;
  }

  // Yearly performance
  const yearAgo = this.history.find((entry) => {
    const daysDiff = (now - entry.date) / (1000 * 60 * 60 * 24);
    return daysDiff >= 360 && daysDiff <= 370;
  });

  if (yearAgo) {
    this.performance.yearly.value = current.totalValue - yearAgo.totalValue;
    this.performance.yearly.percentage =
      yearAgo.totalValue > 0
        ? ((current.totalValue - yearAgo.totalValue) / yearAgo.totalValue) * 100
        : 0;
  }
};

// Pre-save middleware
portfolioSchema.pre("save", function (next) {
  this.calculateMetrics();
  next();
});

module.exports = mongoose.model("Portfolio", portfolioSchema);
