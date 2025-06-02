const request = require("supertest");
const app = require("../../server");

describe("External API Integration", () => {
  it("should return market data for RELIANCE from Indian Stock API endpoint", async () => {
    const res = await request(app)
      .get("/api/v1/market/price/RELIANCE")
      .expect(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("symbol");
    expect(res.body.data).toHaveProperty("price");
  }, 45000); // Increase timeout to 45 seconds for external API calls
});
