import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { authMiddleware, requireUserType } from "@/middleware/auth"

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const skills = searchParams.get("skills")?.split(",")

    const user = (request as any).user
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from("projects")
      .select(`
        *,
        company:users!projects_company_id_fkey(id, name, company_name),
        freelancer:users!projects_freelancer_id_fkey(id, name),
        proposals(id, freelancer_id, status)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtros baseados no tipo de usuário
    if (user.user_type === "company") {
      query = query.eq("company_id", user.id)
    } else if (user.user_type === "freelancer") {
      // Freelancers veem projetos abertos ou onde são o freelancer
      query = query.or(`status.eq.open,freelancer_id.eq.${user.id}`)
    }

    // Filtros adicionais
    if (status) {
      query = query.eq("status", status)
    }

    if (skills && skills.length > 0) {
      query = query.overlaps("required_skills", skills)
    }

    const { data: projects, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
    }

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        limit,
        total: projects.length,
      },
    })
  } catch (error) {
    console.error("Projects fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireUserType(["company"])(request)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const user = (request as any).user

    const { title, description, budget, deadline, required_skills } = body

    // Validação básica
    if (!title || !description || !budget || !required_skills) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (title.length < 5) {
      return NextResponse.json({ error: "Title must be at least 5 characters" }, { status: 400 })
    }

    if (description.length < 20) {
      return NextResponse.json({ error: "Description must be at least 20 characters" }, { status: 400 })
    }

    if (budget <= 0) {
      return NextResponse.json({ error: "Budget must be a positive number" }, { status: 400 })
    }

    if (!Array.isArray(required_skills) || required_skills.length === 0) {
      return NextResponse.json({ error: "At least one skill is required" }, { status: 400 })
    }

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .insert({
        title,
        description,
        budget,
        deadline,
        required_skills,
        company_id: user.id,
        status: "open",
      })
      .select(`
        *,
        company:users!projects_company_id_fkey(id, name, company_name)
      `)
      .single()

    if (error) {
      console.error("Project creation error:", error)
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: project,
        message: "Project created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Project creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
