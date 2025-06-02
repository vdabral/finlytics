// Quick database seeding script with proper error handling

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import models
const User = require("../src/models/User");
const Portfolio = require("../src/models/Portfolio");
const Asset = require("../src/models/Asset");
const Transaction = require("../src/models/Transaction");

async function quickSeed() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/portfolio_tracker"
    );
    console.log("Connected to MongoDB for seeding");

    // Clear existing data
    console.log("Clearing existing data...");
    await Transaction.deleteMany({});
    await Portfolio.deleteMany({});
    await Asset.deleteMany({});
    await User.deleteMany({});
    console.log("✓ Database cleared");

    // Seed assets first
    console.log("Seeding assets...");
    const assets = [
      {
        symbol: "RELIANCE",
        name: "Reliance Industries Ltd.",
        type: "stock",
        exchange: "NSE",
        currency: "INR",
        sector: "Energy",
        description: "Largest private sector corporation in India",
      },
      {
        symbol: "TCS",
        name: "Tata Consultancy Services Ltd.",
        type: "stock",
        exchange: "NSE",
        currency: "INR",
        sector: "Information Technology",
        description: "Leading global IT services organization",
      },
      {
        symbol: "HDFCBANK",
        name: "HDFC Bank Ltd.",
        type: "stock",
        exchange: "NSE",
        currency: "INR",
        sector: "Financial Services",
        description: "Leading private sector bank in India",
      },
      {
        symbol: "INFY",
        name: "Infosys Ltd.",
        type: "stock",
        exchange: "NSE",
        currency: "INR",
        sector: "Information Technology",
        description: "Global leader in digital services and consulting",
      },
    ];

    const createdAssets = await Asset.insertMany(assets);
    console.log(`✓ ${assets.length} assets seeded`);

    // Seed users
    console.log("Seeding users...");
    const hashedPassword = await bcrypt.hash("password123", 12);

    const users = [
      {
        email: "demo@example.com",
        password: hashedPassword,
        profile: {
          firstName: "Demo",
          lastName: "User",
          phone: "+91-9876543210",
          country: "India",
        },
        isEmailVerified: true,
        settings: {
          notifications: {
            email: true,
            push: false,
            priceAlerts: true,
            portfolioSummary: true,
          },
          dashboard: {
            theme: "light",
            currency: "INR",
            language: "en",
          },
          privacy: {
            profileVisible: false,
            sharePortfolio: false,
          },
          timezone: "Asia/Kolkata",
        },
      },
      {
        email: "admin@example.com",
        password: hashedPassword,
        profile: {
          firstName: "Admin",
          lastName: "User",
          phone: "+91-5555555555",
          country: "India",
        },
        role: "admin",
        isEmailVerified: true,
        settings: {
          notifications: {
            email: true,
            push: true,
            priceAlerts: true,
            portfolioSummary: true,
          },
          dashboard: {
            theme: "light",
            currency: "INR",
            language: "en",
          },
          privacy: {
            profileVisible: false,
            sharePortfolio: false,
          },
          timezone: "Asia/Kolkata",
        },
      },
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✓ ${users.length} users seeded`);

    // Seed portfolios
    console.log("Seeding portfolios...");
    const portfolios = [
      {
        name: "Tech Growth Portfolio",
        description: "Indian technology stocks for long-term growth",
        userId: createdUsers[0]._id,
        currency: "INR",
        holdings: [
          {
            assetId: createdAssets.find((a) => a.symbol === "TCS")._id,
            quantity: 10,
            averagePrice: 3500.0,
            currentPrice: 3750.0,
          },
        ],
      },
    ];

    const createdPortfolios = await Portfolio.insertMany(portfolios);
    console.log(`✓ ${portfolios.length} portfolios seeded`);

    // Seed transactions
    console.log("Seeding transactions...");
    const tcsAsset = createdAssets.find((a) => a.symbol === "TCS");
    if (!tcsAsset) {
      throw new Error("TCS asset not found");
    }

    const transactions = [
      {
        userId: createdUsers[0]._id,
        portfolioId: createdPortfolios[0]._id,
        assetId: tcsAsset._id,
        symbol: "TCS",
        type: "buy",
        quantity: 10,
        price: 3500.0,
        totalAmount: 35000.0,
        fees: 99.99,
        date: new Date("2024-01-15"),
        notes: "Initial TCS investment",
      },
    ];

    await Transaction.insertMany(transactions);
    console.log(`✓ ${transactions.length} transactions seeded`);

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\nDemo accounts:");
    console.log("- demo@example.com (password: password123)");
    console.log("- admin@example.com (password: password123) [Admin]");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  quickSeed();
}

module.exports = quickSeed;
