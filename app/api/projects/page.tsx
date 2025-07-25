import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ProjectDetailsClientPage from "./ProjectDetailsClientPage"; // O novo componente de cliente

export const dynamic = 'force-dynamic';

async function getProjectDetails(supabase: any, projectId: string) {
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

  const { data: userProfile } = session ? await supabase
    .from('profiles')
    .select('*, user_type') // Garante que user_type seja selecionado
    .eq('id', session.user.id)
    .single() : { data: null };

  return (
    <ProjectDetailsClientPage
      project={project}
      session={session}
      userProfile={userProfile}
    />
  );
}
