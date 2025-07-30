import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware } from "@/middleware/auth"
import { NextRequestWithUser } from "@/types"

const updateContractSchema = z.object({
  is_completed: z.boolean(),
})

export async function PUT(request: NextRequestWithUser, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const user = request.user
    const contractId = params.id
    const body = await request.json()

    const validation = updateContractSchema.safeParse(body)
    if (!validation.success || !validation.data.is_completed) {
      return NextResponse.json({ error: "Apenas é permitido marcar um contrato como concluído." }, { status: 400 })
    }

    // 1. Verificar se o contrato existe
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("company_id, freelancer_id")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 })
    }

    // 2. Apenas o freelancer do projeto pode marcá-lo como concluído.
    if (user.user_type !== "freelancer" || user.id !== contract.freelancer_id) {
      return NextResponse.json({ error: "Apenas o freelancer do projeto pode marcá-lo como concluído." }, { status: 403 })
    }

    // 3. Atualizar o contrato
    const { data: updatedContract, error: updateError } = await supabaseAdmin
      .from("contracts")
      .update({ is_completed: true })
      .eq("id", contractId)
      .select()
      .single()

    if (updateError) throw updateError

    // 4. Atualizar o status do projeto para 'completed'
    if (contract.project_id) {
      const { error: projectUpdateError } = await supabaseAdmin
        .from("projects")
        .update({ status: "completed" })
        .eq("id", contract.project_id)

      if (projectUpdateError) {
        // Loga o erro mas não falha a requisição, pois a ação principal (completar o contrato) foi bem-sucedida.
        console.error(`Falha ao atualizar o status do projeto para o contrato ${contractId}:`, projectUpdateError)
      }
    }

    return NextResponse.json({ data: updatedContract, message: "Contrato atualizado com sucesso." })
  } catch (error: any) {
    console.error("Contract update error:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 })
  }
}