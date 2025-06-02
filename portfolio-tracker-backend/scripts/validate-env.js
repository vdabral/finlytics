#!/usr/bin/env node

// Environment validation script
require("dotenv").config();
const mongoose = require("mongoose");
const Redis = require("ioredis");
const axios = require("axios");

class EnvironmentValidator {
  constructor() {
    this.results = [];
  }

  log(status, message, details = "") {
    const icon =
      status === "success" ? "✅" : status === "warning" ? "⚠️" : "❌";
    console.log(`${icon} ${message}`);
    if (details) console.log(`   ${details}`);
    this.results.push({ status, message, details });
  }

  async validateMongoDB() {
    console.log("\n🔍 Testing MongoDB Connection...");
    try {
      const uri =
        process.env.MONGODB_URI ||
        "mongodb://localhost:27017/portfolio_tracker";
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      const db = mongoose.connection.db;
      await db.admin().ping();

      this.log(
        "success",
        "MongoDB connection successful",
        `Connected to: ${uri}`
      );

      // Check database permissions
      try {
        const collections = await db.listCollections().toArray();
        this.log(
          "success",
          "Database permissions OK",
          `Found ${collections.length} collections`
        );
      } catch (error) {
        this.log("warning", "Limited database permissions", error.message);
      }

      await mongoose.disconnect();
    } catch (error) {
      this.log("error", "MongoDB connection failed", error.message);
    }
  }

  async validateRedis() {
    console.log("\n🔍 Testing Redis Connection...");
    try {
      const redis = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        connectTimeout: 5000,
        lazyConnect: true,
      });

      await redis.connect();
      await redis.ping();

      this.log(
        "success",
        "Redis connection successful",
        `Connected to: ${process.env.REDIS_HOST || "localhost"}:${
          process.env.REDIS_PORT || 6379
        }`
      );

      await redis.disconnect();
    } catch (error) {
      this.log("warning", "Redis connection failed (optional)", error.message);
    }
  }

  async validateAlphaVantage() {
    console.log("\n🔍 Testing Alpha Vantage API...");
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

      if (!apiKey || apiKey === "your-alpha-vantage-api-key") {
        this.log(
          "warning",
          "Alpha Vantage API key not configured",
          "Using demo key - limited functionality"
        );
        return;
      }

      if (apiKey === "demo") {
        this.log(
          "warning",
          "Using Alpha Vantage demo key",
          "Get free API key from https://www.alphavantage.co/support/#api-key"
        );
        return;
      }
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=RELIANCE.NSE&apikey=${apiKey}`,
        { timeout: 10000 }
      );

      if (response.data["Global Quote"]) {
        this.log(
          "success",
          "Alpha Vantage API working",
          "Market data available"
        );
      } else if (response.data["Error Message"]) {
        this.log(
          "error",
          "Alpha Vantage API error",
          response.data["Error Message"]
        );
      } else if (response.data["Note"]) {
        this.log("warning", "Alpha Vantage rate limit", response.data["Note"]);
      } else {
        this.log(
          "error",
          "Unexpected Alpha Vantage response",
          JSON.stringify(response.data)
        );
      }
    } catch (error) {
      this.log("error", "Alpha Vantage API test failed", error.message);
    }
  }

  async validateGoogleOAuth() {
    console.log("\n🔍 Checking Google OAuth Configuration...");

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || clientId === "your-google-client-id") {
      this.log(
        "warning",
        "Google OAuth not configured (optional)",
        "Social login will not work"
      );
      return;
    }

    if (!clientSecret || clientSecret === "your-google-client-secret") {
      this.log(
        "error",
        "Google OAuth client secret missing",
        "Client ID provided but secret is missing"
      );
      return;
    }

    this.log("success", "Google OAuth configured", "Social login should work");
  }

  validateRequiredEnvVars() {
    console.log("\n🔍 Checking Required Environment Variables...");

    const required = ["JWT_SECRET", "MONGODB_URI"];

    const recommended = ["ALPHA_VANTAGE_API_KEY", "NODE_ENV", "PORT"];

    for (const varName of required) {
      const value = process.env[varName];
      if (!value) {
        this.log(
          "error",
          `Missing required variable: ${varName}`,
          "Application will not start without this"
        );
      } else if (value.includes("your-") || value.includes("change-this")) {
        this.log(
          "warning",
          `Default value for: ${varName}`,
          "Please update with actual value"
        );
      } else {
        this.log("success", `${varName} configured`);
      }
    }

    for (const varName of recommended) {
      const value = process.env[varName];
      if (!value) {
        this.log(
          "warning",
          `Missing recommended variable: ${varName}`,
          "Some features may not work"
        );
      } else {
        this.log("success", `${varName} configured`);
      }
    }
  }

  validatePorts() {
    console.log("\n🔍 Checking Port Configuration...");

    const port = process.env.PORT || 5000;

    if (isNaN(port) || port < 1 || port > 65535) {
      this.log("error", "Invalid port number", `PORT=${port}`);
    } else if (port < 1024) {
      this.log(
        "warning",
        "Using privileged port",
        `PORT=${port} - may require admin privileges`
      );
    } else {
      this.log("success", `Port configured: ${port}`);
    }
  }

  async validateAll() {
    console.log("🚀 Portfolio Tracker Environment Validation\n");
    console.log("=".repeat(50));

    this.validateRequiredEnvVars();
    this.validatePorts();
    await this.validateMongoDB();
    await this.validateRedis();
    await this.validateAlphaVantage();
    await this.validateGoogleOAuth();

    console.log("\n" + "=".repeat(50));
    console.log("📊 Validation Summary:");

    const successCount = this.results.filter(
      (r) => r.status === "success"
    ).length;
    const warningCount = this.results.filter(
      (r) => r.status === "warning"
    ).length;
    const errorCount = this.results.filter((r) => r.status === "error").length;

    console.log(`✅ Success: ${successCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (errorCount === 0 && warningCount === 0) {
      console.log("\n🎉 Environment is fully configured!");
    } else if (errorCount === 0) {
      console.log("\n✨ Environment is ready with minor warnings");
    } else {
      console.log("\n🔧 Please fix the errors before starting the application");
    }

    console.log("\nNext steps:");
    console.log("1. npm install");
    console.log("2. npm run seed");
    console.log("3. npm run dev");
  }
}

// Run validation
const validator = new EnvironmentValidator();
validator.validateAll().catch(console.error);
