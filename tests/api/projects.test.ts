/**
 * @jest-environment node
 */
import { POST } from "@/app/api/projects/route";
import { createRequest } from "node-mocks-http";

// Adicionar mock para 'next/headers' para evitar o erro "request scope"
jest.mock("next/headers", () => ({
  cookies: () => new Map(),
}));

// Mock do cliente Supabase e validação
const mockGetUser = jest.fn();
const mockInsert = jest.fn();

const mockFrom = jest.fn(() => ({
  insert: mockInsert,
}));

const mockCreateRouteHandlerClient = jest.fn(() => ({
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
}));

jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createRouteHandlerClient: (...args: any[]) =>
    mockCreateRouteHandlerClient(...args),
}));

describe("API /api/projects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    it("deve criar um projeto com sucesso para um usuário do tipo 'company'", async () => {
      const projectData = {
        title: "Novo Projeto de Teste",
        description:
          "Esta é uma descrição detalhada o suficiente para o teste passar.",
        budget: 5000,
        required_skills: ["React", "TypeScript"],
      };

      // Simula um usuário autenticado do tipo 'company'
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "company-user-id",
            user_metadata: { user_type: "company" },
          },
        },
        error: null,
      });

      // Simula o sucesso da inserção no banco
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({
              data: { id: "new-project-id", ...projectData },
              error: null,
            }),
        }),
      });

      const req = createRequest({
        method: "POST",
        json: () => Promise.resolve(projectData),
      });

      const res = await POST(req as any);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.id).toBe("new-project-id");
      expect(json.title).toBe(projectData.title);
      expect(mockFrom).toHaveBeenCalledWith("projects");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...projectData,
          company_id: "company-user-id",
        })
      );
    });

    it("deve retornar erro 403 se um freelancer tentar criar um projeto", async () => {
      const projectData = {
        title: "Projeto Inválido",
        description: "Um freelancer não deveria poder criar isso.",
        budget: 1000,
        required_skills: ["Jest"],
      };

      // Simula um usuário autenticado do tipo 'freelancer'
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "freelancer-user-id",
            user_metadata: { user_type: "freelancer" },
          },
        },
        error: null,
      });

      const req = createRequest({
        method: "POST",
        json: () => Promise.resolve(projectData),
      });

      const res = await POST(req as any);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error).toBe("Apenas empresas podem criar projetos.");
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("deve retornar erro 400 se os dados forem inválidos", async () => {
      const invalidProjectData = {
        title: "a", // menor que 5
        description: "b", // menor que 20
        budget: -100, // não é positivo
        required_skills: [], // array vazio
      };

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "company-user-id",
            user_metadata: { user_type: "company" },
          },
        },
        error: null,
      });

      const req = createRequest({
        method: "POST",
        json: () => Promise.resolve(invalidProjectData),
      });

      const res = await POST(req as any);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.errors).toBeDefined();
      expect(json.errors.title).toBeDefined();
      expect(json.errors.description).toBeDefined();
      expect(json.errors.budget).toBeDefined();
      expect(json.errors.required_skills).toBeDefined();
    });

    it("deve retornar erro 401 se o usuário não estiver autenticado", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const req = createRequest({
        method: "POST",
        json: () => Promise.resolve({}),
      });

      const res = await POST(req as any);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("Não autorizado");
    });
  });
});
