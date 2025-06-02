// Enhanced debug script to get detailed error information
const axios = require("axios");
require("dotenv").config();

console.log("🔍 Getting Detailed Error Information from Indian Stock API");
console.log("=======================================================");

async function getDetailedErrors() {
  const API_KEY = process.env.INDIAN_STOCK_API_KEY;
  const axiosInstance = axios.create({
    baseURL: "https://stock.indianapi.in",
    headers: {
      "X-Api-Key": API_KEY,
    },
  });

  console.log("\n📋 Testing Historical Data Endpoint:");
  try {
    const response = await axiosInstance.get("/historical_data", {
      params: { name: "RELIANCE", period: "1m" },
    });
    console.log("✅ SUCCESS");
  } catch (error) {
    console.log("❌ FAILED - Status:", error.response?.status);
    console.log("Full error details:");
    console.log(JSON.stringify(error.response?.data, null, 2));
  }

  console.log("\n📋 Testing Stock Forecasts Endpoint:");
  try {
    const response = await axiosInstance.get("/stock_forecasts", {
      params: { name: "RELIANCE" },
    });
    console.log("✅ SUCCESS");
  } catch (error) {
    console.log("❌ FAILED - Status:", error.response?.status);
    console.log("Full error details:");
    console.log(JSON.stringify(error.response?.data, null, 2));
  }

  // Let's also try different endpoint paths in case we have the wrong URLs
  console.log("\n🔍 Testing Alternative Endpoint Paths:");

  const alternativeEndpoints = [
    "/historical",
    "/history",
    "/historical-data",
    "/data/historical",
    "/stock/historical",
    "/forecast",
    "/forecasts",
    "/stock-forecast",
    "/stock/forecast",
    "/prediction",
    "/predictions",
  ];

  for (const endpoint of alternativeEndpoints) {
    try {
      const response = await axiosInstance.get(endpoint, {
        params: { name: "RELIANCE" },
      });
      console.log(`✅ ${endpoint} - SUCCESS - Status: ${response.status}`);
    } catch (error) {
      console.log(
        `❌ ${endpoint} - FAILED - Status: ${error.response?.status}`
      );
    }
    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log("\n🎯 Detailed error analysis completed!");
}

getDetailedErrors().catch(console.error);
