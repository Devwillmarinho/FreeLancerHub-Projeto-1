import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ProjectDetailsClientPage from "./ProjectDetailsClientPage";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Função para buscar detalhes do projeto
async function getProjectDetails(supabase: SupabaseClient, projectId: string) {
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      id, title, description, budget, deadline, status, required_skills,
      company: profiles!company_id (id, full_name, company_name, avatar_url),
      proposals (
        id,
        message,
        proposed_budget,
        status,
        freelancer: profiles!freelancer_id (id, full_name, avatar_url)
      )
    `)
    .eq("id", projectId)
    .single();

  if (error || !project) {
    console.error("Error fetching project details:", error);
    notFound();
  }

  // Normalizar a company para ser um objeto único (não array)
  const normalizedProject = {
    ...project,
    company: project.company ? project.company[0] : null,
  };

  return normalizedProject;
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();

  const project = await getProjectDetails(supabase, params.id);

  let userProfile = null;

  if (session) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, user_type")
      .eq("id", session.user.id)
      .single();

    if (!error) userProfile = data;
  }

  return (
    <ProjectDetailsClientPage
      project={project}
      session={session}
      userProfile={userProfile}
    />
  );
}
