const request = require("supertest")
const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

describe("Proposals API", () => {
  let server
  let companyToken
  let freelancerToken
  let projectId

  beforeAll(async () => {
    await app.prepare()
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true)
      handle(req, res, parsedUrl)
    })

    // Setup test data
    const companyUser = {
      email: "company2@test.com",
      password: "password123",
      name: "Test Company 2",
      user_type: "company",
      company_name: "Test Corp 2",
    }

    const freelancerUser = {
      email: "freelancer2@test.com",
      password: "password123",
      name: "Test Freelancer 2",
      user_type: "freelancer",
      skills: ["JavaScript", "React"],
    }

    const companyResponse = await request(server).post("/api/auth/register").send(companyUser)
    companyToken = companyResponse.body.data.token

    const freelancerResponse = await request(server).post("/api/auth/register").send(freelancerUser)
    freelancerToken = freelancerResponse.body.data.token

    // Create a test project
    const projectData = {
      title: "Test Project for Proposals",
      description: "This is a test project description for proposals testing",
      budget: 5000,
      required_skills: ["JavaScript", "React"],
    }

    const projectResponse = await request(server)
      .post("/api/projects")
      .set("Authorization", `Bearer ${companyToken}`)
      .send(projectData)

    projectId = projectResponse.body.data.id
  })

  afterAll(() => {
    server.close()
  })

  describe("POST /api/proposals", () => {
    test("should create a proposal as freelancer", async () => {
      const proposalData = {
        project_id: projectId,
        message: "I am interested in this project and have the required skills",
        proposed_budget: 4500,
        estimated_duration: 30,
      }

      const response = await request(server)
        .post("/api/proposals")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send(proposalData)
        .expect(201)

      expect(response.body.data).toHaveProperty("id")
      expect(response.body.data.message).toBe(proposalData.message)
      expect(response.body.data.status).toBe("pending")
    })

    test("should fail to create proposal as company", async () => {
      const proposalData = {
        project_id: projectId,
        message: "Test message",
        proposed_budget: 4500,
      }

      const response = await request(server)
        .post("/api/proposals")
        .set("Authorization", `Bearer ${companyToken}`)
        .send(proposalData)
        .expect(403)

      expect(response.body).toHaveProperty("error")
    })

    test("should fail with short message", async () => {
      const proposalData = {
        project_id: projectId,
        message: "Short",
        proposed_budget: 4500,
      }

      const response = await request(server)
        .post("/api/proposals")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send(proposalData)
        .expect(400)

      expect(response.body.error).toContain("Message must be at least 10 characters")
    })

    test("should fail with duplicate proposal", async () => {
      const proposalData = {
        project_id: projectId,
        message: "Another proposal for the same project",
        proposed_budget: 4000,
      }

      const response = await request(server)
        .post("/api/proposals")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send(proposalData)
        .expect(409)

      expect(response.body.error).toContain("already submitted a proposal")
    })
  })

  describe("GET /api/proposals", () => {
    test("should fetch proposals for freelancer", async () => {
      const response = await request(server)
        .get("/api/proposals")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .expect(200)

      expect(response.body).toHaveProperty("data")
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test("should fetch proposals for company", async () => {
      const response = await request(server)
        .get("/api/proposals")
        .set("Authorization", `Bearer ${companyToken}`)
        .expect(200)

      expect(response.body).toHaveProperty("data")
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })
})
