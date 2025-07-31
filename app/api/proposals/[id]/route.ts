import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { requireUserType } from "@/middleware/auth"
import { NextRequestWithUser } from "@/types"

const updateProposalSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
})

export async function PUT(request: NextRequestWithUser, { params }: { params: { id: string } }) {
  // Apenas usuários do tipo 'company' podem aceitar ou rejeitar propostas.
  const authResult = await requireUserType(["company"])(request)
  if (authResult) return authResult

  const proposalId = params.id
  const user = request.user

  try {
    const body = await request.json()
    const validation = updateProposalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos.", issues: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const { status } = validation.data

    if (status === "rejected") {
      // Lógica para apenas rejeitar uma proposta
      const { data: proposal, error: updateError } = await supabaseAdmin
        .from("proposals")
        .update({ status: "rejected" })
        .eq("id", proposalId)
        .select("id, project:projects(company_id)")
        .single()

      if (updateError || !proposal) {
        return NextResponse.json({ error: "Proposta não encontrada ou falha ao atualizar." }, { status: 404 })
      }

      // Verificação de segurança: garante que o usuário é dono do projeto associado à proposta
      if (proposal.project?.company_id !== user.id) {
        return NextResponse.json({ error: "Ação não permitida." }, { status: 403 })
      }

      return NextResponse.json({ message: "Proposta rejeitada com sucesso." })
    }

    if (status === "accepted") {
      // Usa a função RPC para a transação atômica
      const { error: rpcError } = await supabaseAdmin.rpc("accept_proposal", {
        proposal_id_to_accept: proposalId,
        company_id_check: user.id,
      })

      if (rpcError) {
        // Log aprimorado para depuração no lado do servidor
        console.error("Erro no RPC accept_proposal:", {
          message: rpcError.message,
          details: rpcError.details,
          code: rpcError.code,
        });

        // Fornece uma mensagem de erro mais amigável com base na exceção do RPC
        if (rpcError.message.includes("not found")) {
          return NextResponse.json({ error: "Projeto ou proposta não encontrada." }, { status: 404 })
        }
        if (rpcError.message.includes("not the owner")) {
          return NextResponse.json({ error: "Ação não permitida. Você não é o dono do projeto." }, { status: 403 })
        }
        if (rpcError.message.includes("not open")) {
          return NextResponse.json({ error: "Este projeto não está mais aberto para propostas." }, { status: 409 })
        }
        // Para outros erros de banco de dados, retorna a mensagem de erro exata para a interface.
        return NextResponse.json({
          error: `Ocorreu um erro no banco de dados: ${rpcError.message}`
        }, { status: 500 });
      }

      return NextResponse.json({ message: "Proposta aceita e contrato criado com sucesso!" })
    }
  } catch (error: any) {
    console.error(`Erro ao atualizar proposta ${proposalId}:`, error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 })
  }
}