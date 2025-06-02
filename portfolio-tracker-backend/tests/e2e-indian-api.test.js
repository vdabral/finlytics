const request = require("supertest");
const app = require("../server");
const { connectDB, disconnectDB } = require("./helpers/testDb");

describe("End-to-End Indian Stock API Tests", () => {
  let authToken;
  beforeAll(async () => {
    await connectDB();

    // Register and login to get auth token
    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "e2etest@example.com",
        password: "TestPassword123!",
        firstName: "E2E",
        lastName: "Test",
      });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "e2etest@example.com",
      password: "TestPassword123!",
    });

    authToken = loginResponse.body.token;
  });
  afterAll(async () => {
    await disconnectDB();
  });

  describe("Indian Stock API Routes", () => {
    it("should get stock details for RELIANCE using company name", async () => {
      const response = await request(app)
        .get("/api/v1/indian-stocks/stock/RELIANCE")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.symbol).toBeDefined();
      expect(response.body.data.price).toBeDefined();
    });

    it("should get historical data for TCS using company name", async () => {
      const response = await request(app)
        .get("/api/v1/indian-stocks/historical/TCS")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should get forecasts for INFY using company name", async () => {
      const response = await request(app)
        .get("/api/v1/indian-stocks/forecasts/INFY")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it("should handle invalid company name gracefully", async () => {
      const response = await request(app)
        .get("/api/v1/indian-stocks/stock/INVALID_COMPANY")
        .set("Authorization", `Bearer ${authToken}`);

      // Should either return 404 or handle error gracefully
      expect([200, 404, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBeDefined();
      }
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/indian-stocks/stock/RELIANCE")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Asset Service Integration", () => {
    it("should get asset details with fallback to market data service", async () => {
      const response = await request(app)
        .get("/api/v1/assets/RELIANCE")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.symbol).toBe("RELIANCE");
    });
    it("should search for assets successfully", async () => {
      const response = await request(app)
        .get("/api/v1/assets/search?q=RELIANCE")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.assets)).toBe(true);
    });
  });

  describe("Portfolio Integration", () => {
    let portfolioId;

    it("should create portfolio successfully", async () => {
      const response = await request(app)
        .post("/api/v1/portfolios")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "E2E Test Portfolio",
          description: "Portfolio for end-to-end testing",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.portfolio).toBeDefined();
      portfolioId = response.body.portfolio._id;
    });

    it("should add Indian stock asset to portfolio", async () => {
      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/assets`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          symbol: "RELIANCE",
          quantity: 10,
          averagePrice: 2500,
          assetType: "stock",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.portfolio.assets).toHaveLength(1);
      expect(response.body.portfolio.assets[0].symbol).toBe("RELIANCE");
    });

    it("should get portfolio performance", async () => {
      const response = await request(app)
        .get(`/api/v1/portfolios/${portfolioId}/performance`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.performance).toBeDefined();
    });

    it("should cleanup - delete portfolio", async () => {
      await request(app)
        .delete(`/api/v1/portfolios/${portfolioId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
