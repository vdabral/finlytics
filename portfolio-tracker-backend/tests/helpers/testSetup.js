// Global test setup
const dotenv = require("dotenv");

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Set test environment
process.env.NODE_ENV = "test";
process.env.PORT = 0; // Use random port for tests

// Global test timeout
jest.setTimeout(30000);

// Global test hooks
beforeAll(async () => {
  console.log("Starting test suite...");
});

afterAll(async () => {
  console.log("Test suite completed");
});

// Handle unhandled promise rejections in tests
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Suppress console.log during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === "true") {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error, // Keep error for debugging
  };
}
