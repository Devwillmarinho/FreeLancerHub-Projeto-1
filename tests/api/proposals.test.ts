/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/proposals/route"
import { type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import * as AuthMiddleware from "@/middleware/auth"

// Mocks mais robustos e específicos por tabela
const mockProposalsTable = {
  select: jest.fn(),
  insert: jest.fn(),
}
const mockProjectsTable = {
  select: jest.fn(),
}

// Mock das dependências
jest.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn((tableName: string) => {
      if (tableName === "proposals") {
        return mockProposalsTable
      }
      if (tableName === "projects") {
        return mockProjectsTable
      }
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
      }
    }),
  },
}))

jest.mock("@/middleware/auth", () => ({
  ...jest.requireActual("@/middleware/auth"),
  authMiddleware: jest.fn(),
  requireUserType: jest.fn(),
}))

const mockAuthMiddleware = AuthMiddleware.authMiddleware as jest.Mock
const mockRequireUserType = AuthMiddleware.requireUserType as jest.Mock

describe("API /api/proposals", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.values(mockProposalsTable).forEach((mockFn) => mockFn.mockClear())
    Object.values(mockProjectsTable).forEach((mockFn) => mockFn.mockClear())
  })

  describe("POST /api/proposals", () => {
    test("deve criar uma proposta com sucesso para um freelancer", async () => {
      const mockUser = { id: "freelancer-id", user_type: "freelancer" }
      const proposalData = {
        project_id: "project-id-1",
        message: "Sou o melhor para este trabalho.",
        proposed_budget: 1000,
      }

      // Simula um freelancer autenticado
      mockRequireUserType.mockImplementation(() => (request: NextRequest) => {
        ;(request as any).user = mockUser
        return null
      })

      // Simula que o projeto existe e está aberto
      mockProjectsTable.select.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "project-id-1", status: "open" },
          error: null,
        }),
      })

      // Simula que não há proposta existente
      mockProposalsTable.select.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      // Simula a inserção bem-sucedida
      mockProposalsTable.insert.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "new-proposal-id", ...proposalData, freelancer_id: mockUser.id },
          error: null,
        }),
      })

      const req = {
        json: async () => proposalData,
      } as NextRequest

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.message).toBe("Proposal submitted successfully")
      expect(body.data.project_id).toBe(proposalData.project_id)
    })

    test("deve falhar se uma empresa tentar criar uma proposta", async () => {
      const mockUser = { id: "company-id", user_type: "company" }

      // Simula um erro de permissão do middleware
      mockRequireUserType.mockImplementation((types) => (request: NextRequest) => {
        if (!types.includes(mockUser.user_type)) {
          const { NextResponse } = require("next/server")
          return NextResponse.json({ error: "Access denied. Required user type: freelancer" }, { status: 403 })
        }
        return null
      })

      const req = {
        json: async () => ({ project_id: "project-id-1", message: "test", proposed_budget: 100 }),
      } as NextRequest

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body.error).toContain("Access denied")
    })
  })

  describe("GET /api/proposals", () => {
    test("deve buscar as propostas de um freelancer", async () => {
      const mockUser = { id: "freelancer-id", user_type: "freelancer" }
      const mockProposals = [{ id: "prop-1", message: "Minha proposta" }]

      mockAuthMiddleware.mockImplementation(async (request: NextRequest) => {
        ;(request as any).user = mockUser
        return null
      })

      mockProposalsTable.select.mockReturnValue({
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockProposals, error: null }),
      })

      const req = { url: "http://localhost/api/proposals" } as NextRequest
      const response = await GET(req)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data).toEqual(mockProposals)
      expect(mockProposalsTable.select().eq).toHaveBeenCalledWith("freelancer_id", mockUser.id)
    })

    test("deve buscar as propostas de um projeto de uma empresa", async () => {
      const mockUser = { id: "company-id", user_type: "company" }
      const mockProposals = [{ id: "prop-2", message: "Proposta do freelancer" }]

      mockAuthMiddleware.mockImplementation(async (request: NextRequest) => {
        ;(request as any).user = mockUser
        return null
      })

      mockProposalsTable.select.mockReturnValue({
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      })
      ;(mockProposalsTable.select().eq as jest.Mock).mockResolvedValue({ data: mockProposals, error: null })

      const req = { url: "http://localhost/api/proposals?project_id=project-1" } as NextRequest
      const response = await GET(req)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data).toEqual(mockProposals)
      expect(mockProposalsTable.select().eq).toHaveBeenCalledWith("project.company_id", mockUser.id)
      expect(mockProposalsTable.select().eq).toHaveBeenCalledWith("project_id", "project-1")
    })
  })
})