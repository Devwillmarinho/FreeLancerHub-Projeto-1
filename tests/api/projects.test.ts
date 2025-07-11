/**
 * @jest-environment node
 */
import { POST } from "@/app/api/projects/route";
import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import * as AuthMiddleware from "@/middleware/auth";

// Mock das dependências
jest.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

// Mock do middleware de autenticação
jest.mock("@/middleware/auth", () => ({
  ...jest.requireActual("@/middleware/auth"), // Importa as funções reais
  requireUserType: jest.fn(), // Mocka apenas a função que queremos controlar
}));

const mockRequireUserType = AuthMiddleware.requireUserType as jest.Mock;

describe("API /api/projects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    test("deve criar um projeto com sucesso para um usuário do tipo 'company'", async () => {
      const mockUser = { id: "company-user-id", user_type: "company" };
      const projectData = {
        title: "Novo Projeto de Teste",
        description: "Descrição detalhada do novo projeto de teste.",
        budget: 5000,
        required_skills: ["React", "Node.js"],
      };

      // Configura o mock do middleware para simular um usuário autenticado
      mockRequireUserType.mockImplementation(() => (request: NextRequest) => {
        (request as any).user = mockUser;
        return null; // Retorna null para indicar sucesso na autenticação
      });

      // Configura o mock do Supabase para simular a inserção no banco
      (
        supabaseAdmin.from("projects").insert().select().single as jest.Mock
      ).mockResolvedValueOnce({
        data: { id: "new-project-id", ...projectData, company_id: mockUser.id },
        error: null,
      });

      const req = {
        json: async () => projectData,
      } as NextRequest;

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.title).toBe(projectData.title);
      expect(body.message).toBe("Project created successfully");
    });

    test("deve retornar erro 403 se um freelancer tentar criar um projeto", async () => {
      const mockUser = { id: "freelancer-user-id", user_type: "freelancer" };

      // Configura o mock do middleware para retornar um erro de permissão
      mockRequireUserType.mockImplementation(
        (types) => (request: NextRequest) => {
          if (!types.includes(mockUser.user_type)) {
            const { NextResponse } = require("next/server");
            return NextResponse.json(
              { error: "Access denied. Required user type: company" },
              { status: 403 }
            );
          }
          return null;
        }
      );

      const req = {
        json: async () => ({ title: "Projeto Inválido" }),
      } as NextRequest;

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toContain("Access denied");
    });
  });
});
