import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware } from "@/middleware/auth"
import { NextRequestWithUser } from "@/types"

export async function GET(request: NextRequestWithUser) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const user = request.user

    let query = supabaseAdmin
      .from("contracts")
      .select(`
        *,
        project:projects(id,title,status),
        company:company_id(id,company_name),
        freelancer:freelancer_id(id,full_name,portfolio_url)
      `)
      .order("created_at", { ascending: false })

    // Filtra contratos baseado no tipo de usuário
    if (user.user_type === "freelancer") {
      query = query.eq("freelancer_id", user.id)
    } else if (user.user_type === "company") {
      query = query.eq("company_id", user.id)
    }
    // Admin pode ver todos, então não aplicamos filtro

    const { data: contracts, error } = await query

    if (error) {
      console.error("Contracts fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 })
    }

    return NextResponse.json({ data: contracts })
  } catch (error: any) {
    console.error("Contracts GET error:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 })
  }
}
