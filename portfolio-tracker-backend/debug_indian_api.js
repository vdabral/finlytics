// Debug script to test different parameter combinations for Indian Stock API
const axios = require("axios");
require("dotenv").config();

console.log("🔍 Debugging Indian Stock API Parameter Requirements");
console.log("================================================");

async function debugApiEndpoints() {
  const API_KEY = process.env.INDIAN_STOCK_API_KEY;
  const axiosInstance = axios.create({
    baseURL: "https://stock.indianapi.in",
    headers: {
      "X-Api-Key": API_KEY,
    },
  });

  const testCompanies = ["RELIANCE", "TCS", "INFY"];

  for (const company of testCompanies) {
    console.log(`\n🏢 Testing with company: ${company}`);
    console.log("=".repeat(40));

    // Test 1: Stock details (working)
    console.log("\n1️⃣ Stock Details:");
    try {
      const response = await axiosInstance.get("/stock", {
        params: { name: company },
      });
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      console.log(`   Data structure:`, Object.keys(response.data));
    } catch (error) {
      console.log(`❌ FAILED - Status: ${error.response?.status}`);
      console.log(`   Error:`, error.response?.data);
    }

    // Test 2: Historical data - try different parameter combinations
    console.log("\n2️⃣ Historical Data:");

    // Try with 'name' parameter
    console.log("   Trying with 'name' parameter:");
    try {
      const response = await axiosInstance.get("/historical_data", {
        params: { name: company, period: "1m" },
      });
      console.log(`   ✅ SUCCESS with name - Status: ${response.status}`);
    } catch (error) {
      console.log(`   ❌ FAILED with name - Status: ${error.response?.status}`);
      if (error.response?.data) {
        console.log(`   Error details:`, error.response.data);
      }
    }

    // Try with 'symbol' parameter
    console.log("   Trying with 'symbol' parameter:");
    try {
      const response = await axiosInstance.get("/historical_data", {
        params: { symbol: company, period: "1m" },
      });
      console.log(`   ✅ SUCCESS with symbol - Status: ${response.status}`);
    } catch (error) {
      console.log(
        `   ❌ FAILED with symbol - Status: ${error.response?.status}`
      );
    }

    // Try without period
    console.log("   Trying without period parameter:");
    try {
      const response = await axiosInstance.get("/historical_data", {
        params: { name: company },
      });
      console.log(`   ✅ SUCCESS without period - Status: ${response.status}`);
    } catch (error) {
      console.log(
        `   ❌ FAILED without period - Status: ${error.response?.status}`
      );
    }

    // Try different period values
    const periods = ["1d", "5d", "1m", "3m", "6m", "1y"];
    for (const period of periods) {
      try {
        const response = await axiosInstance.get("/historical_data", {
          params: { name: company, period },
        });
        console.log(
          `   ✅ Period '${period}' works - Status: ${response.status}`
        );
        break; // Stop at first successful period
      } catch (error) {
        console.log(
          `   ❌ Period '${period}' failed - Status: ${error.response?.status}`
        );
      }
    }

    // Test 3: Stock forecasts - try different parameter combinations
    console.log("\n3️⃣ Stock Forecasts:");

    // Try with 'name' parameter
    console.log("   Trying with 'name' parameter:");
    try {
      const response = await axiosInstance.get("/stock_forecasts", {
        params: { name: company },
      });
      console.log(`   ✅ SUCCESS with name - Status: ${response.status}`);
    } catch (error) {
      console.log(`   ❌ FAILED with name - Status: ${error.response?.status}`);
      if (error.response?.data) {
        console.log(`   Error details:`, error.response.data);
      }
    }

    // Try with 'symbol' parameter
    console.log("   Trying with 'symbol' parameter:");
    try {
      const response = await axiosInstance.get("/stock_forecasts", {
        params: { symbol: company },
      });
      console.log(`   ✅ SUCCESS with symbol - Status: ${response.status}`);
    } catch (error) {
      console.log(
        `   ❌ FAILED with symbol - Status: ${error.response?.status}`
      );
    }

    // Add delay between companies to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n🎯 Debug completed!");
}

debugApiEndpoints().catch(console.error);
