import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware, requireUserType } from "@/middleware/auth"
import { NextRequestWithUser } from "@/types"

export async function GET(request: NextRequestWithUser) {
  // Rota pública para ver as avaliações de um usuário específico
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "O parâmetro 'user_id' é obrigatório." }, { status: 400 })
    }

    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select(`*, reviewer:users!reviews_reviewer_id_fkey(id, name, avatar_url)`)
      .eq("reviewed_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: reviews })
  } catch (error: any) {
    console.error("Reviews GET error:", error)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

const createReviewSchema = z.object({
  contract_id: z.string().uuid(),
  reviewed_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).optional(),
})

export async function POST(request: NextRequestWithUser) {
  const authResult = await requireUserType(["company", "freelancer"])(request)
  if (authResult) return authResult

  try {
    const user = request.user
    const body = await request.json()
    const validation = createReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos.", issues: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const { contract_id, reviewed_id, rating, comment } = validation.data

    // Verificar se o contrato existe, está completo e se o usuário é parte dele
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("is_completed, company_id, freelancer_id")
      .eq("id", contract_id)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 })
    }

    if (!contract.is_completed) {
      return NextResponse.json({ error: "Só é possível avaliar após a conclusão do contrato." }, { status: 403 })
    }

    const isParticipant = contract.company_id === user.id || contract.freelancer_id === user.id
    if (!isParticipant) {
      return NextResponse.json({ error: "Você não faz parte deste contrato." }, { status: 403 })
    }

    // Verificar se o usuário já avaliou este contrato
    const { data: existingReview } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("contract_id", contract_id)
      .eq("reviewer_id", user.id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: "Você já avaliou este contrato." }, { status: 409 })
    }

    // Inserir a avaliação
    const { data: newReview, error: insertError } = await supabaseAdmin
      .from("reviews")
      .insert({
        contract_id,
        reviewer_id: user.id,
        reviewed_id,
        rating,
        comment,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ data: newReview, message: "Avaliação enviada com sucesso." }, { status: 201 })
  } catch (error: any) {
    console.error("Review creation error:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 })
  }
}
