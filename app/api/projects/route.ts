import { createRouteHandlerClient } from "@/lib/supabase/route-handler"; // This path is correct
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Database } from "@/types/supabase";

// Zod schema for project data validation
const createProjectSchema = z.object({
  title: z
    .string()
    .min(5, { message: "O título deve ter pelo menos 5 caracteres." }),
  description: z
    .string()
    .min(10, { message: "A descrição deve ter pelo menos 10 caracteres." }),
  budget: z
    .number()
    .positive({ message: "O orçamento deve ser um número positivo." }),
  required_skills: z
    .array(z.string())
    .min(1, { message: "Pelo menos uma habilidade é necessária." }),
});

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is a 'company'
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Erro ao buscar perfil do usuário:", profileError);
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 }
      );
    }

    if (profile.user_type !== "company") {
      return NextResponse.json(
        { error: "Forbidden: Only companies can create projects." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, budget, required_skills } = validation.data;

    const { data: newProject, error: insertError } = await supabase
      .from("projects")
      .insert({
        title,
        description,
        budget,
        required_skills,
        company_id: session.user.id,
        status: "open", // Default status for a new project
      })
      .select(
        "*, company:profiles!company_id(id, full_name, company_name, avatar_url)"
      )
      .single();

    if (insertError) {
      console.error("Erro ao criar projeto:", insertError);
      return NextResponse.json(
        { error: "Failed to create project.", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Project created successfully", data: newProject },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro inesperado em POST /api/projects:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
