/**
 * @jest-environment node
 */
import { POST } from "@/app/api/reviews/route"
import { DELETE, PUT } from "@/app/api/reviews/[id]/route"
import { type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import * as AuthMiddleware from "@/middleware/auth"

// Mocks mais robustos e específicos por tabela
const mockReviewsTable = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}
const mockContractsTable = {
  select: jest.fn(),
}

// Mock das dependências
jest.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn((tableName: string) => {
      if (tableName === "reviews") {
        return mockReviewsTable
      }
      if (tableName === "contracts") {
        return mockContractsTable
      }
      // Retorna um mock genérico para outras tabelas, se necessário
      return {
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
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

describe("API /api/reviews", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Limpa os mocks das tabelas antes de cada teste
    Object.values(mockReviewsTable).forEach((mockFn) => mockFn.mockClear())
    Object.values(mockContractsTable).forEach((mockFn) => mockFn.mockClear())
  })

  // Testes para POST /api/reviews
  describe("POST /api/reviews", () => {
    it("deve criar uma avaliação com sucesso", async () => {
      const mockUser = { id: "company-id-1", user_type: "company" }
      const reviewData = {
        contract_id: "contract-id-1",
        reviewed_id: "freelancer-id-1",
        rating: 5,
        comment: "Excelente trabalho!",
      }

      mockRequireUserType.mockImplementation(() => (request: NextRequest) => {
        ;(request as any).user = mockUser
        return null
      })

      // Simula que o contrato existe e está completo
      mockContractsTable.select.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "contract-id-1", is_completed: true, company_id: mockUser.id },
          error: null,
        }),
      })

      // Simula que o usuário ainda não avaliou este contrato
      mockReviewsTable.select.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      // Simula a inserção bem-sucedida
      mockReviewsTable.insert.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "new-review-id", ...reviewData, reviewer_id: mockUser.id },
          error: null,
        }),
      })

      const req = { json: async () => reviewData } as NextRequest
      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.data.comment).toBe(reviewData.comment)
    })
  })

  // Testes para PUT /api/reviews/[id]
  describe("PUT /api/reviews/[id]", () => {
    it("deve atualizar uma avaliação com sucesso se for o autor", async () => {
      const mockUser = { id: "company-id-1", user_type: "company" }
      const reviewId = "review-to-update"
      const updateData = { comment: "Trabalho atualizado e continua excelente!" }

      mockRequireUserType.mockImplementation(() => (request: NextRequest) => {
        ;(request as any).user = mockUser
        return null
      })

      // Simula a busca da avaliação para verificar o autor
      mockReviewsTable.select.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { reviewer_id: mockUser.id },
          error: null,
        }),
      })

      // Simula a atualização bem-sucedida
      mockReviewsTable.update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: reviewId, ...updateData },
          error: null,
        }),
      })

      const req = { json: async () => updateData } as NextRequest
      const response = await PUT(req, { params: { id: reviewId } })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data.comment).toBe(updateData.comment)
    })
  })

  // Testes para DELETE /api/reviews/[id]
  describe("DELETE /api/reviews/[id]", () => {
    it("deve deletar uma avaliação com sucesso se for o autor", async () => {
      const mockUser = { id: "company-id-1", user_type: "company" }
      const reviewId = "review-to-delete"

      mockAuthMiddleware.mockImplementation(async (request: NextRequest) => {
        ;(request as any).user = mockUser
        return null
      })

      // Simula a verificação de permissão (encontra a avaliação e o autor é o mockUser)
      mockReviewsTable.select.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { reviewer_id: mockUser.id },
          error: null,
        }),
      })

      // Simula a deleção bem-sucedida (CORRIGIDO)
      mockReviewsTable.delete.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
          data: {}, // A deleção bem-sucedida não retorna dados, mas o mock precisa resolver.
        }),
      })

      const req = {} as NextRequest // DELETE não tem corpo
      const response = await DELETE(req, { params: { id: reviewId } }) // CORRIGIDO: Chamando a função DELETE
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.message).toBe("Avaliação deletada com sucesso.")
    })

    it("deve retornar erro 403 ao tentar deletar a avaliação de outro usuário", async () => {
      const mockUser = { id: "attacker-id", user_type: "freelancer" }
      const reviewId = "review-to-delete"

      mockAuthMiddleware.mockImplementation(async (request: NextRequest) => {
        ;(request as any).user = mockUser
        return null
      })

      // Simula que a avaliação pertence a outro usuário
      mockReviewsTable.select.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { reviewer_id: "original-author-id" },
          error: null,
        }),
      })

      const req = {} as NextRequest
      const response = await DELETE(req, { params: { id: reviewId } })

      expect(response.status).toBe(403)
    })
  })
})
