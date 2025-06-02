const request = require("supertest");
const app = require("../server");
const User = require("../src/models/User");
const Portfolio = require("../src/models/Portfolio");
const Asset = require("../src/models/Asset");
const Transaction = require("../src/models/Transaction");
const { connectDB, disconnectDB, getAuthToken } = require("./helpers/testDb");

describe("Comprehensive Transaction Tests", () => {
  let authToken;
  let userId;
  let portfolioId;
  let assetId;
  let testAsset;
  let testPortfolio;

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
    testAsset = new Asset({
      symbol: "RELIANCE",
      name: "Reliance Industries Ltd.",
      type: "stock",
      currentPrice: 2450.0,
      currency: "INR",
    });
    await testAsset.save();
    assetId = testAsset._id;

    // Create test portfolio
    testPortfolio = new Portfolio({
      name: "Test Portfolio",
      description: "Portfolio for transaction testing",
      userId: userId,
      currency: "INR",
    });
    await testPortfolio.save();
    portfolioId = testPortfolio._id;
  });

  describe("Asset Addition with Transaction Creation", () => {
    it("should create a transaction when adding an asset to portfolio", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: 2400.0,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);      expect(response.body.success).toBe(true);
      expect(response.body.portfolio).toBeDefined();

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
      expect(transaction.totalAmount).toBe(24000.0);
      expect(transaction.assetId.toString()).toBe(assetId.toString());
      expect(transaction.portfolioId.toString()).toBe(portfolioId.toString());
      expect(transaction.userId.toString()).toBe(userId.toString());
    });

    it("should create transaction with fees when specified", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 5,
        purchasePrice: 2500.0,
        fees: 25.0,
      };

      await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      const transaction = await Transaction.findOne({
        portfolioId: portfolioId,
        userId: userId,
      });

      expect(transaction.fees).toBe(25.0);
      expect(transaction.totalAmount).toBe(12500.0); // quantity * price
    });

    it("should create transaction using asset symbol instead of assetId", async () => {
      const assetData = {
        symbol: "RELIANCE",
        quantity: 8,
        purchasePrice: 2300.0,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      expect(response.body.success).toBe(true);

      const transaction = await Transaction.findOne({
        portfolioId: portfolioId,
        userId: userId,
      });

      expect(transaction.symbol).toBe("RELIANCE");
      expect(transaction.quantity).toBe(8);
      expect(transaction.price).toBe(2300.0);
    });

    it("should fail when both assetId and symbol are provided", async () => {
      const assetData = {
        assetId: assetId,
        symbol: "RELIANCE",
        quantity: 10,
        purchasePrice: 2400.0,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].msg).toContain("Provide either assetId or symbol, not both");
    });

    it("should fail when neither assetId nor symbol are provided", async () => {
      const assetData = {
        quantity: 10,
        purchasePrice: 2400.0,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].msg).toContain("Either assetId or symbol is required");
    });

    it("should fail with negative quantity", async () => {
      const assetData = {
        assetId: assetId,
        quantity: -5,
        purchasePrice: 2400.0,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].msg).toContain("Quantity must be a positive number");
    });

    it("should fail with negative price", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: -2400.0,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].msg).toContain("Purchase price or average price must be a positive number");
    });

    it("should fail with zero quantity", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 0,
        purchasePrice: 2400.0,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].msg).toContain("Quantity must be a positive number");
    });

    it("should fail with invalid portfolio ID", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: 2400.0,
      };

      const invalidPortfolioId = "60f7b0b3b3f3f3f3f3f3f3f3";

      const response = await request(app)
        .post(`/api/v1/portfolios/${invalidPortfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Portfolio not found");
    });
  });

  describe("GET /api/v1/portfolios/:id/transactions", () => {
    beforeEach(async () => {
      // Create multiple transactions for testing
      const transactions = [
        {
          type: "buy",
          assetId: assetId,
          portfolioId: portfolioId,
          userId: userId,
          symbol: "RELIANCE",
          quantity: 10,
          price: 2400.0,
          totalAmount: 24000.0,
          fees: 10.0,
          date: new Date("2024-01-01"),
        },
        {
          type: "buy",
          assetId: assetId,
          portfolioId: portfolioId,
          userId: userId,
          symbol: "RELIANCE",
          quantity: 5,
          price: 2450.0,
          totalAmount: 12250.0,
          fees: 5.0,
          date: new Date("2024-01-15"),
        },
        {
          type: "sell",
          assetId: assetId,
          portfolioId: portfolioId,
          userId: userId,
          symbol: "RELIANCE",
          quantity: 3,
          price: 2500.0,
          totalAmount: 7500.0,
          fees: 7.5,
          date: new Date("2024-01-30"),
        },
      ];

      await Transaction.insertMany(transactions);
    });

    it("should retrieve portfolio transactions successfully", async () => {
      const response = await request(app)
        .get(`/api/v1/portfolios/${portfolioId}/transactions`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(3);
      expect(response.body.data.totalPages).toBe(1);
      expect(response.body.data.currentPage).toBe(1);
      expect(response.body.data.total).toBe(3);

      // Check if transactions are sorted by date (newest first)
      const transactions = response.body.data.transactions;
      expect(new Date(transactions[0].date)).toBeInstanceOf(Date);
      expect(new Date(transactions[0].date) >= new Date(transactions[1].date)).toBe(true);
    });

    it("should filter transactions by type", async () => {
      const response = await request(app)
        .get(`/api/v1/portfolios/${portfolioId}/transactions?type=buy`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.transactions.every(t => t.type === "buy")).toBe(true);
    });    it("should filter transactions by asset", async () => {
      const response = await request(app)
        .get(`/api/v1/portfolios/${portfolioId}/transactions?assetId=${assetId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(3);
      expect(response.body.data.transactions.every(t => t.assetId._id.toString() === assetId.toString())).toBe(true);
    });

    it("should paginate transactions correctly", async () => {
      const response = await request(app)
        .get(`/api/v1/portfolios/${portfolioId}/transactions?page=1&limit=2`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.totalPages).toBe(2);
      expect(response.body.data.currentPage).toBe(1);
      expect(response.body.data.total).toBe(3);
    });

    it("should return empty array for invalid transaction type filter", async () => {
      const response = await request(app)
        .get(`/api/v1/portfolios/${portfolioId}/transactions?type=dividend`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(0);
    });

    it("should fail with invalid portfolio ID", async () => {
      const invalidPortfolioId = "60f7b0b3b3f3f3f3f3f3f3f3";

      const response = await request(app)
        .get(`/api/v1/portfolios/${invalidPortfolioId}/transactions`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Portfolio not found");
    });

    it("should fail without authentication", async () => {
      await request(app)
        .get(`/api/v1/portfolios/${portfolioId}/transactions`)
        .expect(401);
    });

    it("should fail with invalid transaction type in query", async () => {
      const response = await request(app)
        .get(`/api/v1/portfolios/${portfolioId}/transactions?type=invalid_type`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].msg).toContain("Invalid transaction type");
    });

    it("should return transactions for authorized user only", async () => {
      // Create another user and portfolio
      const otherUser = new User({
        email: "other@test.com",
        password: "hashedpassword123",
        firstName: "Other",
        lastName: "User",
      });
      await otherUser.save();

      const otherPortfolio = new Portfolio({
        name: "Other Portfolio",
        userId: otherUser._id,
      });
      await otherPortfolio.save();

      // Try to access other user's portfolio transactions
      const response = await request(app)
        .get(`/api/v1/portfolios/${otherPortfolio._id}/transactions`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Portfolio not found");
    });
  });

  describe("Transaction Model Validation", () => {
    it("should create a valid transaction", async () => {
      const transactionData = {
        type: "buy",
        assetId: assetId,
        portfolioId: portfolioId,
        userId: userId,
        symbol: "RELIANCE",
        quantity: 10,
        price: 2400.0,
        totalAmount: 24000.0,
        fees: 10.0,
        currency: "INR",
      };

      const transaction = new Transaction(transactionData);
      await transaction.save();

      expect(transaction._id).toBeDefined();
      expect(transaction.type).toBe("buy");
      expect(transaction.symbol).toBe("RELIANCE");
      expect(transaction.quantity).toBe(10);
      expect(transaction.price).toBe(2400.0);
      expect(transaction.totalAmount).toBe(24000.0);
      expect(transaction.currency).toBe("INR");
    });

    it("should fail validation for invalid transaction type", async () => {
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

    it("should fail validation for negative quantity", async () => {
      const transactionData = {
        type: "buy",
        assetId: assetId,
        portfolioId: portfolioId,
        userId: userId,
        symbol: "RELIANCE",
        quantity: -10,
        price: 2400.0,
        totalAmount: 24000.0,
      };

      const transaction = new Transaction(transactionData);
      
      await expect(transaction.save()).rejects.toThrow();
    });

    it("should fail validation for negative price", async () => {
      const transactionData = {
        type: "buy",
        assetId: assetId,
        portfolioId: portfolioId,
        userId: userId,
        symbol: "RELIANCE",
        quantity: 10,
        price: -2400.0,
        totalAmount: 24000.0,
      };

      const transaction = new Transaction(transactionData);
      
      await expect(transaction.save()).rejects.toThrow();
    });

    it("should fail validation for missing required fields", async () => {
      const transactionData = {
        type: "buy",
        // Missing required fields
        quantity: 10,
        price: 2400.0,
      };

      const transaction = new Transaction(transactionData);
      
      await expect(transaction.save()).rejects.toThrow();
    });

    it("should set default values correctly", async () => {
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

      expect(transaction.fees).toBe(0);
      expect(transaction.currency).toBe("INR");
      expect(transaction.date).toBeInstanceOf(Date);
    });

    it("should validate all transaction types", async () => {
      const types = ["buy", "sell", "dividend", "split", "merger"];
      
      for (const type of types) {
        const transactionData = {
          type: type,
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
        expect(transaction.type).toBe(type);
      }
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    it("should handle very small quantities", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 0.000001,
        purchasePrice: 2400.0,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      expect(response.body.success).toBe(true);

      const transaction = await Transaction.findOne({
        portfolioId: portfolioId,
        userId: userId,
      });

      expect(transaction.quantity).toBe(0.000001);
    });

    it("should handle very large quantities and prices", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 1000000,
        purchasePrice: 999999.99,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      expect(response.body.success).toBe(true);

      const transaction = await Transaction.findOne({
        portfolioId: portfolioId,
        userId: userId,
      });

      expect(transaction.quantity).toBe(1000000);
      expect(transaction.price).toBe(999999.99);
      expect(transaction.totalAmount).toBe(999999990000);
    });

    it("should handle decimal quantities correctly", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10.5,
        purchasePrice: 2400.5,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      expect(response.body.success).toBe(true);

      const transaction = await Transaction.findOne({
        portfolioId: portfolioId,
        userId: userId,
      });

      expect(transaction.quantity).toBe(10.5);
      expect(transaction.price).toBe(2400.5);
    });

    it("should handle special characters in notes", async () => {
      const transactionData = {
        type: "buy",
        assetId: assetId,
        portfolioId: portfolioId,
        userId: userId,
        symbol: "RELIANCE",
        quantity: 10,
        price: 2400.0,
        totalAmount: 24000.0,
        notes: "Special chars: @#$%^&*()_+{}|:<>?[]\\;'\",./-`~",
      };

      const transaction = new Transaction(transactionData);
      await transaction.save();

      expect(transaction.notes).toBe("Special chars: @#$%^&*()_+{}|:<>?[]\\;'\",./-`~");
    });

    it("should handle maximum length notes", async () => {
      const longNotes = "A".repeat(500);
      
      const transactionData = {
        type: "buy",
        assetId: assetId,
        portfolioId: portfolioId,
        userId: userId,
        symbol: "RELIANCE",
        quantity: 10,
        price: 2400.0,
        totalAmount: 24000.0,
        notes: longNotes,
      };

      const transaction = new Transaction(transactionData);
      await transaction.save();

      expect(transaction.notes).toBe(longNotes);
      expect(transaction.notes.length).toBe(500);
    });

    it("should handle concurrent asset additions properly", async () => {
      const assetData1 = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: 2400.0,
      };

      const assetData2 = {
        assetId: assetId,
        quantity: 5,
        purchasePrice: 2500.0,
      };

      // Execute concurrent requests
      const [response1, response2] = await Promise.all([
        request(app)
          .post(`/api/v1/portfolios/${portfolioId}/assets`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(assetData1),
        request(app)
          .post(`/api/v1/portfolios/${portfolioId}/assets`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(assetData2),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Both transactions should be created
      const transactions = await Transaction.find({
        portfolioId: portfolioId,
        userId: userId,
      });

      expect(transactions).toHaveLength(2);
    });
  });

  describe("Data Persistence and Integrity", () => {
    it("should maintain referential integrity with Portfolio", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: 2400.0,
      };

      await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      const transaction = await Transaction.findOne({
        portfolioId: portfolioId,
        userId: userId,
      }).populate("portfolioId");

      expect(transaction.portfolioId).toBeDefined();
      expect(transaction.portfolioId.name).toBe("Test Portfolio");
    });

    it("should maintain referential integrity with Asset", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: 2400.0,
      };

      await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      const transaction = await Transaction.findOne({
        portfolioId: portfolioId,
        userId: userId,
      }).populate("assetId");

      expect(transaction.assetId).toBeDefined();
      expect(transaction.assetId.symbol).toBe("RELIANCE");
    });

    it("should maintain referential integrity with User", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: 2400.0,
      };

      await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      const transaction = await Transaction.findOne({
        portfolioId: portfolioId,
        userId: userId,
      }).populate("userId");

      expect(transaction.userId).toBeDefined();
      expect(transaction.userId.email).toBeDefined();
    });

    it("should persist transaction data correctly after server restart simulation", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: 2400.0,
      };

      await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      // Simulate finding the data after restart
      const transaction = await Transaction.findOne({
        portfolioId: portfolioId,
        userId: userId,
      });

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe("buy");
      expect(transaction.quantity).toBe(10);
      expect(transaction.price).toBe(2400.0);
      expect(transaction.symbol).toBe("RELIANCE");
    });
  });
});
