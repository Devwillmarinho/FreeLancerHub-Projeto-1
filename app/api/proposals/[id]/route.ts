import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware } from "@/middleware/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const user = (request as any).user
    const { status } = body

    if (!status || !["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Buscar a proposta com informações do projeto
    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from("proposals")
      .select(`
        *,
        project:projects(id, company_id, status)
      `)
      .eq("id", params.id)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    // Verificar se o usuário é a empresa dona do projeto
    if (proposal.project.company_id !== user.id && user.user_type !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Verificar se o projeto ainda está aberto
    if (proposal.project.status !== "open") {
      return NextResponse.json({ error: "Project is no longer open for proposals" }, { status: 400 })
    }

    // Atualizar a proposta
    const { data: updatedProposal, error: updateError } = await supabaseAdmin
      .from("proposals")
      .update({ status })
      .eq("id", params.id)
      .select(`
        *,
        project:projects(id, title),
        freelancer:users!proposals_freelancer_id_fkey(id, name, avatar_url)
      `)
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 })
    }

    // Se a proposta foi aceita, atualizar o projeto
    if (status === "accepted") {
      // Rejeitar todas as outras propostas do projeto
      await supabaseAdmin
        .from("proposals")
        .update({ status: "rejected" })
        .eq("project_id", proposal.project_id)
        .neq("id", params.id)

      // Atualizar o projeto com o freelancer e status
      await supabaseAdmin
        .from("projects")
        .update({
          freelancer_id: proposal.freelancer_id,
          status: "in_progress",
        })
        .eq("id", proposal.project_id)

      // Criar contrato
      await supabaseAdmin.from("contracts").insert({
        project_id: proposal.project_id,
        company_id: proposal.project.company_id,
        freelancer_id: proposal.freelancer_id,
        budget: proposal.proposed_budget,
        start_date: new Date().toISOString().split("T")[0],
        terms: `Contrato para o projeto. Orçamento: R$ ${proposal.proposed_budget}. Prazo estimado: ${proposal.estimated_duration || "Não especificado"} dias.`,
      })
    }

    return NextResponse.json({
      data: updatedProposal,
      message: `Proposal ${status} successfully`,
    })
  } catch (error) {
    console.error("Proposal update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
