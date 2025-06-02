const request = require("supertest");
const app = require("../server");
const User = require("../src/models/User");
const { connectDB, disconnectDB } = require("./helpers/testDb");

describe("Authentication Endpoints", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined();
    });

    it("should fail with invalid email", async () => {
      const userData = {
        firstName: "Test",
        lastName: "User",
        email: "invalid-email",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it("should fail with weak password", async () => {
      const userData = {
        firstName: "Test",
        lastName: "User",
        email: "test2@example.com",
        password: "123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it("should fail with duplicate email", async () => {
      const userData = {
        firstName: "Test",
        lastName: "User",
        email: "test3@example.com",
        password: "Password123!",
      };

      // Register first user
      await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        firstName: "Test",
        lastName: "User",
        email: "login@example.com",
        password: "Password123!",
        emailVerified: true,
      });
      await user.save();
    });

    it("should login successfully with valid credentials", async () => {
      const loginData = {
        email: "login@example.com",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
    });

    it("should fail with invalid email", async () => {
      const loginData = {
        email: "wrong@example.com",
        password: "Password123!",
      };
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid email or password");
    });

    it("should fail with invalid password", async () => {
      const loginData = {
        email: "login@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid email or password");
    });
  });

  describe("GET /api/v1/auth/profile", () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Create and login user
      const user = new User({
        firstName: "Profile",
        lastName: "User",
        email: "profile@example.com",
        password: "Password123!",
        emailVerified: true,
      });
      await user.save();
      userId = user._id;

      const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: "profile@example.com",
        password: "Password123!",
      });

      authToken = loginResponse.body.token;
    });

    it("should get user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe("profile@example.com");
      expect(response.body.user.password).toBeUndefined();
    });
    it("should fail without authentication token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/profile")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access token required");
    });

    it("should fail with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", "Bearer invalidtoken")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    beforeEach(async () => {
      const user = new User({
        firstName: "Forgot",
        lastName: "User",
        email: "forgot@example.com",
        password: "Password123!",
        emailVerified: true,
      });
      await user.save();
    });
    it("should send reset email for valid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "forgot@example.com" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "password reset link has been sent"
      );
    });
    it("should not reveal non-existent email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nonexistent@example.com" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "password reset link has been sent"
      );
    });
  });
});
