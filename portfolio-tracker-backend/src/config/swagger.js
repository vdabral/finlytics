const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Finlytics API",
      version: "1.0.0",
      description:
        "A comprehensive API for smart investment portfolio analytics with real-time market data",
      contact: {
        name: "API Support",
        email: "support@finlytics.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.portfoliotracker.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for authentication",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            _id: {
              type: "string",
              description: "User ID",
            },
            name: {
              type: "string",
              description: "User full name",
              minLength: 2,
              maxLength: 50,
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            password: {
              type: "string",
              format: "password",
              description: "User password (min 8 characters)",
              minLength: 8,
            },
            emailVerified: {
              type: "boolean",
              description: "Email verification status",
            },
            isPremium: {
              type: "boolean",
              description: "Premium subscription status",
            },
            lastLogin: {
              type: "string",
              format: "date-time",
              description: "Last login timestamp",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
          },
        },
        Portfolio: {
          type: "object",
          required: ["name", "userId"],
          properties: {
            _id: {
              type: "string",
              description: "Portfolio ID",
            },
            name: {
              type: "string",
              description: "Portfolio name",
              minLength: 1,
              maxLength: 100,
            },
            description: {
              type: "string",
              description: "Portfolio description",
              maxLength: 500,
            },
            userId: {
              type: "string",
              description: "Owner user ID",
            },
            totalValue: {
              type: "number",
              description: "Total portfolio value in USD",
            },
            totalGainLoss: {
              type: "number",
              description: "Total gain/loss in USD",
            },
            totalGainLossPercent: {
              type: "number",
              description: "Total gain/loss percentage",
            },
            assets: {
              type: "array",
              items: {
                $ref: "#/components/schemas/PortfolioAsset",
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        PortfolioAsset: {
          type: "object",
          required: ["assetId", "quantity", "purchasePrice"],
          properties: {
            assetId: {
              type: "string",
              description: "Asset ID reference",
            },
            quantity: {
              type: "number",
              minimum: 0,
              description: "Number of shares/units",
            },
            purchasePrice: {
              type: "number",
              minimum: 0,
              description: "Average purchase price per unit",
            },
            currentValue: {
              type: "number",
              description: "Current total value of this holding",
            },
            gainLoss: {
              type: "number",
              description: "Gain/loss for this holding",
            },
            gainLossPercent: {
              type: "number",
              description: "Gain/loss percentage for this holding",
            },
          },
        },
        Asset: {
          type: "object",
          required: ["symbol", "name", "type"],
          properties: {
            _id: {
              type: "string",
              description: "Asset ID",
            },
            symbol: {
              type: "string",
              description: "Stock symbol (e.g., AAPL)",
              pattern: "^[A-Z]{1,5}$",
            },
            name: {
              type: "string",
              description: "Company/Asset name",
            },
            type: {
              type: "string",
              enum: ["stock", "etf", "mutual_fund", "crypto", "bond"],
              description: "Asset type",
            },
            sector: {
              type: "string",
              description: "Industry sector",
            },
            currentPrice: {
              type: "number",
              description: "Current market price",
            },
            previousClose: {
              type: "number",
              description: "Previous closing price",
            },
            change: {
              type: "number",
              description: "Price change from previous close",
            },
            changePercent: {
              type: "number",
              description: "Percentage change from previous close",
            },
            volume: {
              type: "number",
              description: "Trading volume",
            },
            marketCap: {
              type: "number",
              description: "Market capitalization",
            },
            priceHistory: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: {
                    type: "string",
                    format: "date-time",
                  },
                  price: {
                    type: "number",
                  },
                },
              },
            },
          },
        },
        Transaction: {
          type: "object",
          required: ["portfolioId", "assetId", "type", "quantity", "price"],
          properties: {
            _id: {
              type: "string",
              description: "Transaction ID",
            },
            portfolioId: {
              type: "string",
              description: "Portfolio ID",
            },
            assetId: {
              type: "string",
              description: "Asset ID",
            },
            type: {
              type: "string",
              enum: ["buy", "sell", "dividend"],
              description: "Transaction type",
            },
            quantity: {
              type: "number",
              minimum: 0,
              description: "Number of shares/units",
            },
            price: {
              type: "number",
              minimum: 0,
              description: "Price per share/unit",
            },
            fees: {
              type: "number",
              minimum: 0,
              description: "Transaction fees",
            },
            date: {
              type: "string",
              format: "date-time",
              description: "Transaction date",
            },
            notes: {
              type: "string",
              description: "Optional transaction notes",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                  },
                  message: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              description: "Success message",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  // Serve Swagger UI
  app.use("/api-docs", swaggerUi.serve);
  app.get(
    "/api-docs",
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Portfolio Tracker API Documentation",
    })
  );

  // Serve raw OpenAPI spec
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
};

module.exports = { swaggerSetup, specs };
