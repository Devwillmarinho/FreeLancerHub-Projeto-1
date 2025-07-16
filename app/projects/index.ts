import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Esquema de validação com Zod
const createProjectSchema = z.object({
  title: z.string().min(5, "O título deve ter no mínimo 5 caracteres."),
  description: z
    .string()
    .min(20, "A descrição deve ter no mínimo 20 caracteres."),
  budget: z.number().positive("O orçamento deve ser um valor positivo."),
  deadline: z.string().datetime().optional(),
  required_skills: z
    .array(z.string())
    .min(1, "Pelo menos uma habilidade é necessária."),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createServerSupabaseClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 1. Verificação de Autenticação
  if (!session) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  // Busca o tipo do usuário no seu banco de dados
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (req.method === "POST") {
    // 2. Verificação de Autorização
    if (user?.user_type !== "company") {
      return res
        .status(403)
        .json({ error: "Apenas empresas podem criar projetos." });
    }

    try {
      // 3. Validação de Dados
      const projectData = createProjectSchema.parse(req.body);

      const newProject = await prisma.project.create({
        data: {
          ...projectData,
          company_id: user.id, // Associa o projeto à empresa logada
        },
      });

      return res.status(201).json(newProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Dados inválidos", details: error.issues });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Implementar o método GET para listar os projetos
  if (req.method === "GET") {
    const projects = await prisma.project.findMany({
      where: { status: "open" },
    });
    return res.status(200).json(projects);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Método ${req.method} não permitido`);
}
