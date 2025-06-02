// Load testing script for Portfolio Tracker API
// Uses artillery.js for comprehensive load testing

const artillery = require("artillery");
const fs = require("fs");
const path = require("path");

class LoadTester {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || "http://localhost:5000";
    this.resultsDir = path.join(__dirname, "../../test-results");

    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  // Basic API endpoint tests
  getBasicTestConfig() {
    return {
      config: {
        target: this.baseUrl,
        phases: [
          { duration: 60, arrivalRate: 10, name: "Warm up" },
          { duration: 120, arrivalRate: 20, name: "Ramp up load" },
          { duration: 300, arrivalRate: 50, name: "Sustained load" },
          { duration: 60, arrivalRate: 100, name: "Peak load" },
        ],
        payload: {
          path: path.join(__dirname, "test-data.csv"),
          fields: ["email", "password"],
        },
      },
      scenarios: [
        {
          name: "Health Check",
          weight: 10,
          flow: [
            {
              get: {
                url: "/api/v1/health",
              },
            },
          ],
        },
        {
          name: "User Authentication",
          weight: 30,
          flow: [
            {
              post: {
                url: "/api/v1/auth/login",
                json: {
                  email: "{{ email }}",
                  password: "{{ password }}",
                },
                capture: {
                  header: "authorization",
                  as: "authToken",
                },
              },
            },
          ],
        },
        {
          name: "Portfolio Operations",
          weight: 40,
          flow: [
            {
              post: {
                url: "/api/v1/auth/login",
                json: {
                  email: "demo@example.com",
                  password: "password123",
                },
                capture: {
                  json: "$.token",
                  as: "authToken",
                },
              },
            },
            {
              get: {
                url: "/api/v1/portfolios",
                headers: {
                  Authorization: "Bearer {{ authToken }}",
                },
              },
            },
            {
              get: {
                url: "/api/v1/assets/search?query=AAPL",
                headers: {
                  Authorization: "Bearer {{ authToken }}",
                },
              },
            },
          ],
        },
        {
          name: "Market Data",
          weight: 20,
          flow: [
            {
              get: {
                url: "/api/v1/market/price/AAPL",
              },
            },
            {
              get: {
                url: "/api/v1/market/trending",
              },
            },
          ],
        },
      ],
    };
  }

  // Stress test configuration
  getStressTestConfig() {
    return {
      config: {
        target: this.baseUrl,
        phases: [
          { duration: 60, arrivalRate: 50, name: "Warm up" },
          { duration: 120, arrivalRate: 100, name: "Increase load" },
          { duration: 180, arrivalRate: 200, name: "High load" },
          { duration: 60, arrivalRate: 500, name: "Stress test" },
        ],
      },
      scenarios: [
        {
          name: "Concurrent API Calls",
          weight: 100,
          flow: [
            {
              get: {
                url: "/api/v1/health",
              },
            },
            {
              get: {
                url: "/api/v1/market/trending",
              },
            },
          ],
        },
      ],
    };
  }

  // WebSocket load test
  getWebSocketTestConfig() {
    return {
      config: {
        target: this.baseUrl.replace("http", "ws"),
        phases: [
          { duration: 60, arrivalRate: 10 },
          { duration: 120, arrivalRate: 50 },
          { duration: 180, arrivalRate: 100 },
        ],
        engines: {
          ws: {},
        },
      },
      scenarios: [
        {
          name: "WebSocket Connections",
          engine: "ws",
          flow: [
            {
              connect: {
                url: "/socket.io/?transport=websocket",
              },
            },
            {
              send: {
                payload: JSON.stringify({
                  type: "subscribe",
                  symbols: ["AAPL", "GOOGL", "MSFT"],
                }),
              },
            },
            {
              think: 30,
            },
          ],
        },
      ],
    };
  }

  async runTest(testType = "basic") {
    let config;
    let outputFile;

    switch (testType) {
      case "basic":
        config = this.getBasicTestConfig();
        outputFile = path.join(
          this.resultsDir,
          `basic-load-test-${Date.now()}.json`
        );
        break;
      case "stress":
        config = this.getStressTestConfig();
        outputFile = path.join(
          this.resultsDir,
          `stress-test-${Date.now()}.json`
        );
        break;
      case "websocket":
        config = this.getWebSocketTestConfig();
        outputFile = path.join(
          this.resultsDir,
          `websocket-test-${Date.now()}.json`
        );
        break;
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }

    console.log(`Starting ${testType} load test...`);
    console.log(`Target: ${this.baseUrl}`);
    console.log(`Results will be saved to: ${outputFile}`);

    return new Promise((resolve, reject) => {
      const runner = artillery.runner(config, {
        output: outputFile,
      });

      runner.on("phaseStarted", (phase) => {
        console.log(`Phase started: ${phase.name || "Unnamed"}`);
      });

      runner.on("phaseCompleted", (phase) => {
        console.log(`Phase completed: ${phase.name || "Unnamed"}`);
      });

      runner.on("stats", (stats) => {
        console.log(`Current RPS: ${stats.requestsCompleted}`);
        if (stats.errors && Object.keys(stats.errors).length > 0) {
          console.warn("Errors detected:", stats.errors);
        }
      });

      runner.on("done", (report) => {
        console.log("\n=== Load Test Results ===");
        console.log(`Total requests: ${report.aggregate.requestsCompleted}`);
        console.log(`Failed requests: ${report.aggregate.requestsFailed || 0}`);
        console.log(
          `Average response time: ${Math.round(
            report.aggregate.latency?.mean || 0
          )}ms`
        );
        console.log(
          `95th percentile: ${Math.round(report.aggregate.latency?.p95 || 0)}ms`
        );
        console.log(
          `99th percentile: ${Math.round(report.aggregate.latency?.p99 || 0)}ms`
        );

        if (
          report.aggregate.errors &&
          Object.keys(report.aggregate.errors).length > 0
        ) {
          console.log("\nErrors:");
          Object.entries(report.aggregate.errors).forEach(([error, count]) => {
            console.log(`  ${error}: ${count}`);
          });
        }

        console.log(`\nDetailed results saved to: ${outputFile}`);
        resolve(report);
      });

      runner.on("error", reject);
      runner.run();
    });
  }

  // Generate test data CSV
  generateTestData() {
    const testDataPath = path.join(__dirname, "test-data.csv");
    const testUsers = [];

    // Add header
    testUsers.push("email,password");

    // Generate test users
    for (let i = 1; i <= 100; i++) {
      testUsers.push(`testuser${i}@example.com,password123`);
    }

    fs.writeFileSync(testDataPath, testUsers.join("\n"));
    console.log(`Test data generated: ${testDataPath}`);
  }

  // Performance monitoring
  async monitorPerformance(duration = 300) {
    console.log(`Starting performance monitoring for ${duration} seconds...`);

    const startTime = Date.now();
    const metrics = [];

    const interval = setInterval(async () => {
      try {
        const start = Date.now();
        const response = await fetch(`${this.baseUrl}/api/v1/health`);
        const responseTime = Date.now() - start;

        const metric = {
          timestamp: new Date().toISOString(),
          responseTime,
          status: response.status,
          success: response.ok,
        };

        metrics.push(metric);
        console.log(`Health check: ${responseTime}ms (${response.status})`);
      } catch (error) {
        metrics.push({
          timestamp: new Date().toISOString(),
          responseTime: null,
          status: null,
          success: false,
          error: error.message,
        });
        console.log(`Health check failed: ${error.message}`);
      }
    }, 5000);

    return new Promise((resolve) => {
      setTimeout(() => {
        clearInterval(interval);

        const metricsFile = path.join(
          this.resultsDir,
          `performance-metrics-${Date.now()}.json`
        );
        fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));

        console.log(
          `Performance monitoring completed. Results saved to: ${metricsFile}`
        );
        resolve(metrics);
      }, duration * 1000);
    });
  }
}

// CLI interface
if (require.main === module) {
  const testType = process.argv[2] || "basic";
  const tester = new LoadTester();

  if (testType === "generate-data") {
    tester.generateTestData();
    process.exit(0);
  }

  if (testType === "monitor") {
    const duration = parseInt(process.argv[3]) || 300;
    tester
      .monitorPerformance(duration)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Monitoring failed:", error);
        process.exit(1);
      });
    return;
  }

  tester
    .runTest(testType)
    .then(() => {
      console.log("Load test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Load test failed:", error);
      process.exit(1);
    });
}

module.exports = LoadTester;
