import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware } from "@/middleware/auth"

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const user = (request as any).user

    const { project_id, content, file_url, file_name } = body

    if (!project_id || !content) {
      return NextResponse.json({ error: "Project ID and content are required" }, { status: 400 })
    }

    // Verificar se o usuário tem acesso ao projeto
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("company_id, freelancer_id")
      .eq("id", project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const canSendMessage =
      user.user_type === "admin" || project.company_id === user.id || project.freelancer_id === user.id

    if (!canSendMessage) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { data: message, error } = await supabaseAdmin
      .from("messages")
      .insert({
        project_id,
        sender_id: user.id,
        content,
        file_url,
        file_name,
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, name, avatar_url, user_type)
      `)
      .single()

    if (error) {
      console.error("Message creation error:", error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: message,
        message: "Message sent successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Message creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
