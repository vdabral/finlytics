const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../../src/models/User");
const jwt = require("jsonwebtoken");

let mongoServer;

const connectDB = async () => {
  try {
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Test database connected");
  } catch (error) {
    console.error("Test database connection failed:", error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log("Test database disconnected");
  } catch (error) {
    console.error("Test database disconnection failed:", error);
  }
};

const getAuthToken = async (userData = {}) => {
  const timestamp = Date.now();
  const defaultUserData = {
    firstName: "Test",
    lastName: "User",
    email: userData.email || `test-${timestamp}@example.com`,
    password: "Password123!",
    isEmailVerified: true,
    ...userData,
  };

  const user = new User(defaultUserData);
  await user.save();

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" }
  );

  return { token, user };
};

const createTestAsset = async (assetData = {}) => {
  const Asset = require("../../src/models/Asset");

  const defaultAssetData = {
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "stock",
    currentPrice: 150.0,
    ...assetData,
  };

  const asset = new Asset(defaultAssetData);
  await asset.save();
  return asset;
};

const createTestPortfolio = async (userId, portfolioData = {}) => {
  const Portfolio = require("../../src/models/Portfolio");

  const defaultPortfolioData = {
    name: "Test Portfolio",
    description: "Test portfolio for unit tests",
    userId: userId,
    ...portfolioData,
  };

  const portfolio = new Portfolio(defaultPortfolioData);
  await portfolio.save();
  return portfolio;
};

const cleanupCollections = async (...collections) => {
  for (const collection of collections) {
    await collection.deleteMany({});
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getAuthToken,
  createTestAsset,
  createTestPortfolio,
  cleanupCollections,
};
