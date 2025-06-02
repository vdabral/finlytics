const request = require("supertest");
const app = require("../server");
const Asset = require("../src/models/Asset");
const { connectDB, disconnectDB, getAuthToken } = require("./helpers/testDb");

describe("Asset Endpoints", () => {
  let authToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await Asset.deleteMany({});

    const { token } = await getAuthToken();
    authToken = token;

    // Create test assets
    const testAssets = [
      {
        symbol: "RELIANCE",
        name: "Reliance Industries Ltd.",
        type: "stock",
        currentPrice: 2450.0,
        sector: "Energy",
      },
      {
        symbol: "TCS",
        name: "Tata Consultancy Services Ltd.",
        type: "stock",
        currentPrice: 3200.0,
        sector: "Technology",
      },
      {
        symbol: "INFY",
        name: "Infosys Ltd.",
        type: "stock",
        currentPrice: 1450.0,
        sector: "Technology",
      },
    ];

    await Asset.insertMany(testAssets);
  });

  describe("GET /api/v1/assets/search", () => {
    it("should search assets by symbol successfully", async () => {
      const response = await request(app)
        .get("/api/v1/assets/search?query=RELIANCE")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.assets).toHaveLength(1);
      expect(response.body.assets[0].symbol).toBe("RELIANCE");
    });

    it("should search assets by name successfully", async () => {
      const response = await request(app)
        .get("/api/v1/assets/search?query=Reliance")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.assets.length).toBeGreaterThan(0);
      expect(response.body.assets[0].name).toContain("Reliance");
    });

    it("should return empty results for non-existent asset", async () => {
      const response = await request(app)
        .get("/api/v1/assets/search?query=NONEXISTENT")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.assets).toHaveLength(0);
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/assets/search?query=RELIANCE")
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should fail without query parameter", async () => {
      const response = await request(app)
        .get("/api/v1/assets/search")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("GET /api/v1/assets/trending", () => {
    it("should get trending assets successfully", async () => {
      const response = await request(app)
        .get("/api/v1/assets/trending")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.assets).toBeDefined();
      expect(Array.isArray(response.body.assets)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const response = await request(app)
        .get("/api/v1/assets/trending?limit=2")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.assets.length).toBeLessThanOrEqual(2);
    });
  });

  describe("GET /api/v1/assets/:symbol", () => {
    it("should get asset details successfully", async () => {
      const response = await request(app)
        .get("/api/v1/assets/RELIANCE")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.symbol).toBe("RELIANCE");
      expect(response.body.data.name).toBe("Reliance Industries Ltd.");
    });

    it("should fail for non-existent asset", async () => {
      const response = await request(app)
        .get("/api/v1/assets/NONEXISTENT")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("GET /api/v1/assets/:symbol/price-history", () => {
    beforeEach(async () => {
      // Add price history to RELIANCE asset
      const asset = await Asset.findOne({ symbol: "RELIANCE" });
      asset.priceHistory = [
        { date: new Date("2023-01-01"), price: 2400.0 },
        { date: new Date("2023-01-02"), price: 2425.0 },
        { date: new Date("2023-01-03"), price: 2450.0 },
      ];
      await asset.save();
    });

    it("should get price history successfully", async () => {
      const response = await request(app)
        .get("/api/v1/assets/RELIANCE/price-history")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.priceHistory).toBeDefined();
      expect(Array.isArray(response.body.priceHistory)).toBe(true);
      expect(response.body.priceHistory.length).toBeGreaterThan(0);
    });

    it("should respect date range parameters", async () => {
      const response = await request(app)
        .get(
          "/api/v1/assets/RELIANCE/price-history?startDate=2023-01-01&endDate=2023-01-02"
        )
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.priceHistory.length).toBeLessThanOrEqual(2);
    });

    it("should fail for non-existent asset", async () => {
      const response = await request(app)
        .get("/api/v1/assets/FAKE123/price-history")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/assets/:symbol/company-overview", () => {
    it("should get company overview successfully", async () => {
      const response = await request(app)
        .get("/api/v1/assets/RELIANCE/company-overview")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.overview).toBeDefined();
    });

    it("should handle API rate limiting gracefully", async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 3 }, () =>
        request(app)
          .get("/api/v1/assets/RELIANCE/company-overview")
          .set("Authorization", `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      // At least one should succeed, others might be rate limited
      const successfulResponses = responses.filter((r) => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });
});
