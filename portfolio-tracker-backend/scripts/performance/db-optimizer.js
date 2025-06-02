// Database optimization and analysis script

require("dotenv").config();
const mongoose = require("mongoose");

class DatabaseOptimizer {
  constructor() {
    this.db = null;
  }

  async connect() {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/portfolio_tracker"
      );
      this.db = mongoose.connection.db;
      console.log("Connected to MongoDB for optimization");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
  }

  // Analyze collection statistics
  async analyzeCollections() {
    console.log("\n=== Collection Analysis ===");

    const collections = ["users", "portfolios", "assets", "transactions"];
    const stats = {};

    for (const collectionName of collections) {
      try {
        const collection = this.db.collection(collectionName);
        const collStats = await collection.stats();

        stats[collectionName] = {
          count: collStats.count,
          size: this.formatBytes(collStats.size),
          avgObjSize: this.formatBytes(collStats.avgObjSize),
          storageSize: this.formatBytes(collStats.storageSize),
          totalIndexSize: this.formatBytes(collStats.totalIndexSize),
          nindexes: collStats.nindexes,
        };

        console.log(`\n${collectionName.toUpperCase()}:`);
        console.log(
          `  Documents: ${stats[collectionName].count.toLocaleString()}`
        );
        console.log(`  Data Size: ${stats[collectionName].size}`);
        console.log(`  Storage Size: ${stats[collectionName].storageSize}`);
        console.log(`  Index Size: ${stats[collectionName].totalIndexSize}`);
        console.log(`  Indexes: ${stats[collectionName].nindexes}`);
        console.log(`  Avg Document Size: ${stats[collectionName].avgObjSize}`);
      } catch (error) {
        console.warn(
          `Warning: Could not analyze ${collectionName}:`,
          error.message
        );
      }
    }

    return stats;
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }
}

module.exports = DatabaseOptimizer;
