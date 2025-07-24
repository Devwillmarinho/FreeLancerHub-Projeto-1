/**
 * @jest-environment node
 */
import { GET } from "@/app/api/contracts/route"
import { PUT } from "@/app/api/contracts/[id]/route" // Corrigido
import { type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import * as AuthMiddleware from "@/middleware/auth"

// Mock mais robusto e específico por tabela
const mockContractsTable = {
  select: jest.fn(),
  update: jest.fn(),
}
const mockProjectsTable = {
  update: jest.fn(),
}

// Mock das dependências
jest.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn((tableName: string) => {
      if (tableName === "contracts") {
        return mockContractsTable
      }
      if (tableName === "projects") {
        return mockProjectsTable
      }
      // Retorna um mock genérico para outras tabelas, se necessário
      return {
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
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

describe("API /api/contracts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Limpa os mocks das tabelas antes de cada teste
    Object.values(mockContractsTable).forEach((mockFn) => mockFn.mockClear())
    Object.values(mockProjectsTable).forEach((mockFn) => mockFn.mockClear())
  })

  // Testes para GET /api/contracts
  describe("GET /api/contracts", () => {
    it("deve listar os contratos de uma empresa", async () => {
      const mockUser = { id: "company-id-1", user_type: "company" }
      const mockContracts = [{ id: "contract-1", budget: 5000 }]

      mockAuthMiddleware.mockImplementation(async (request: NextRequest) => {
        ;(request as any).user = mockUser
        return null
      })

      mockContractsTable.select.mockReturnValue({
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockContracts, error: null }),
      })

      const req = { url: "http://localhost/api/contracts" } as NextRequest
      const response = await GET(req)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data).toEqual(mockContracts)
      expect(mockContractsTable.select().eq).toHaveBeenCalledWith("company_id", mockUser.id)
    })
  })

  // Testes para PUT /api/contracts/[id]
  describe("PUT /api/contracts/[id]", () => {
    it("deve permitir que uma empresa finalize um contrato", async () => {
      const mockUser = { id: "company-id-1", user_type: "company" }
      const contractId = "contract-to-finalize"
      const updateData = { is_completed: true }

      mockRequireUserType.mockImplementation(() => (request: NextRequest) => {
        ;(request as any).user = mockUser
        return null
      })

      // Simula a verificação de permissão
      mockContractsTable.select.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { company_id: mockUser.id, project_id: "project-1" },
          error: null,
        }),
      })

      // Simula a atualização do contrato
      mockContractsTable.update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: contractId, ...updateData },
          error: null,
        }),
      })

      // Simula a atualização do projeto (efeito colateral)
      mockProjectsTable.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })

      const req = { json: async () => updateData } as NextRequest
      const response = await PUT(req, { params: { id: contractId } })
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.message).toBe("Contrato atualizado.")
      expect(mockProjectsTable.update).toHaveBeenCalledWith({ status: "completed" })
      expect(mockProjectsTable.update().eq).toHaveBeenCalledWith("id", "project-1")
    })

    it("deve retornar erro 403 se um freelancer tentar finalizar um contrato", async () => {
      const mockUser = { id: "freelancer-id-1", user_type: "freelancer" }
      const contractId = "contract-to-finalize"
      const updateData = { is_completed: true }

      // Simula um erro de permissão do middleware
      mockRequireUserType.mockImplementation((types) => (request: NextRequest) => {
        if (!types.includes(mockUser.user_type)) {
          const { NextResponse } = require("next/server")
          return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
        }
        return null
      })

      const req = { json: async () => updateData } as NextRequest
      const response = await PUT(req, { params: { id: contractId } })

      expect(response.status).toBe(403)
    })
  })
})
