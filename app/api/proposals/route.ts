import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware, requireUserType } from "@/middleware/auth"
import { z } from "zod"
import { NextRequestWithUser } from "@/types"

export async function GET(request: NextRequestWithUser) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")
    const status = searchParams.get("status")

    const user = request.user

    let query = supabaseAdmin
      .from("proposals")
      .select(`
        *,
        project:projects(id, title, company_id),
        freelancer:users!proposals_freelancer_id_fkey(id, name, avatar_url, skills)
      `)
      .order("created_at", { ascending: false })

    // Filtros baseados no tipo de usuário
    if (user.user_type === "freelancer") {
      query = query.eq("freelancer_id", user.id)
    } else if (user.user_type === "company") {
      // Empresas veem propostas dos seus projetos
      query = query.eq("project.company_id", user.id)
    }

    if (projectId) {
      query = query.eq("project_id", projectId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: proposals, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 })
    }

    return NextResponse.json({ data: proposals })
  } catch (error) {
    console.error("Proposals fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const createProposalSchema = z.object({
  project_id: z.string().uuid({ message: "ID do projeto inválido." }),
  message: z.string().min(10, { message: "A mensagem deve ter pelo menos 10 caracteres." }),
  proposed_budget: z.number().positive({ message: "O orçamento deve ser um número positivo." }),
  estimated_duration: z.string().optional(),
});

export async function POST(request: NextRequestWithUser) {
  const authResult = await requireUserType(["freelancer"])(request)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validation = createProposalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos.", issues: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { project_id, message, proposed_budget, estimated_duration } = validation.data;
    const user = request.user

    // Verificar se o projeto existe e está aberto
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .eq("status", "open")
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found or not open for proposals" }, { status: 404 })
    }

    // Verificar se o freelancer já fez uma proposta para este projeto
    const { data: existingProposal } = await supabaseAdmin
      .from("proposals")
      .select("id")
      .eq("project_id", project_id)
      .eq("freelancer_id", user.id)
      .single()

    if (existingProposal) {
      return NextResponse.json({ error: "You have already submitted a proposal for this project" }, { status: 409 })
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
        project:projects(id, title),
        freelancer:users!proposals_freelancer_id_fkey(id, name, avatar_url)
      `)
      .single()

    if (error) {
      console.error("Proposal creation error:", error)
      return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: proposal,
        message: "Proposal submitted successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Proposal creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
