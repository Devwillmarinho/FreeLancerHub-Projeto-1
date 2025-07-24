import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware, requireUserType } from "@/middleware/auth"
import { NextRequestWithUser } from "@/types"

const updateProjectSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres.").optional(),
  description: z.string().min(20, "A descrição deve ter pelo menos 20 caracteres.").optional(),
  budget: z.number().positive("O orçamento deve ser um número positivo.").optional(),
  deadline: z.string().datetime({ message: "Formato de data inválido." }).optional().nullable(),
  required_skills: z.array(z.string()).min(1, "Pelo menos uma habilidade é necessária.").optional(),
  status: z.enum(["draft", "open", "in_progress", "completed", "cancelled"]).optional(),
});

export async function GET(request: NextRequestWithUser, { params }: { params: { id: string } }) {
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
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ data: project })
  } catch (error) {
    console.error("Project fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequestWithUser,
  { params }: { params: { id: string } },
) {
  const authResult = await requireUserType(["company", "admin"])(request)
  if (authResult) return authResult

  try {
    const user = request.user

    const body = await request.json()
    const validation = updateProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos.", issues: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: existingProject, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select("company_id")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    if (existingProject.company_id !== user.id && user.user_type !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .update(validation.data)
      .eq("id", params.id)
      .select(`
        *,
        company:users!projects_company_id_fkey(id, name, company_name, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ data: project, message: "Projeto atualizado com sucesso." })
  } catch (error: any) {
    console.error("Project update error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequestWithUser,
  { params }: { params: { id: string } },
) {
  const authResult = await requireUserType(["company", "admin"])(request)
  if (authResult) return authResult

  try {
    const user = request.user

    const { data: existingProject, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select("company_id")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    if (existingProject.company_id !== user.id && user.user_type !== "admin") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }

    const { error } = await supabaseAdmin.from("projects").delete().eq("id", params.id)

    if (error) {
      console.error("Project delete error:", error)
      return NextResponse.json({ error: "Falha ao deletar o projeto" }, { status: 500 })
    }

    return NextResponse.json({ message: "Projeto deletado com sucesso." })
  } catch (error: any) {
    console.error("Project delete error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
