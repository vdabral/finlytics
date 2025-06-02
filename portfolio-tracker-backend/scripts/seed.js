// Database seeding script for development environment

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import models
const User = require("../src/models/User");
const Portfolio = require("../src/models/Portfolio");
const Asset = require("../src/models/Asset");
const Transaction = require("../src/models/Transaction");

class DatabaseSeeder {
  async connect() {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/portfolio_tracker"
      );
      console.log("Connected to MongoDB for seeding");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
  }

  async clearDatabase() {
    console.log("Clearing existing data...");
    await Promise.all([
      Transaction.deleteMany({}),
      Portfolio.deleteMany({}),
      Asset.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log("✓ Database cleared");
  }
  async seedAssets() {
    console.log("Seeding assets...");

    const assets = [
      {
        symbol: "RELIANCE",
        name: "Reliance Industries Ltd.",
        type: "stock",
        exchange: "NSE",
        currency: "INR",
        sector: "Energy",
        description:
          "Largest private sector corporation in India engaged in petrochemicals, oil & gas",
      },
      {
        symbol: "TCS",
        name: "Tata Consultancy Services Ltd.",
        type: "stock",
        exchange: "NSE",
        currency: "INR",
        sector: "Information Technology",
        description:
          "Leading global IT services, consulting and business solutions organization",
      },
      {
        symbol: "HDFCBANK",
        name: "HDFC Bank Ltd.",
        type: "stock",
        exchange: "NSE",
        currency: "INR",
        sector: "Financial Services",
        description:
          "Leading private sector bank in India offering wide range of banking services",
      },
      {
        symbol: "INFY",
        name: "Infosys Ltd.",
        type: "stock",
        exchange: "NSE",
        currency: "INR",
        sector: "Information Technology",
        description:
          "Global leader in next-generation digital services and consulting",
      },
      {
        symbol: "ICICIBANK",
        name: "ICICI Bank Ltd.",
        type: "stock",
        exchange: "NSE",
        currency: "INR",
        sector: "Financial Services",
        description:
          "Leading private sector bank providing comprehensive banking services",
      },
      {
        symbol: "BTC-USD",
        name: "Bitcoin",
        type: "crypto",
        exchange: "Crypto",
        currency: "USD",
        sector: "Cryptocurrency",
        description: "Decentralized digital currency",
      },
      {
        symbol: "ETH-USD",
        name: "Ethereum",
        type: "crypto",
        exchange: "Crypto",
        currency: "USD",
        sector: "Cryptocurrency",
        description: "Decentralized platform for smart contracts",
      },
      {
        symbol: "GOLDBEES",
        name: "Nippon India ETF Gold BeES",
        type: "etf",
        exchange: "NSE",
        currency: "INR",
        sector: "Commodities",
        description: "Gold exchange-traded fund tracking domestic gold prices",
      },
    ];

    await Asset.insertMany(assets);
    console.log(`✓ ${assets.length} assets seeded`);
    return assets;
  }

  async seedUsers() {
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
        email: "investor@example.com",
        password: hashedPassword,
        profile: {
          firstName: "Jane",
          lastName: "Investor",
          phone: "+91-8765432109",
          country: "India",
        },
        isEmailVerified: true,
        settings: {
          notifications: {
            email: true,
            push: true,
            priceAlerts: true,
            portfolioSummary: true,
          },
          dashboard: {
            theme: "dark",
            currency: "INR",
            language: "en",
          },
          privacy: {
            profileVisible: true,
            sharePortfolio: false,
          },
          timezone: "Asia/Mumbai",
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
    return createdUsers;
  }

  async seedPortfolios(users, assets) {
    console.log("Seeding portfolios...");
    const portfolios = [
      {
        name: "Tech Growth Portfolio",
        description: "Indian technology stocks for long-term growth",
        userId: users[0]._id,
        currency: "INR",
        holdings: [
          {
            assetId: assets.find((a) => a.symbol === "TCS")._id,
            quantity: 10,
            averagePrice: 3500.0,
            currentPrice: 3750.0,
          },
          {
            assetId: assets.find((a) => a.symbol === "INFY")._id,
            quantity: 15,
            averagePrice: 1650.0,
            currentPrice: 1750.0,
          },
          {
            assetId: assets.find((a) => a.symbol === "RELIANCE")._id,
            quantity: 8,
            averagePrice: 2400.0,
            currentPrice: 2550.0,
          },
        ],
      },
      {
        name: "Diversified Portfolio",
        description: "Mixed Indian assets for balanced growth",
        userId: users[1]._id,
        currency: "INR",
        holdings: [
          {
            assetId: assets.find((a) => a.symbol === "HDFCBANK")._id,
            quantity: 15,
            averagePrice: 1500.0,
            currentPrice: 1600.0,
          },
          {
            assetId: assets.find((a) => a.symbol === "RELIANCE")._id,
            quantity: 5,
            averagePrice: 2400.0,
            currentPrice: 2550.0,
          },
          {
            assetId: assets.find((a) => a.symbol === "GOLDBEES")._id,
            quantity: 50,
            averagePrice: 45.0,
            currentPrice: 47.0,
          },
          {
            assetId: assets.find((a) => a.symbol === "BTC-USD")._id,
            quantity: 0.5,
            averagePrice: 45000.0,
            currentPrice: 50000.0,
          },
        ],
      },
      {
        name: "Crypto Holdings",
        description: "Cryptocurrency investments",
        userId: users[0]._id,
        holdings: [
          {
            assetId: assets.find((a) => a.symbol === "BTC-USD")._id,
            quantity: 1.5,
            averagePrice: 40000.0,
            currentPrice: 50000.0,
          },
          {
            assetId: assets.find((a) => a.symbol === "ETH-USD")._id,
            quantity: 10,
            averagePrice: 2500.0,
            currentPrice: 3000.0,
          },
        ],
      },
    ];

    const createdPortfolios = await Portfolio.insertMany(portfolios);
    console.log(`✓ ${portfolios.length} portfolios seeded`);
    return createdPortfolios;
  }
  async seedTransactions(users, portfolios, assets) {
    console.log("Seeding transactions...");

    const transactions = [      // Tech Growth Portfolio transactions
      {
        userId: users[0]._id,
        portfolioId: portfolios[0]._id,
        assetId: assets.find((a) => a.symbol === "TCS")._id,
        symbol: "TCS",
        type: "buy",
        quantity: 10,
        price: 3500.0,
        totalAmount: 35000.0,
        fees: 99.99,
        date: new Date("2024-01-15"),
        notes: "Initial TCS investment",
      },
      {
        userId: users[0]._id,
        portfolioId: portfolios[0]._id,
        assetId: assets.find((a) => a.symbol === "INFY")._id,
        symbol: "INFY",
        type: "buy",
        quantity: 15,
        price: 1650.0,
        totalAmount: 24750.0,
        fees: 99.99,
        date: new Date("2024-01-20"),
        notes: "Infosys investment",
      },
      {
        userId: users[0]._id,
        portfolioId: portfolios[0]._id,
        assetId: assets.find((a) => a.symbol === "RELIANCE")._id,
        symbol: "RELIANCE",
        type: "buy",
        quantity: 8,
        price: 2400.0,
        totalAmount: 19200.0,
        fees: 99.99,
        date: new Date("2024-02-01"),
        notes: "Reliance Industries investment",
      },
      // Diversified Portfolio transactions
      {
        userId: users[1]._id,
        portfolioId: portfolios[1]._id,
        assetId: assets.find((a) => a.symbol === "HDFCBANK")._id,
        symbol: "HDFCBANK",
        type: "buy",
        quantity: 15,
        price: 1500.0,
        totalAmount: 22500.0,
        fees: 99.99,
        date: new Date("2024-01-10"),
        notes: "HDFC Bank investment for diversified portfolio",
      },
      {
        userId: users[1]._id,
        portfolioId: portfolios[1]._id,
        assetId: assets.find((a) => a.symbol === "RELIANCE")._id,
        symbol: "RELIANCE",
        type: "buy",
        quantity: 5,
        price: 2400.0,
        totalAmount: 12000.0,
        fees: 99.99,
        date: new Date("2024-01-25"),
        notes: "Reliance Industries investment",
      },
      {
        userId: users[1]._id,
        portfolioId: portfolios[1]._id,
        assetId: assets.find((a) => a.symbol === "GOLDBEES")._id,
        symbol: "GOLDBEES",
        type: "buy",
        quantity: 50,
        price: 45.0,
        totalAmount: 2250.0,
        fees: 25.99,
        date: new Date("2024-02-05"),
        notes: "Gold ETF for hedging",
      },
      // Crypto transactions
      {
        userId: users[0]._id,
        portfolioId: portfolios[2]._id,
        assetId: assets.find((a) => a.symbol === "BTC-USD")._id,
        symbol: "BTC-USD",
        type: "buy",
        quantity: 1.5,
        price: 40000.0,
        totalAmount: 60000.0,
        fees: 299.99,
        date: new Date("2024-01-05"),
        notes: "Bitcoin investment",
      },
      {
        userId: users[0]._id,
        portfolioId: portfolios[2]._id,
        assetId: assets.find((a) => a.symbol === "ETH-USD")._id,
        symbol: "ETH-USD",
        type: "buy",
        quantity: 10,
        price: 2500.0,
        totalAmount: 25000.0,
        fees: 149.99,
        date: new Date("2024-01-12"),
        notes: "Ethereum investment",
      },
    ];

    await Transaction.insertMany(transactions);
    console.log(`✓ ${transactions.length} transactions seeded`);
  }

  async seed() {
    try {
      await this.connect();

      // Clear existing data
      await this.clearDatabase();

      // Seed data in order
      const assets = await this.seedAssets();
      const users = await this.seedUsers();
      const portfolios = await this.seedPortfolios(users, assets);
      await this.seedTransactions(users, portfolios, assets);

      console.log("\n✅ Database seeding completed successfully!");
      console.log("\nDemo accounts:");
      console.log("- demo@example.com (password: password123)");
      console.log("- investor@example.com (password: password123)");
      console.log("- admin@example.com (password: password123) [Admin]");
    } catch (error) {
      console.error("Seeding failed:", error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Run seeding if called directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.seed();
}

module.exports = DatabaseSeeder;
