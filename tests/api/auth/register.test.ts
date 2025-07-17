/**
 * @jest-environment node
 */
// Importe a função que será mockada e a rota que será testada
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { POST as registerUser } from "@/app/api/auth/register/route";

// Mock do módulo 'next/headers'
jest.mock("next/headers", () => ({
  cookies: () => new Map(),
}));

// ETAPA 1: Mockar o módulo com uma função de fábrica genérica.
// Esta chamada é "içada" (hoisted) pelo Jest e executada primeiro, sem erros.
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createRouteHandlerClient: jest.fn(),
}));

// ETAPA 2: Agora, o `createRouteHandlerClient` importado é o nosso mock.
// Fazemos um type-cast para que o TypeScript entenda seus métodos (como .mockReturnValue).
const mockedCreateRouteHandlerClient = createRouteHandlerClient as jest.Mock;

describe("API /api/auth/register", () => {
  // Variável para o mock da função signUp, para ser acessível nos testes
  let mockSignUp: jest.Mock;

  beforeEach(() => {
    // Limpa e reconfigura os mocks antes de cada teste para garantir isolamento.
    mockedCreateRouteHandlerClient.mockClear();
    
    // Cria um novo mock para signUp a cada teste
    mockSignUp = jest.fn();
    
    // Configura o mock principal para retornar um objeto com o nosso mock de signUp
    mockedCreateRouteHandlerClient.mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    });
  });

  it("deve registrar um novo usuário com sucesso", async () => {
    const newUser = {
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      user_type: "freelancer",
      skills: ["React", "Node.js"],
    };

    // Configura o mock de signUp para simular sucesso neste teste
    mockSignUp.mockResolvedValue({
      data: { user: { id: "12345", email: newUser.email } },
      error: null,
    });

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    const res = await registerUser(req);
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

    const authError = {
      message: "User already registered",
      status: 400,
    };
    
    // Configura o mock de signUp para simular erro neste teste
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: authError,
    });

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(existingUser),
    });

    const res = await registerUser(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe(authError.message);
  });
});
