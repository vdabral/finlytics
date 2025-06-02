const request = require("supertest");
const app = require("../server");
const User = require("../src/models/User");
const Portfolio = require("../src/models/Portfolio");
const Asset = require("../src/models/Asset");
const Transaction = require("../src/models/Transaction");
const { connectDB, disconnectDB, getAuthToken } = require("./helpers/testDb");

describe("Transaction Tests", () => {
  let authToken;
  let userId;
  let portfolioId;
  let assetId;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    // Clean up all collections
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await Asset.deleteMany({});
    await Transaction.deleteMany({});

    // Create test user and get auth token
    const { token, user } = await getAuthToken();
    authToken = token;
    userId = user._id;

    // Create test asset
    const testAsset = new Asset({
      symbol: "RELIANCE",
      name: "Reliance Industries Ltd.",
      type: "stock",
      currentPrice: 2450.0,
      currency: "INR",
    });
    await testAsset.save();
    assetId = testAsset._id;

    // Create test portfolio
    const testPortfolio = new Portfolio({
      name: "Test Portfolio",
      description: "Portfolio for transaction testing",
      userId: userId,
      currency: "INR",
    });
    await testPortfolio.save();
    portfolioId = testPortfolio._id;
  });

  describe("Transaction Creation via Asset Addition", () => {
    it("should create a transaction when adding an asset to portfolio", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: 2400.0,
      };      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify transaction was created
      const transactions = await Transaction.find({
        portfolioId: portfolioId,
        userId: userId,
      });

      expect(transactions).toHaveLength(1);
      const transaction = transactions[0];
      expect(transaction.type).toBe("buy");
      expect(transaction.symbol).toBe("RELIANCE");
      expect(transaction.quantity).toBe(10);
      expect(transaction.price).toBe(2400.0);
    });

    it("should validate required fields for asset addition", async () => {
      const assetData = {
        // Missing required fields
        quantity: 10,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Transaction Validation", () => {
    it("should create a valid transaction model", async () => {
      const transactionData = {
        type: "buy",
        assetId: assetId,
        portfolioId: portfolioId,
        userId: userId,
        symbol: "RELIANCE",
        quantity: 10,
        price: 2400.0,
        totalAmount: 24000.0,
      };

      const transaction = new Transaction(transactionData);
      await transaction.save();

      expect(transaction._id).toBeDefined();
      expect(transaction.type).toBe("buy");
      expect(transaction.symbol).toBe("RELIANCE");
    });

    it("should fail with invalid transaction type", async () => {
      const transactionData = {
        type: "invalid_type",
        assetId: assetId,
        portfolioId: portfolioId,
        userId: userId,
        symbol: "RELIANCE",
        quantity: 10,
        price: 2400.0,
        totalAmount: 24000.0,
      };

      const transaction = new Transaction(transactionData);
      
      await expect(transaction.save()).rejects.toThrow();
    });
  });
});
