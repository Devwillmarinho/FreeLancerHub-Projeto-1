/**
 * @jest-environment node
 */
import { POST } from "@/app/api/auth/login/route"
import { type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { comparePassword, generateToken } from "@/lib/auth"

// Mock das dependências para isolar o teste da rota
jest.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}))
jest.mock("@/lib/auth")

describe("API /api/auth/login", () => {
  it("should return 400 if email or password are not provided", async () => {
    const req = {
      json: async () => ({}),
    } as NextRequest;

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Email and password are required");
  });

  it("should return 401 for invalid credentials (user not found)", async () => {
    // Simula que o usuário não foi encontrado no banco
    ;(supabaseAdmin.from("users").select().eq().eq().single as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: "User not found" },
    })

    const req = {
      json: async () => ({ email: "nouser@test.com", password: "password" }),
    } as NextRequest

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe("Invalid credentials")
  })

  it("should return 401 for invalid credentials (wrong password)", async () => {
    const mockUser = {
      id: "123",
      email: "empresa1@test.com",
      password_hash: "hashed_password",
    }
    // Simula que o usuário foi encontrado
    ;(supabaseAdmin.from("users").select().eq().eq().single as jest.Mock).mockResolvedValueOnce({
      data: mockUser,
      error: null,
    })
    // Simula que a senha é inválida
    ;(comparePassword as jest.Mock).mockResolvedValueOnce(false)

    const req = {
      json: async () => ({ email: "empresa1@test.com", password: "wrong_password" }),
    } as NextRequest

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe("Invalid credentials")
  })

  it("should return 200 and a token for valid credentials", async () => {
    const mockUser = {
      id: "123",
      email: "empresa1@test.com",
      password_hash: "hashed_password",
      name: "João Silva",
      user_type: "company",
    }

    // Simula que o usuário foi encontrado
    ;(supabaseAdmin.from("users").select().eq().eq().single as jest.Mock).mockResolvedValueOnce({
      data: mockUser,
      error: null,
    })
    // Simula que a senha é válida
    ;(comparePassword as jest.Mock).mockResolvedValueOnce(true)
    // Simula a geração do token
    ;(generateToken as jest.Mock).mockReturnValueOnce("fake-jwt-token")

    const req = {
      json: async () => ({ email: "empresa1@test.com", password: "correct_password" }),
    } as NextRequest

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.token).toBe("fake-jwt-token")
    expect(body.data.user.password_hash).toBeUndefined()
  })
})
