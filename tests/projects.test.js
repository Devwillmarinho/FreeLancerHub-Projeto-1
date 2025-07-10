const request = require("supertest")
const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

describe("Projects API", () => {
  let server
  let companyToken
  let freelancerToken

  beforeAll(async () => {
    await app.prepare()
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true)
      handle(req, res, parsedUrl)
    })

    // Create test users and get tokens
    const companyUser = {
      email: "company@test.com",
      password: "password123",
      name: "Test Company",
      user_type: "company",
      company_name: "Test Corp",
    }

    const freelancerUser = {
      email: "freelancer@test.com",
      password: "password123",
      name: "Test Freelancer",
      user_type: "freelancer",
      skills: ["JavaScript", "React"],
    }

    const companyResponse = await request(server).post("/api/auth/register").send(companyUser)
    companyToken = companyResponse.body.data.token

    const freelancerResponse = await request(server).post("/api/auth/register").send(freelancerUser)
    freelancerToken = freelancerResponse.body.data.token
  })

  afterAll(() => {
    server.close()
  })

  describe("POST /api/projects", () => {
    test("should create a project as company", async () => {
      const projectData = {
        title: "Test Project",
        description: "This is a test project description that is long enough",
        budget: 5000,
        deadline: "2024-12-31",
        required_skills: ["JavaScript", "React"],
      }

      const response = await request(server)
        .post("/api/projects")
        .set("Authorization", `Bearer ${companyToken}`)
        .send(projectData)
        .expect(201)

      expect(response.body.data).toHaveProperty("id")
      expect(response.body.data.title).toBe(projectData.title)
      expect(response.body.data.status).toBe("open")
    })

    test("should fail to create project as freelancer", async () => {
      const projectData = {
        title: "Test Project",
        description: "This is a test project description",
        budget: 5000,
        required_skills: ["JavaScript"],
      }

      const response = await request(server)
        .post("/api/projects")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send(projectData)
        .expect(403)

      expect(response.body).toHaveProperty("error")
    })

    test("should fail with missing required fields", async () => {
      const projectData = {
        title: "Test",
      }

      const response = await request(server)
        .post("/api/projects")
        .set("Authorization", `Bearer ${companyToken}`)
        .send(projectData)
        .expect(400)

      expect(response.body).toHaveProperty("error")
    })

    test("should fail with short title", async () => {
      const projectData = {
        title: "Test",
        description: "This is a test project description that is long enough",
        budget: 5000,
        required_skills: ["JavaScript"],
      }

      const response = await request(server)
        .post("/api/projects")
        .set("Authorization", `Bearer ${companyToken}`)
        .send(projectData)
        .expect(400)

      expect(response.body.error).toContain("Title must be at least 5 characters")
    })
  })

  describe("GET /api/projects", () => {
    test("should fetch projects for company", async () => {
      const response = await request(server)
        .get("/api/projects")
        .set("Authorization", `Bearer ${companyToken}`)
        .expect(200)

      expect(response.body).toHaveProperty("data")
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test("should fetch projects for freelancer", async () => {
      const response = await request(server)
        .get("/api/projects")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .expect(200)

      expect(response.body).toHaveProperty("data")
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test("should fail without authentication", async () => {
      const response = await request(server).get("/api/projects").expect(401)

      expect(response.body.error).toBe("Token required")
    })
  })
})
