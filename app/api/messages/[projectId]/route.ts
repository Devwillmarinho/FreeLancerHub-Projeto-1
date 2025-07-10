import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware } from "@/middleware/auth"

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const user = (request as any).user

    // Verificar se o usuário tem acesso ao projeto
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("company_id, freelancer_id")
      .eq("id", params.projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const canAccess = user.user_type === "admin" || project.company_id === user.id || project.freelancer_id === user.id

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, name, avatar_url, user_type)
      `)
      .eq("project_id", params.projectId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ data: messages })
  } catch (error) {
    console.error("Messages fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
