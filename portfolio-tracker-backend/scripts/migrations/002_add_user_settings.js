// Migration: Add default user settings and preferences
// Created: 2024-01-02

const mongoose = require("mongoose");

module.exports = {
  async up() {
    // Update existing users to have default settings
    await mongoose.connection.collection("users").updateMany(
      { settings: { $exists: false } },
      {
        $set: {
          settings: {
            notifications: {
              email: true,
              push: false,
              priceAlerts: true,
              portfolioSummary: true,
            },
            dashboard: {
              defaultPortfolio: null,
              theme: "light",
              currency: "USD",
              language: "en",
            },
            privacy: {
              profileVisible: false,
              sharePortfolio: false,
            },
            timezone: "UTC",
          },
        },
      }
    );

    // Update existing users to have default profile fields
    await mongoose.connection.collection("users").updateMany(
      { "profile.firstName": { $exists: false } },
      {
        $set: {
          "profile.firstName": "",
          "profile.lastName": "",
          "profile.phone": "",
          "profile.country": "",
          "profile.avatar": "",
        },
      }
    );

    console.log("✓ Default user settings and profile fields added");
  },

  async down() {
    // Remove the settings field from all users
    await mongoose.connection.collection("users").updateMany(
      {},
      {
        $unset: {
          settings: "",
          "profile.firstName": "",
          "profile.lastName": "",
          "profile.phone": "",
          "profile.country": "",
          "profile.avatar": "",
        },
      }
    );

    console.log("✓ User settings and profile fields removed");
  },
};
