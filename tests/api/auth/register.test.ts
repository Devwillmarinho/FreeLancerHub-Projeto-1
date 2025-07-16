/**
 * @jest-environment node
 */
import { POST as registerUser } from "@/app/api/auth/register/route";
import { createRequest } from "node-mocks-http";

// Adicionar mock para 'next/headers' para evitar o erro "request scope"
jest.mock("next/headers", () => ({
  cookies: () => new Map(),
}));

// Mock do cliente Supabase
const mockSignUp = jest.fn();
const mockCreateRouteHandlerClient = jest.fn(() => ({
  auth: {
    signUp: mockSignUp,
  },
}));

jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createRouteHandlerClient: (...args: any[]) =>
    mockCreateRouteHandlerClient(...args),
}));

describe("API /api/auth/register", () => {
  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it("deve registrar um novo usuário com sucesso", async () => {
    const newUser = {
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      user_type: "freelancer",
      skills: ["React", "Node.js"],
    };

    // Configura o mock de signUp para sucesso
    mockSignUp.mockResolvedValue({
      data: { user: { id: "12345", email: newUser.email } },
      error: null,
    });

    const req = createRequest({
      method: "POST",
      json: () => Promise.resolve(newUser),
    });

    const res = await registerUser(req as any);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.user).toBeDefined();
    expect(json.user.email).toBe(newUser.email);
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: newUser.email,
        password: newUser.password,
      })
    );
  });

  it("deve falhar se o email já estiver registrado", async () => {
    const existingUser = {
      email: "exists@example.com",
      password: "password123",
      name: "Existing User",
      user_type: "company",
    };

    // Configura o mock de signUp para erro de usuário já existente
    const authError = {
      message: "User already registered",
      status: 400,
    };
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: authError,
    });

    const req = createRequest({
      method: "POST",
      json: () => Promise.resolve(existingUser),
    });

    const res = await registerUser(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe(authError.message);
  });
});
