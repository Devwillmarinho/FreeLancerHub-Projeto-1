import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware } from "@/middleware/auth"

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const user = (request as any).user

    let query = supabaseAdmin
      .from("contracts")
      .select(`
        *,
        project:projects(id, title),
        company:users!contracts_company_id_fkey(id, name, company_name),
        freelancer:users!contracts_freelancer_id_fkey(id, name, avatar_url)
      `)
      .order("created_at", { ascending: false })

    // Filtrar baseado no tipo de usuário
    if (user.user_type === "company") {
      query = query.eq("company_id", user.id)
    } else if (user.user_type === "freelancer") {
      query = query.eq("freelancer_id", user.id)
    }

    const { data: contracts, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 })
    }

    return NextResponse.json({ data: contracts })
  } catch (error) {
    console.error("Contracts fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
