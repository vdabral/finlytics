// Migration: Add indexes for better performance
// Created: 2024-01-01

const mongoose = require("mongoose");

module.exports = {
  async up() {
    // User collection indexes
    await mongoose.connection
      .collection("users")
      .createIndex({ email: 1 }, { unique: true });
    await mongoose.connection
      .collection("users")
      .createIndex({ "profile.firstName": 1, "profile.lastName": 1 });
    await mongoose.connection.collection("users").createIndex({ createdAt: 1 });
    await mongoose.connection
      .collection("users")
      .createIndex({ "settings.timezone": 1 });

    // Portfolio collection indexes
    await mongoose.connection
      .collection("portfolios")
      .createIndex({ userId: 1 });
    await mongoose.connection
      .collection("portfolios")
      .createIndex({ userId: 1, name: 1 }, { unique: true });
    await mongoose.connection
      .collection("portfolios")
      .createIndex({ createdAt: 1 });
    await mongoose.connection
      .collection("portfolios")
      .createIndex({ updatedAt: 1 });

    // Asset collection indexes
    await mongoose.connection
      .collection("assets")
      .createIndex({ symbol: 1 }, { unique: true });
    await mongoose.connection.collection("assets").createIndex({ name: 1 });
    await mongoose.connection.collection("assets").createIndex({ type: 1 });
    await mongoose.connection.collection("assets").createIndex({ exchange: 1 });
    await mongoose.connection.collection("assets").createIndex({ sector: 1 });
    await mongoose.connection.collection("assets").createIndex({ currency: 1 });

    // Transaction collection indexes
    await mongoose.connection
      .collection("transactions")
      .createIndex({ portfolioId: 1 });
    await mongoose.connection
      .collection("transactions")
      .createIndex({ assetId: 1 });
    await mongoose.connection
      .collection("transactions")
      .createIndex({ userId: 1 });
    await mongoose.connection
      .collection("transactions")
      .createIndex({ type: 1 });
    await mongoose.connection
      .collection("transactions")
      .createIndex({ date: -1 });
    await mongoose.connection
      .collection("transactions")
      .createIndex({ portfolioId: 1, date: -1 });

    console.log("✓ Performance indexes created");
  },

  async down() {
    // Remove indexes (be careful with this in production)
    const collections = ["users", "portfolios", "assets", "transactions"];

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        await collection.dropIndexes();
        console.log(`✓ Indexes dropped for ${collectionName}`);
      } catch (error) {
        console.warn(
          `Warning: Could not drop indexes for ${collectionName}:`,
          error.message
        );
      }
    }
  },
};
