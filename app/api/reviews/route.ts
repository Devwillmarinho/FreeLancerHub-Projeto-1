import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware } from "@/middleware/auth"

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    let query = supabaseAdmin
      .from("reviews")
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(id, name, avatar_url),
        reviewed:users!reviews_reviewed_id_fkey(id, name, avatar_url),
        contract:contracts(project:projects(title))
      `)
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("reviewed_id", userId)
    }

    const { data: reviews, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }

    return NextResponse.json({ data: reviews })
  } catch (error) {
    console.error("Reviews fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const user = (request as any).user

    const { contract_id, reviewed_id, rating, comment } = body

    // Validação básica
    if (!contract_id || !reviewed_id || !rating) {
      return NextResponse.json({ error: "Contract ID, reviewed user ID, and rating are required" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Verificar se o contrato existe e está completo
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", contract_id)
      .eq("is_completed", true)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found or not completed" }, { status: 404 })
    }

    // Verificar se o usuário faz parte do contrato
    const isParticipant = contract.company_id === user.id || contract.freelancer_id === user.id

    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Verificar se já existe uma avaliação do usuário para este contrato
    const { data: existingReview } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("contract_id", contract_id)
      .eq("reviewer_id", user.id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this contract" }, { status: 409 })
    }

    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        contract_id,
        reviewer_id: user.id,
        reviewed_id,
        rating,
        comment,
      })
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(id, name, avatar_url),
        reviewed:users!reviews_reviewed_id_fkey(id, name, avatar_url)
      `)
      .single()

    if (error) {
      console.error("Review creation error:", error)
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: review,
        message: "Review submitted successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Review creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
