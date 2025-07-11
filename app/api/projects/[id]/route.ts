import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware } from "@/middleware/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select(`
        *,
        company:users!projects_company_id_fkey(id, name, company_name, avatar_url),
        freelancer:users!projects_freelancer_id_fkey(id, name, avatar_url),
        proposals(
          *,
          freelancer:users!proposals_freelancer_id_fkey(id, name, avatar_url, skills)
        )
      `)
      .eq("id", params.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const user = (request as any).user

    // Verificar permissões de acesso
    const canAccess =
      user.user_type === "admin" ||
      project.company_id === user.id ||
      project.freelancer_id === user.id ||
      (user.user_type === "freelancer" && project.status === "open")

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ data: project })
  } catch (error) {
    console.error("Project fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const user = (request as any).user

    // Verificar se o projeto existe e se o usuário tem permissão
    const { data: existingProject, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Apenas a empresa dona do projeto pode editá-lo
    if (existingProject.company_id !== user.id && user.user_type !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { title, description, budget, deadline, required_skills, status } = body;

    // Constrói o objeto de atualização apenas com os campos fornecidos e válidos.
    // Isso evita a atualização de campos com valores nulos ou vazios indesejados.
    const updateData: { [key: string]: any } = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (budget !== undefined) updateData.budget = budget;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (required_skills !== undefined) updateData.required_skills = required_skills;
    if (status !== undefined) updateData.status = status;

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        *,
        company:users!projects_company_id_fkey(id, name, company_name)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
    }

    return NextResponse.json({
      data: project,
      message: "Project updated successfully",
    })
  } catch (error) {
    console.error("Project update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const user = (request as any).user

    // Verificar se o projeto existe e se o usuário tem permissão
    const { data: existingProject, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Apenas a empresa dona do projeto ou admin podem deletá-lo
    if (existingProject.company_id !== user.id && user.user_type !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { error } = await supabaseAdmin.from("projects").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Project deleted successfully",
    })
  } catch (error) {
    console.error("Project deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
