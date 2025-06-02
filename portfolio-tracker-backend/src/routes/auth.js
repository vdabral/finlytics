const express = require("express");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const authService = require("../services/authService");
const emailService = require("../services/emailService");
const { authenticateToken } = require("../middleware/auth");
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors,
  validatePasswordReset,
  validatePasswordUpdate,
  changePasswordValidation,
  validatePasswordResetToken,
} = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:
    process.env.NODE_ENV === "test"
      ? 1000
      : process.env.NODE_ENV === "development"
      ? 50
      : 5, // Higher limit for development and tests
  message: {
    error: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:
    process.env.NODE_ENV === "test"
      ? 1000
      : process.env.NODE_ENV === "development"
      ? 100
      : 20, // Higher limit for development and tests
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  authLimiter,
  validateUserRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      const result = await authService.register({
        firstName,
        lastName,
        email,
        password,
      });

      logger.info("User registered successfully", {
        email,
        userId: result.user._id,
      });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(result.user);
      } catch (emailError) {
        logger.error("Failed to send welcome email:", emailError);
        // Don't fail registration if email fails
      }
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: result.user._id,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          isEmailVerified: result.user.isEmailVerified,
        },
        token: result.tokens.accessToken,
      });
    } catch (error) {
      logger.error("Registration error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Registration failed",
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  "/login",
  authLimiter,
  validateUserLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      logger.info("User logged in successfully", {
        email,
        userId: result.user._id,
      });
      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: result.user._id,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          isEmailVerified: result.user.isEmailVerified,
          role: result.user.role,
        },
        token: result.tokens.accessToken,
      });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(401).json({
        success: false,
        message: error.message || "Login failed",
      });
    }
  }
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  "/forgot-password",
  authLimiter,
  validatePasswordReset,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email } = req.body;

      // The authService will handle both token generation and email sending
      await authService.generatePasswordResetToken(email);

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      });
    } catch (error) {
      logger.error("Forgot password error:", error);
      res.json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      });
    }
  }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password
 * @access  Public
 */
router.post(
  "/reset-password",
  authLimiter,
  validatePasswordResetToken,
  async (req, res) => {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      logger.info("Password reset successfully");
      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      logger.error("Reset password error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to reset password",
      });
    }
  }
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  "/change-password",
  authenticateToken,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long"),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      await authService.changePassword(userId, currentPassword, newPassword);

      logger.info("Password changed successfully", { userId });

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      logger.error("Change password error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Password change failed",
      });
    }
  }
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch profile",
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  "/profile",
  authenticateToken,
  [
    body("name").optional().trim().isLength({ min: 2, max: 50 }),
    body("preferences").optional().isObject(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      const user = await authService.updateProfile(userId, updateData);

      logger.info("Profile updated successfully", { userId });

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            role: user.role,
            preferences: user.preferences,
          },
        },
      });
    } catch (error) {
      logger.error("Update profile error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Profile update failed",
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post("/refresh-token", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const newToken = await authService.generateToken(userId);

    res.json({
      success: true,
      data: { token: newToken },
    });
  } catch (error) {
    logger.error("Token refresh error:", error);
    res.status(400).json({
      success: false,
      message: "Token refresh failed",
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // In a production app, you might want to maintain a blacklist of tokens
    // For now, we'll just return success as the client will remove the token

    logger.info("User logged out", { userId: req.user.id });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(400).json({
      success: false,
      message: "Logout failed",
    });
  }
});

/**
 * @route   GET /api/auth/google
 * @desc    Google OAuth login
 * @access  Public
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      const token = await authService.generateToken(req.user._id); // Redirect to frontend with token
      const redirectUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/auth/callback?token=${token}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error("Google OAuth callback error:", error);
      const errorUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/auth/error`;
      res.redirect(errorUrl);
    }
  }
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  "/verify-email",
  [body("token").notEmpty().withMessage("Verification token is required")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { token } = req.body;

      await authService.verifyEmail(token);

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      logger.error("Email verification error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Email verification failed",
      });
    }
  }
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Private
 */
router.post(
  "/resend-verification",
  authenticateToken,
  generalLimiter,
  async (req, res) => {
    try {
      const user = await authService.getUserById(req.user.id);

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      const verificationToken =
        await authService.generateEmailVerificationToken(user._id);

      try {
        await emailService.sendEmailVerification(user, verificationToken);
      } catch (emailError) {
        logger.error("Failed to send verification email:", emailError);
        throw new Error("Failed to send verification email");
      }

      res.json({
        success: true,
        message: "Verification email sent successfully",
      });
    } catch (error) {
      logger.error("Resend verification error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to resend verification email",
      });
    }
  }
);

module.exports = router;
