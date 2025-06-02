// MongoDB initialization script for Docker
// This script is run when the MongoDB container starts for the first time

// Switch to the portfolio_tracker database
db = db.getSiblingDB("portfolio_tracker");

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
        },
        password: {
          bsonType: "string",
          minLength: 6,
        },
        role: {
          bsonType: "string",
          enum: ["user", "admin"],
        },
      },
    },
  },
});

db.createCollection("portfolios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "userId"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 1,
          maxLength: 100,
        },
        userId: {
          bsonType: "objectId",
        },
        holdings: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["assetId", "quantity"],
            properties: {
              assetId: { bsonType: "objectId" },
              quantity: { bsonType: "number", minimum: 0 },
              averagePrice: { bsonType: "number", minimum: 0 },
              currentPrice: { bsonType: "number", minimum: 0 },
            },
          },
        },
      },
    },
  },
});

db.createCollection("assets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["symbol", "name", "type"],
      properties: {
        symbol: {
          bsonType: "string",
          minLength: 1,
          maxLength: 20,
        },
        name: {
          bsonType: "string",
          minLength: 1,
          maxLength: 200,
        },
        type: {
          bsonType: "string",
          enum: [
            "stock",
            "etf",
            "mutual_fund",
            "bond",
            "cryptocurrency",
            "commodity",
          ],
        },
        currency: {
          bsonType: "string",
          minLength: 3,
          maxLength: 3,
        },
      },
    },
  },
});

db.createCollection("transactions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "userId",
        "portfolioId",
        "assetId",
        "type",
        "quantity",
        "price",
      ],
      properties: {
        userId: { bsonType: "objectId" },
        portfolioId: { bsonType: "objectId" },
        assetId: { bsonType: "objectId" },
        type: {
          bsonType: "string",
          enum: ["buy", "sell", "dividend", "split", "transfer"],
        },
        quantity: {
          bsonType: "number",
          minimum: 0,
        },
        price: {
          bsonType: "number",
          minimum: 0,
        },
        totalAmount: {
          bsonType: "number",
          minimum: 0,
        },
      },
    },
  },
});

// Create initial indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.portfolios.createIndex({ userId: 1 });
db.portfolios.createIndex({ userId: 1, name: 1 }, { unique: true });
db.assets.createIndex({ symbol: 1 }, { unique: true });
db.transactions.createIndex({ portfolioId: 1 });
db.transactions.createIndex({ userId: 1 });
db.transactions.createIndex({ assetId: 1 });
db.transactions.createIndex({ date: -1 });

// Create application user (optional, for better security)
// db.createUser({
//   user: 'portfolio_app',
//   pwd: 'secure_app_password',
//   roles: [
//     {
//       role: 'readWrite',
//       db: 'portfolio_tracker'
//     }
//   ]
// });

print("Portfolio Tracker database initialized successfully!");
