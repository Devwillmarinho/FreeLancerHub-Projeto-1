import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { authMiddleware, requireUserType } from "@/middleware/auth";
import { z } from "zod";
import { NextRequestWithUser } from "@/types";
import { NextResponse } from 'next/server'


export async function GET(request: NextRequestWithUser) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");
    const user = request.user;

    let query = supabaseAdmin
      .from("proposals")
      .select(`
        *,
        project: projects(id, title, company_id),
        freelancer: profiles(id, full_name, avatar_url, skills)
      `)
      .order("created_at", { ascending: false });

    if (user.user_type === "freelancer") {
      query = query.eq("freelancer_id", user.id);
    } else if (user.user_type === "company") {
      // Busca os IDs dos projetos da empresa para filtrar propostas
      const { data: projects, error: projectsError } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("company_id", user.id);

      if (projectsError) {
        console.error("Erro ao buscar projetos da empresa:", projectsError);
        return NextResponse.json({ error: "Falha ao buscar projetos da empresa" }, { status: 500 });
      }

      const projectIds = projects?.map((p) => p.id) || [];
      query = query.in("project_id", projectIds);
    }

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: proposals, error } = await query;

    if (error) {
      console.error("Erro ao buscar propostas:", error);
      return NextResponse.json({ error: "Falha ao buscar propostas" }, { status: 500 });
    }

    return NextResponse.json({ data: proposals });
  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

const createProposalSchema = z.object({
  project_id: z.string().uuid({ message: "ID do projeto inválido." }),
  message: z.string().min(10, { message: "A mensagem deve ter pelo menos 10 caracteres." }),
  proposed_budget: z.number().positive({ message: "O orçamento deve ser um número positivo." }),
  estimated_duration: z.string().optional(),
});

export async function POST(request: NextRequestWithUser) {
  const authResult = await requireUserType(["freelancer"])(request);
  if (authResult) return authResult;

  try {
    const body = await request.json();
    const validation = createProposalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos.", issues: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { project_id, message, proposed_budget, estimated_duration } = validation.data;
    const user = request.user;

    // Verificar se o projeto existe e está aberto
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .eq("status", "open")
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Projeto não encontrado ou não está aberto para propostas" }, { status: 404 });
    }

    // Verificar se o freelancer já fez uma proposta para este projeto
    const { data: existingProposal } = await supabaseAdmin
      .from("proposals")
      .select("id")
      .eq("project_id", project_id)
      .eq("freelancer_id", user.id)
      .single();

    if (existingProposal) {
      return NextResponse.json({ error: "Você já enviou uma proposta para este projeto" }, { status: 409 });
    }

    const { data: proposal, error } = await supabaseAdmin
      .from("proposals")
      .insert({
        project_id,
        freelancer_id: user.id,
        message,
        proposed_budget,
        estimated_duration,
        status: "pending",
      })
      .select(`
        *,
        project: projects(id, title),
        freelancer: profiles(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Erro ao criar proposta:", error);
      return NextResponse.json({ error: "Falha ao criar proposta" }, { status: 500 });
    }

    return NextResponse.json(
      {
        data: proposal,
        message: "Proposta enviada com sucesso",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar proposta:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
