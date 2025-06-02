const cron = require("node-cron");
const logger = require("./logger");

class Scheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Add a new scheduled job
  addJob(name, cronExpression, task, options = {}) {
    try {
      if (this.jobs.has(name)) {
        logger.warn(`Job ${name} already exists, replacing it`);
        this.removeJob(name);
      }

      const job = cron.schedule(
        cronExpression,
        async () => {
          const startTime = Date.now();
          logger.info(`Starting scheduled job: ${name}`);

          try {
            await task();
            const duration = Date.now() - startTime;
            logger.info(`Completed scheduled job: ${name} in ${duration}ms`);
          } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(
              `Failed scheduled job: ${name} after ${duration}ms`,
              error
            );
          }
        },
        {
          scheduled: false,
          timezone: options.timezone || "UTC",
        }
      );

      this.jobs.set(name, {
        job,
        cronExpression,
        task,
        options,
        isRunning: false,
        lastRun: null,
        nextRun: null,
        runCount: 0,
        errorCount: 0,
      });

      logger.info(
        `Added scheduled job: ${name} with expression: ${cronExpression}`
      );
      return true;
    } catch (error) {
      logger.error(`Failed to add scheduled job: ${name}`, error);
      return false;
    }
  }

  // Start a specific job
  startJob(name) {
    const jobData = this.jobs.get(name);
    if (!jobData) {
      logger.error(`Job ${name} not found`);
      return false;
    }

    try {
      jobData.job.start();
      jobData.isRunning = true;
      logger.info(`Started job: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to start job: ${name}`, error);
      return false;
    }
  }

  // Stop a specific job
  stopJob(name) {
    const jobData = this.jobs.get(name);
    if (!jobData) {
      logger.error(`Job ${name} not found`);
      return false;
    }

    try {
      jobData.job.stop();
      jobData.isRunning = false;
      logger.info(`Stopped job: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to stop job: ${name}`, error);
      return false;
    }
  }

  // Remove a job
  removeJob(name) {
    const jobData = this.jobs.get(name);
    if (!jobData) {
      logger.error(`Job ${name} not found`);
      return false;
    }

    try {
      jobData.job.destroy();
      this.jobs.delete(name);
      logger.info(`Removed job: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to remove job: ${name}`, error);
      return false;
    }
  }

  // Start all jobs
  startAll() {
    logger.info("Starting all scheduled jobs");
    let started = 0;

    for (const [name, jobData] of this.jobs) {
      if (this.startJob(name)) {
        started++;
      }
    }

    this.isRunning = true;
    logger.info(`Started ${started}/${this.jobs.size} scheduled jobs`);
    return started;
  }

  // Stop all jobs
  stopAll() {
    logger.info("Stopping all scheduled jobs");
    let stopped = 0;

    for (const [name, jobData] of this.jobs) {
      if (this.stopJob(name)) {
        stopped++;
      }
    }

    this.isRunning = false;
    logger.info(`Stopped ${stopped}/${this.jobs.size} scheduled jobs`);
    return stopped;
  }

  // Get job status
  getJobStatus(name) {
    const jobData = this.jobs.get(name);
    if (!jobData) {
      return null;
    }

    return {
      name,
      cronExpression: jobData.cronExpression,
      isRunning: jobData.isRunning,
      lastRun: jobData.lastRun,
      nextRun: jobData.nextRun,
      runCount: jobData.runCount,
      errorCount: jobData.errorCount,
    };
  }

  // Get all jobs status
  getAllJobsStatus() {
    const status = [];
    for (const [name, jobData] of this.jobs) {
      status.push(this.getJobStatus(name));
    }
    return status;
  }

  // Run a job immediately (outside of schedule)
  async runJobNow(name) {
    const jobData = this.jobs.get(name);
    if (!jobData) {
      logger.error(`Job ${name} not found`);
      return false;
    }

    const startTime = Date.now();
    logger.info(`Running job immediately: ${name}`);

    try {
      await jobData.task();
      const duration = Date.now() - startTime;
      jobData.lastRun = new Date();
      jobData.runCount++;
      logger.info(`Completed immediate job run: ${name} in ${duration}ms`);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      jobData.errorCount++;
      logger.error(
        `Failed immediate job run: ${name} after ${duration}ms`,
        error
      );
      return false;
    }
  }

  // Graceful shutdown
  async shutdown() {
    logger.info("Shutting down scheduler...");
    this.stopAll();

    // Wait a bit for jobs to finish
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Destroy all jobs
    for (const [name, jobData] of this.jobs) {
      try {
        jobData.job.destroy();
      } catch (error) {
        logger.error(`Error destroying job ${name}:`, error);
      }
    }

    this.jobs.clear();
    logger.info("Scheduler shutdown complete");
  }
}

// Create singleton instance
const scheduler = new Scheduler();

// Common cron expressions
const CRON_EXPRESSIONS = {
  EVERY_MINUTE: "* * * * *",
  EVERY_5_MINUTES: "*/5 * * * *",
  EVERY_15_MINUTES: "*/15 * * * *",
  EVERY_30_MINUTES: "*/30 * * * *",
  EVERY_HOUR: "0 * * * *",
  EVERY_2_HOURS: "0 */2 * * *",
  EVERY_6_HOURS: "0 */6 * * *",
  EVERY_12_HOURS: "0 */12 * * *",
  DAILY_AT_MIDNIGHT: "0 0 * * *",
  DAILY_AT_6AM: "0 6 * * *",
  DAILY_AT_NOON: "0 12 * * *",
  DAILY_AT_6PM: "0 18 * * *",
  WEEKLY_SUNDAY_MIDNIGHT: "0 0 * * 0",
  WEEKLY_MONDAY_6AM: "0 6 * * 1",
  MONTHLY_FIRST_DAY: "0 0 1 * *",
  BUSINESS_HOURS_START: "0 9 * * 1-5", // 9 AM, Monday to Friday
  BUSINESS_HOURS_END: "0 17 * * 1-5", // 5 PM, Monday to Friday
  MARKET_OPEN: "30 9 * * 1-5", // 9:30 AM, Monday to Friday (US market)
  MARKET_CLOSE: "0 16 * * 1-5", // 4:00 PM, Monday to Friday (US market)
};

// Predefined job templates
const JOB_TEMPLATES = {
  PRICE_UPDATE: {
    name: "price-update",
    expression: CRON_EXPRESSIONS.EVERY_15_MINUTES,
    description: "Update asset prices every 15 minutes",
  },
  PORTFOLIO_SYNC: {
    name: "portfolio-sync",
    expression: CRON_EXPRESSIONS.EVERY_30_MINUTES,
    description: "Sync portfolio data every 30 minutes",
  },
  DAILY_SUMMARY: {
    name: "daily-summary",
    expression: CRON_EXPRESSIONS.DAILY_AT_6PM,
    description: "Generate daily portfolio summaries",
  },
  WEEKLY_REPORT: {
    name: "weekly-report",
    expression: CRON_EXPRESSIONS.WEEKLY_SUNDAY_MIDNIGHT,
    description: "Generate weekly performance reports",
  },
  CACHE_CLEANUP: {
    name: "cache-cleanup",
    expression: CRON_EXPRESSIONS.EVERY_6_HOURS,
    description: "Clean up expired cache entries",
  },
  LOG_ROTATION: {
    name: "log-rotation",
    expression: CRON_EXPRESSIONS.DAILY_AT_MIDNIGHT,
    description: "Rotate log files daily",
  },
  HEALTH_CHECK: {
    name: "health-check",
    expression: CRON_EXPRESSIONS.EVERY_5_MINUTES,
    description: "Perform system health checks",
  },
};

// Utility functions
const cronUtils = {
  // Validate cron expression
  isValidCron: (expression) => {
    try {
      return cron.validate(expression);
    } catch {
      return false;
    }
  },

  // Get next run time for a cron expression
  getNextRun: (expression) => {
    try {
      // This is a simplified implementation
      // In production, you'd want to use a more sophisticated cron parser
      return new Date(Date.now() + 60000); // Placeholder: next minute
    } catch {
      return null;
    }
  },

  // Create cron expression from human-readable format
  createExpression: ({
    minute = "*",
    hour = "*",
    dayOfMonth = "*",
    month = "*",
    dayOfWeek = "*",
  }) => {
    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  },
};

module.exports = {
  scheduler,
  Scheduler,
  CRON_EXPRESSIONS,
  JOB_TEMPLATES,
  cronUtils,
};
