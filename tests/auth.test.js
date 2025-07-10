const request = require("supertest")
const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

describe("Authentication API", () => {
  let server

  beforeAll(async () => {
    await app.prepare()
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true)
      handle(req, res, parsedUrl)
    })
  })

  afterAll(() => {
    server.close()
  })

  describe("POST /api/auth/register", () => {
    test("should register a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        user_type: "freelancer",
        bio: "Test bio",
        skills: ["JavaScript", "React"],
      }

      const response = await request(server).post("/api/auth/register").send(userData).expect(200)

      expect(response.body.data).toHaveProperty("user")
      expect(response.body.data).toHaveProperty("token")
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user).not.toHaveProperty("password_hash")
    })

    test("should fail with invalid email", async () => {
      const userData = {
        email: "invalid-email",
        password: "password123",
        name: "Test User",
        user_type: "freelancer",
      }

      const response = await request(server).post("/api/auth/register").send(userData).expect(400)

      expect(response.body).toHaveProperty("error")
    })

    test("should fail with short password", async () => {
      const userData = {
        email: "test@example.com",
        password: "123",
        name: "Test User",
        user_type: "freelancer",
      }

      const response = await request(server).post("/api/auth/register").send(userData).expect(400)

      expect(response.body.error).toContain("Password must be at least 6 characters")
    })

    test("should fail with invalid user type", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        user_type: "invalid",
      }

      const response = await request(server).post("/api/auth/register").send(userData).expect(400)

      expect(response.body.error).toContain("Invalid user type")
    })
  })

  describe("POST /api/auth/login", () => {
    test("should login with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      }

      const response = await request(server).post("/api/auth/login").send(loginData).expect(200)

      expect(response.body.data).toHaveProperty("user")
      expect(response.body.data).toHaveProperty("token")
    })

    test("should fail with invalid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      }

      const response = await request(server).post("/api/auth/login").send(loginData).expect(401)

      expect(response.body.error).toBe("Invalid credentials")
    })

    test("should fail with missing fields", async () => {
      const response = await request(server).post("/api/auth/login").send({}).expect(400)

      expect(response.body.error).toContain("Email and password are required")
    })
  })
})
