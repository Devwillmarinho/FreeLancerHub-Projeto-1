import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ProjectDetailsClientPage from "./ProjectDetailsClientPage";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function getProjectDetails(supabase: SupabaseClient, projectId: string) {
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      company: profiles!projects_company_id_fkey (id, full_name, company_name, avatar_url),
      proposals (
        id,
        message,
        proposed_budget,
        status,
        freelancer: profiles!proposals_freelancer_id_fkey (id, full_name, avatar_url)
      )
    `)
    .eq("id", projectId)
    .single();

  if (error || !project) {
    console.error("Error fetching project details:", error);
    notFound();
  }

  return project;
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
