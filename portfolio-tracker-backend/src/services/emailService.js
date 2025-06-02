const nodemailer = require("nodemailer");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const net = require("net");
const logger = require("../utils/logger");
const { formatCurrency, formatPercentage } = require("../utils/helpers");

class EmailService {
  constructor() {
    console.log("EmailService constructor called");
    this.transporter = null;
    this.initialize();
    console.log("EmailService initialization completed");
  }
  initialize() {
    console.log("EmailService initialize called");
    const emailConfig = {
      host: "74.125.200.109", // Gmail SMTP IPv4 address
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      family: 4, // Force IPv4
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    };

    this.transporter = nodemailer.createTransport(emailConfig);
    console.log("Email transporter created successfully");
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      return info;
    } catch (error) {
      logger.error("Email sending failed:", error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const subject = "Welcome to Finlytics!";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Welcome to Finlytics!</h1>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Hello ${user.name}!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            Thank you for joining Finlytics, your comprehensive portfolio tracking platform. 
            We're excited to help you manage and track your investments with ease.
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e293b;">What you can do with Finlytics:</h3>
          <ul style="color: #475569; line-height: 1.6;">
            <li>Track your portfolio performance in real-time</li>
            <li>Monitor individual stock and crypto investments</li>
            <li>View detailed analytics and insights</li>
            <li>Set up alerts for price changes</li>
            <li>Generate comprehensive reports</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Get Started
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The Finlytics Team</p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = "Reset Your Finlytics Password";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Password Reset Request</h1>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Hello ${user.name}!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            You recently requested to reset your password for your Finlytics account. 
            Click the button below to reset it.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Security Notice:</strong> This link will expire in 1 hour for your security. 
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>

        <div style="margin: 20px 0; padding: 15px; background-color: #f1f5f9; border-radius: 6px;">
          <p style="color: #475569; margin: 0; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #3b82f6; margin: 5px 0 0 0; font-size: 14px; word-break: break-all;">
            ${resetUrl}
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
          <p>Best regards,<br>The Finlytics Team</p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendPortfolioSummaryEmail(user, portfolioData) {
    const subject = "Your Weekly Portfolio Summary";
    const {
      totalValue,
      totalPnL,
      totalPnLPercentage,
      topPerformers,
      worstPerformers,
    } = portfolioData;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Portfolio Summary</h1>
          <p style="color: #64748b; margin: 5px 0 0 0;">Week ending ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Hello ${user.name}!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            Here's your weekly portfolio performance summary.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background-color: ${
            totalPnL >= 0 ? "#dcfce7" : "#fef2f2"
          }; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b;">Total Value</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1e293b;">
              ${formatCurrency(totalValue)}
            </p>
          </div>
          <div style="background-color: ${
            totalPnL >= 0 ? "#dcfce7" : "#fef2f2"
          }; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b;">P&L</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${
              totalPnL >= 0 ? "#059669" : "#dc2626"
            };">
              ${formatCurrency(totalPnL)} (${formatPercentage(
      totalPnLPercentage
    )})
            </p>
          </div>
        </div>

        ${
          topPerformers && topPerformers.length > 0
            ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e293b;">Top Performers</h3>
          ${topPerformers
            .map(
              (asset) => `
            <div style="display: flex; justify-content: space-between; padding: 10px; background-color: #f0fdf4; margin-bottom: 5px; border-radius: 4px;">
              <span style="color: #1e293b;">${asset.symbol}</span>
              <span style="color: #059669; font-weight: 600;">+${formatPercentage(
                asset.change
              )}</span>
            </div>
          `
            )
            .join("")}
        </div>
        `
            : ""
        }

        ${
          worstPerformers && worstPerformers.length > 0
            ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e293b;">Needs Attention</h3>
          ${worstPerformers
            .map(
              (asset) => `
            <div style="display: flex; justify-content: space-between; padding: 10px; background-color: #fef2f2; margin-bottom: 5px; border-radius: 4px;">
              <span style="color: #1e293b;">${asset.symbol}</span>
              <span style="color: #dc2626; font-weight: 600;">${formatPercentage(
                asset.change
              )}</span>
            </div>
          `
            )
            .join("")}
        </div>
        `
            : ""
        }

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            View Full Dashboard
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
          <p>Keep tracking, keep growing!</p>
          <p>Best regards,<br>The Finlytics Team</p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      logger.info("Email service connection verified successfully");
      return true;
    } catch (error) {
      logger.error("Email service connection failed:", error);
      throw error;
    }
  }
}

module.exports = new EmailService();
