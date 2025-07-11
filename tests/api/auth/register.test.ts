/**
 * @jest-environment node
 */
import { POST } from "@/app/api/auth/register/route"
import { type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { hashPassword, generateToken } from "@/lib/auth"

// Mock das dependências para isolar o teste da rota
jest.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}))

jest.mock("@/lib/auth", () => ({
  hashPassword: jest.fn(),
  generateToken: jest.fn(),
}))

describe("API /api/auth/register", () => {
  // Limpa os mocks antes de cada teste
  beforeEach(() => {
    ;(supabaseAdmin.from as jest.Mock).mockClear()
    ;(hashPassword as jest.Mock).mockClear()
    ;(generateToken as jest.Mock).mockClear()
  })

  test("deve registrar um novo usuário com sucesso", async () => {
    const userData = {
      email: "newuser@example.com",
      password: "password123",
      name: "New User",
      user_type: "freelancer",
    }

    // Simula as chamadas ao banco de dados e funções de auth
    ;(supabaseAdmin.from("users").select().eq().single as jest.Mock).mockResolvedValueOnce({ data: null }) // Nenhum usuário existente
    ;(hashPassword as jest.Mock).mockResolvedValueOnce("hashed_password")
    ;(supabaseAdmin.from("users").insert().select().single as jest.Mock).mockResolvedValueOnce({
      data: { id: "new-user-id", ...userData, password_hash: "hashed_password" },
      error: null,
    })
    ;(generateToken as jest.Mock).mockReturnValueOnce("new-fake-token")

    const req = {
      json: async () => userData,
    } as NextRequest

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.user.email).toBe(userData.email)
    expect(body.data.token).toBe("new-fake-token")
    expect(body.data.user).not.toHaveProperty("password_hash")
  })

  test("deve falhar se o email já estiver registrado", async () => {
    const userData = {
      email: "existing@example.com",
      password: "password123",
      name: "Existing User",
      user_type: "company",
    }

    // Simula que o usuário já existe no banco
    ;(supabaseAdmin.from("users").select().eq().single as jest.Mock).mockResolvedValueOnce({
      data: { id: "existing-id", email: userData.email },
      error: null,
    })

    const req = {
      json: async () => userData,
    } as NextRequest

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toBe("Email already registered")
  })
})