const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateTokens, generateSecureToken } = require("../utils/helpers");
const { cache, CACHE_KEYS, CACHE_TTL } = require("../utils/cache");
const emailService = require("./emailService");
const logger = require("../utils/logger");

class AuthService {
  // Register new user
  async register(userData) {
    try {
      const { email, password, firstName, lastName } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        emailVerificationToken: generateSecureToken(),
      });

      await user.save();

      // Generate tokens
      const tokens = generateTokens({ userId: user._id });

      // Send verification email (don't await to avoid blocking)
      this.sendVerificationEmail(user).catch((error) => {
        logger.error("Failed to send verification email:", error);
      });

      // Remove sensitive data
      const userResponse = user.toJSON();
      delete userResponse.emailVerificationToken;

      logger.info(`New user registered: ${email}`);

      return {
        user: userResponse,
        tokens,
      };
    } catch (error) {
      logger.error("Registration error:", error);
      throw error;
    }
  }

  // Login user
  async login(email, password, ipAddress = null) {
    try {
      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
      const tokens = generateTokens({ userId: user._id });

      // Cache user data
      await cache.set(
        CACHE_KEYS.USER_PROFILE(user._id),
        user.toJSON(),
        CACHE_TTL.USER_PROFILE
      );

      logger.info(`User logged in: ${email}`, { userId: user._id, ipAddress });

      return {
        user: user.toJSON(),
        tokens,
      };
    } catch (error) {
      logger.error("Login error:", error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new Error("Invalid refresh token");
      }

      // Generate new tokens
      const tokens = generateTokens({ userId: user._id });

      return {
        user: user.toJSON(),
        tokens,
      };
    } catch (error) {
      logger.error("Token refresh error:", error);
      throw error;
    }
  }

  // Logout user (invalidate tokens - would need token blacklist in production)
  async logout(userId) {
    try {
      // Clear cached user data
      await cache.del(CACHE_KEYS.USER_PROFILE(userId));

      logger.info(`User logged out: ${userId}`);
      return true;
    } catch (error) {
      logger.error("Logout error:", error);
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if email exists or not
        return { message: "If the email exists, a reset link has been sent" };
      }

      // Generate reset token
      const resetToken = generateSecureToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await user.save();

      // Send reset email
      await this.sendPasswordResetEmail(user, resetToken);

      logger.info(`Password reset requested: ${email}`);

      return { message: "If the email exists, a reset link has been sent" };
    } catch (error) {
      logger.error("Password reset request error:", error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Clear cached user data
      await cache.del(CACHE_KEYS.USER_PROFILE(user._id));

      logger.info(`Password reset completed: ${user.email}`);

      return { message: "Password has been reset successfully" };
    } catch (error) {
      logger.error("Password reset error:", error);
      throw error;
    }
  }

  // Change password (authenticated user)
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Clear cached user data
      await cache.del(CACHE_KEYS.USER_PROFILE(userId));

      logger.info(`Password changed: ${user.email}`);

      return { message: "Password has been changed successfully" };
    } catch (error) {
      logger.error("Password change error:", error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const user = await User.findOne({ emailVerificationToken: token });
      if (!user) {
        throw new Error("Invalid verification token");
      }

      // Mark email as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();

      // Clear cached user data
      await cache.del(CACHE_KEYS.USER_PROFILE(user._id));

      logger.info(`Email verified: ${user.email}`);

      return { message: "Email has been verified successfully" };
    } catch (error) {
      logger.error("Email verification error:", error);
      throw error;
    }
  }

  // Resend verification email
  async resendVerificationEmail(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.isEmailVerified) {
        throw new Error("Email is already verified");
      }

      // Generate new verification token if not exists
      if (!user.emailVerificationToken) {
        user.emailVerificationToken = generateSecureToken();
        await user.save();
      }

      // Send verification email
      await this.sendVerificationEmail(user);

      logger.info(`Verification email resent: ${user.email}`);

      return { message: "Verification email has been sent" };
    } catch (error) {
      logger.error("Resend verification email error:", error);
      throw error;
    }
  }

  // Google OAuth login/register
  async googleAuth(profile) {
    try {
      let user = await User.findOne({
        $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
      });

      if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }

        // Update last login
        await user.updateLastLogin();
      } else {
        // Create new user
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          profilePicture: profile.photos[0]?.value,
          isEmailVerified: true,
          authProvider: "google",
        });

        await user.save();
        logger.info(`New user created via Google OAuth: ${user.email}`);
      }

      // Generate tokens
      const tokens = generateTokens({ userId: user._id });

      // Cache user data
      await cache.set(
        CACHE_KEYS.USER_PROFILE(user._id),
        user.toJSON(),
        CACHE_TTL.USER_PROFILE
      );

      return {
        user: user.toJSON(),
        tokens,
      };
    } catch (error) {
      logger.error("Google OAuth error:", error);
      throw error;
    }
  }

  // Send verification email
  async sendVerificationEmail(user) {
    try {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${user.emailVerificationToken}`;

      await emailService.sendEmail(
        user.email,
        "Verify Your Email Address",
        "email-verification",
        {
          firstName: user.firstName,
          verificationUrl,
        }
      );

      return true;
    } catch (error) {
      logger.error("Send verification email error:", error);
      throw error;
    }
  }
  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    try {
      // Convert to plain object to avoid serialization issues
      const plainUser = user.toJSON
        ? user.toJSON()
        : {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          };

      await emailService.sendPasswordResetEmail(plainUser, resetToken);

      return true;
    } catch (error) {
      logger.error("Send password reset email error:", error);
      throw error;
    }
  }

  // Get user profile (with caching)
  async getUserProfile(userId) {
    try {
      // Try cache first
      let user = await cache.get(CACHE_KEYS.USER_PROFILE(userId));

      if (!user) {
        // Fetch from database
        user = await User.findById(userId);
        if (!user) {
          throw new Error("User not found");
        }

        // Cache user data
        await cache.set(
          CACHE_KEYS.USER_PROFILE(userId),
          user.toJSON(),
          CACHE_TTL.USER_PROFILE
        );

        user = user.toJSON();
      }

      return user;
    } catch (error) {
      logger.error("Get user profile error:", error);
      throw error;
    }
  }

  // Get user by ID (alias for getUserProfile)
  async getUserById(userId) {
    return this.getUserProfile(userId);
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return user;
    } catch (error) {
      logger.error("Get user by email error:", error);
      throw error;
    }
  }

  // Generate password reset token
  async generatePasswordResetToken(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if email exists or not
        return {
          message: "If the email exists, a password reset link has been sent",
        };
      }

      // Generate reset token
      const resetToken = generateSecureToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await user.save();

      // Send reset email
      await this.sendPasswordResetEmail(user, resetToken);

      logger.info(`Password reset token generated: ${email}`);

      return {
        message: "If the email exists, a password reset link has been sent",
        token: resetToken, // Only for testing - don't expose in production
      };
    } catch (error) {
      logger.error("Generate password reset token error:", error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const allowedUpdates = [
        "firstName",
        "lastName",
        "profilePicture",
        "preferences",
      ];
      const filteredUpdates = {};

      // Filter allowed updates
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }

      const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Clear cached user data
      await cache.del(CACHE_KEYS.USER_PROFILE(userId));

      logger.info(`User profile updated: ${user.email}`);

      return user.toJSON();
    } catch (error) {
      logger.error("Update user profile error:", error);
      throw error;
    }
  }

  // Delete user account
  async deleteAccount(userId, password) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Verify password for local auth users
      if (user.authProvider === "local") {
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          throw new Error("Incorrect password");
        }
      }

      // In production, you might want to soft delete or anonymize data
      await User.findByIdAndDelete(userId);

      // Clear cached data
      await cache.del(CACHE_KEYS.USER_PROFILE(userId));

      logger.info(`User account deleted: ${user.email}`);

      return { message: "Account has been deleted successfully" };
    } catch (error) {
      logger.error("Delete account error:", error);
      throw error;
    }
  }
}

module.exports = new AuthService();
