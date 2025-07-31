import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { requireUserType } from "@/middleware/auth"
import { NextRequestWithUser } from "@/types"

const updateContractSchema = z.object({
  is_completed: z.boolean().optional(),
})

export async function PUT(request: NextRequestWithUser, { params }: { params: { id: string } }) {
  // Apenas freelancers podem marcar um contrato como concluído neste fluxo.
  const authResult = await requireUserType(["freelancer"])(request)
  if (authResult) return authResult

  const contractId = params.id
  const user = request.user

  try {
    const body = await request.json()
    const validation = updateContractSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos.", issues: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const { is_completed } = validation.data

    // 1. Verifica se o contrato existe e se o usuário é o freelancer associado a ele.
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("id, project_id, freelancer_id")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 })
    }

    if (contract.freelancer_id !== user.id) {
      return NextResponse.json({ error: "Ação não permitida. Você não é o freelancer deste contrato." }, { status: 403 })
    }

    // 2. Atualiza o status do contrato.
    const { data: updatedContract, error: updateContractError } = await supabaseAdmin
      .from("contracts")
      .update({ is_completed })
      .eq("id", contractId)
      .select()
      .single()

    if (updateContractError) throw updateContractError

    // 3. Se o contrato foi concluído, atualiza também o status do projeto.
    if (is_completed) {
      const { error: updateProjectError } = await supabaseAdmin
        .from("projects")
        .update({ status: "completed" })
        .eq("id", contract.project_id)

      if (updateProjectError) {
        // Em um cenário real, usar uma transaction seria ideal aqui.
        console.error(`Falha ao atualizar o status do projeto ${contract.project_id} para 'completed':`, updateProjectError)
      }
    }

    return NextResponse.json({ data: updatedContract, message: "Contrato atualizado com sucesso." })
  } catch (error: any) {
    console.error(`Erro ao atualizar contrato ${contractId}:`, error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 })
  }
}