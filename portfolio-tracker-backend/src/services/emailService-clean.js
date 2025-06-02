const nodemailer = require("nodemailer");

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
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      family: 4, // Force IPv4 to avoid IPv6 connectivity issues
      tls: {
        rejectUnauthorized: false,
      },
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
      console.log(`Email sent successfully to ${to}`);
      return info;
    } catch (error) {
      console.error("Email sending failed:", error);
      throw error;
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${user.email}`;

    const subject = "Password Reset Request";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Password Reset Request</h1>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${user.name},</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
            We received a request to reset your password for your Finlytics account. 
            If you made this request, please click the button below to reset your password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #3b82f6; color: white; 
                      padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                      font-weight: bold; font-size: 16px;">
              Reset Your Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            This link will expire in 1 hour for security reasons. If you didn't request this password reset, 
            please ignore this email and your password will remain unchanged.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            If the button above doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #9ca3af; font-size: 12px;">
          <p>This email was sent from Finlytics Portfolio Tracker</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendWelcomeEmail(user) {
    const subject = "Welcome to Finlytics!";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Welcome to Finlytics!</h1>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${user.name}!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
            Welcome to Finlytics, your comprehensive investment portfolio tracking platform! 
            We're excited to help you take control of your financial future.
          </p>
          
          <h3 style="color: #1f2937; margin-top: 30px;">What you can do with Finlytics:</h3>
          <ul style="color: #4b5563; line-height: 1.6;">
            <li>📊 Track multiple investment portfolios</li>
            <li>💹 Monitor real-time asset performance</li>
            <li>📈 Analyze your investment trends</li>
            <li>🎯 Set and track financial goals</li>
            <li>📱 Access your data anywhere, anytime</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="display: inline-block; background-color: #3b82f6; color: white; 
                      padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                      font-weight: bold; font-size: 16px;">
              Get Started
            </a>
          </div>
        </div>
        
        <div style="text-align: center; color: #9ca3af; font-size: 12px;">
          <p>Thank you for choosing Finlytics!</p>
          <p>Happy investing! 🚀</p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendPortfolioSummaryEmail(user, portfolioData) {
    const subject = "Your Weekly Portfolio Summary";
    const {
      totalValue,
      totalPnL,
      totalPnLPercentage,
      topPerformers,
      worstPerformers,
    } = portfolioData; // Simple formatting functions
    const formatCurrency = (amount) =>
      `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    const formatPercentage = (percent) =>
      `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Portfolio Summary</h1>
          <p style="color: #64748b; margin: 5px 0 0 0;">Week ending ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${user.name}!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
            Here's your weekly portfolio performance summary.
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="background-color: ${
            totalPnL >= 0 ? "#dcfce7" : "#fef2f2"
          }; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Total Value</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">
              ${formatCurrency(totalValue)}
            </p>
          </div>
          <div style="background-color: ${
            totalPnL >= 0 ? "#dcfce7" : "#fef2f2"
          }; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">P&L</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${
              totalPnL >= 0 ? "#059669" : "#dc2626"
            };">
              ${formatCurrency(totalPnL)} (${formatPercentage(
      totalPnLPercentage
    )})
            </p>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="display: inline-block; background-color: #3b82f6; color: white; 
                    padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                    font-weight: bold; font-size: 16px;">
            View Full Dashboard
          </a>
        </div>

        <div style="text-align: center; color: #9ca3af; font-size: 12px;">
          <p>Keep tracking, keep growing!</p>
          <p>Best regards, The Finlytics Team</p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service connection verified successfully");
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error);
      throw error;
    }
  }
}

console.log("Creating EmailService instance...");
module.exports = new EmailService();
