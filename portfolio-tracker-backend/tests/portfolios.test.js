const request = require("supertest");
const app = require("../server");
const User = require("../src/models/User");
const Portfolio = require("../src/models/Portfolio");
const Asset = require("../src/models/Asset");
const { connectDB, disconnectDB, getAuthToken } = require("./helpers/testDb");

describe("Portfolio Endpoints", () => {
  let authToken;
  let userId;
  let assetId;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await Asset.deleteMany({});

    // Create test user and get auth token
    const { token, user } = await getAuthToken();
    authToken = token;
    userId = user._id;

    // Create test asset
    const asset = new Asset({
      symbol: "RELIANCE",
      name: "Reliance Industries Ltd.",
      type: "stock",
      currentPrice: 2450.0,
    });
    await asset.save();
    assetId = asset._id;
  });
  describe("POST /api/v1/portfolios", () => {
    it("should create a new portfolio successfully", async () => {
      const portfolioData = {
        name: "My Test Portfolio",
        description: "Test portfolio for unit tests",
      };

      const response = await request(app)
        .post("/api/v1/portfolios")
        .set("Authorization", `Bearer ${authToken}`)
        .send(portfolioData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.portfolio.name).toBe(portfolioData.name);
      expect(response.body.portfolio.userId.toString()).toBe(userId.toString());
    });

    it("should fail without authentication", async () => {
      const portfolioData = {
        name: "My Test Portfolio",
        description: "Test portfolio for unit tests",
      };

      const response = await request(app)
        .post("/api/v1/portfolios")
        .send(portfolioData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should fail with invalid data", async () => {
      const portfolioData = {
        description: "Test portfolio without name",
      };

      const response = await request(app)
        .post("/api/v1/portfolios")
        .set("Authorization", `Bearer ${authToken}`)
        .send(portfolioData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("GET /api/v1/portfolios", () => {
    beforeEach(async () => {
      // Create test portfolios
      const portfolio1 = new Portfolio({
        name: "Portfolio 1",
        description: "First test portfolio",
        userId: userId,
      });
      const portfolio2 = new Portfolio({
        name: "Portfolio 2",
        description: "Second test portfolio",
        userId: userId,
      });
      await Promise.all([portfolio1.save(), portfolio2.save()]);
    });

    it("should get user portfolios successfully", async () => {
      const response = await request(app)
        .get("/api/v1/portfolios")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.portfolios).toHaveLength(2);
      expect(response.body.portfolios[0].name).toBeDefined();
    });

    it("should fail without authentication", async () => {
      const response = await request(app).get("/api/v1/portfolios").expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/portfolios/:id/assets", () => {
    let portfolioId;

    beforeEach(async () => {
      const portfolio = new Portfolio({
        name: "Test Portfolio",
        description: "Portfolio for adding assets",
        userId: userId,
      });
      await portfolio.save();
      portfolioId = portfolio._id;
    });

    it("should add asset to portfolio successfully", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: 145.0,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.portfolio.assets).toHaveLength(1);
      expect(response.body.portfolio.assets[0].quantity).toBe(10);
    });

    it("should fail with invalid portfolio ID", async () => {
      const assetData = {
        assetId: assetId,
        quantity: 10,
        purchasePrice: 145.0,
      };

      const response = await request(app)
        .post("/api/v1/portfolios/invalidid/assets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should fail with invalid asset data", async () => {
      const assetData = {
        assetId: assetId,
        quantity: -10, // Invalid negative quantity
        purchasePrice: 145.0,
      };

      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(assetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("GET /api/v1/portfolios/:id/performance", () => {
    let portfolioId;

    beforeEach(async () => {
      const portfolio = new Portfolio({
        name: "Test Portfolio",
        description: "Portfolio for performance testing",
        userId: userId,
        assets: [assetId], // Just the ObjectId reference
        totalValue: 1500.0,
      });
      await portfolio.save();
      portfolioId = portfolio._id;
    });

    it("should get portfolio performance successfully", async () => {
      const response = await request(app)
        .get(`/api/v1/portfolios/${portfolioId}/performance`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.performance).toBeDefined();
      expect(response.body.performance.totalValue).toBeDefined();
      expect(response.body.performance.totalGainLoss).toBeDefined();
    });

    it("should fail for non-existent portfolio", async () => {
      const response = await request(app)
        .get("/api/v1/portfolios/507f1f77bcf86cd799439011/performance")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/portfolios/:id", () => {
    let portfolioId;

    beforeEach(async () => {
      const portfolio = new Portfolio({
        name: "Test Portfolio",
        description: "Portfolio to be deleted",
        userId: userId,
      });
      await portfolio.save();
      portfolioId = portfolio._id;
    });

    it("should delete portfolio successfully", async () => {
      const response = await request(app)
        .delete(`/api/v1/portfolios/${portfolioId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted");

      // Verify portfolio is deleted
      const deletedPortfolio = await Portfolio.findById(portfolioId);
      expect(deletedPortfolio).toBeNull();
    });

    it("should fail to delete another user's portfolio", async () => {
      // Create another user and their portfolio
      const otherUser = new User({
        name: "Other User",
        email: "other@example.com",
        password: "Password123!",
        emailVerified: true,
      });
      await otherUser.save();

      const otherPortfolio = new Portfolio({
        name: "Other Portfolio",
        description: "Portfolio belonging to other user",
        userId: otherUser._id,
      });
      await otherPortfolio.save();

      const response = await request(app)
        .delete(`/api/v1/portfolios/${otherPortfolio._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
