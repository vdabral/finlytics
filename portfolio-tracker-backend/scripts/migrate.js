// Database migration script
// This script handles database migrations for the Portfolio Tracker

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

class MigrationManager {
  constructor() {
    this.migrationPath = path.join(__dirname, "migrations");
    this.migrationCollection = "migrations";
  }

  async connect() {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/portfolio_tracker"
      );
      console.log("Connected to MongoDB for migrations");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
  }

  async getAppliedMigrations() {
    const Migration = mongoose.model(
      "Migration",
      new mongoose.Schema({
        name: String,
        appliedAt: { type: Date, default: Date.now },
      })
    );

    const applied = await Migration.find({}).sort({ appliedAt: 1 });
    return applied.map((m) => m.name);
  }

  async markMigrationApplied(migrationName) {
    const Migration = mongoose.model(
      "Migration",
      new mongoose.Schema({
        name: String,
        appliedAt: { type: Date, default: Date.now },
      })
    );

    await new Migration({ name: migrationName }).save();
  }

  async getPendingMigrations() {
    const migrationFiles = fs
      .readdirSync(this.migrationPath)
      .filter((file) => file.endsWith(".js"))
      .sort();

    const appliedMigrations = await this.getAppliedMigrations();

    return migrationFiles.filter((file) => !appliedMigrations.includes(file));
  }

  async runMigration(migrationFile) {
    const migrationPath = path.join(this.migrationPath, migrationFile);
    const migration = require(migrationPath);

    console.log(`Running migration: ${migrationFile}`);

    try {
      await migration.up();
      await this.markMigrationApplied(migrationFile);
      console.log(`✓ Migration ${migrationFile} completed`);
    } catch (error) {
      console.error(`✗ Migration ${migrationFile} failed:`, error);
      throw error;
    }
  }

  async migrate() {
    await this.connect();

    try {
      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        console.log("No pending migrations");
        return;
      }

      console.log(`Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }

      console.log("All migrations completed successfully");
    } finally {
      await this.disconnect();
    }
  }

  async rollback(migrationName) {
    await this.connect();

    try {
      const migrationPath = path.join(this.migrationPath, migrationName);

      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migration file ${migrationName} not found`);
      }

      const migration = require(migrationPath);

      if (!migration.down) {
        throw new Error(`Migration ${migrationName} does not support rollback`);
      }

      console.log(`Rolling back migration: ${migrationName}`);
      await migration.down();

      // Remove from migrations collection
      const Migration = mongoose.model(
        "Migration",
        new mongoose.Schema({
          name: String,
          appliedAt: { type: Date, default: Date.now },
        })
      );

      await Migration.deleteOne({ name: migrationName });
      console.log(`✓ Rollback of ${migrationName} completed`);
    } finally {
      await this.disconnect();
    }
  }

  async status() {
    await this.connect();

    try {
      const migrationFiles = fs
        .readdirSync(this.migrationPath)
        .filter((file) => file.endsWith(".js"))
        .sort();

      const appliedMigrations = await this.getAppliedMigrations();

      console.log("\nMigration Status:");
      console.log("================");

      for (const file of migrationFiles) {
        const status = appliedMigrations.includes(file)
          ? "✓ Applied"
          : "✗ Pending";
        console.log(`${status} - ${file}`);
      }

      console.log(`\nTotal: ${migrationFiles.length} migrations`);
      console.log(`Applied: ${appliedMigrations.length}`);
      console.log(
        `Pending: ${migrationFiles.length - appliedMigrations.length}`
      );
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const migrationName = process.argv[3];

  const manager = new MigrationManager();

  switch (command) {
    case "migrate":
      manager.migrate().catch(console.error);
      break;
    case "rollback":
      if (!migrationName) {
        console.error("Please specify migration name to rollback");
        process.exit(1);
      }
      manager.rollback(migrationName).catch(console.error);
      break;
    case "status":
      manager.status().catch(console.error);
      break;
    default:
      console.log("Usage:");
      console.log("  node migrate.js migrate     - Run all pending migrations");
      console.log(
        "  node migrate.js rollback <migration>  - Rollback specific migration"
      );
      console.log("  node migrate.js status      - Show migration status");
      break;
  }
}

module.exports = MigrationManager;
