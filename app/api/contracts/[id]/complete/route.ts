import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware } from "@/middleware/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const user = (request as any).user

    // Buscar o contrato
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", params.id)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Verificar se o usuário é a empresa do contrato
    if (contract.company_id !== user.id && user.user_type !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (contract.is_completed) {
      return NextResponse.json({ error: "Contract is already completed" }, { status: 400 })
    }

    // Marcar contrato como completo
    const { error: updateError } = await supabaseAdmin
      .from("contracts")
      .update({
        is_completed: true,
        end_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", params.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to complete contract" }, { status: 500 })
    }

    // Atualizar status do projeto
    await supabaseAdmin.from("projects").update({ status: "completed" }).eq("id", contract.project_id)

    return NextResponse.json({
      message: "Contract completed successfully",
    })
  } catch (error) {
    console.error("Contract completion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
