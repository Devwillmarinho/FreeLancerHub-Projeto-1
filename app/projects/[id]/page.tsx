import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import ProjectDetailsClientPage from "./ProjectDetailsClientPage";
import { Database } from "@/types/supabase";

type PageProps = {
  params: { id: string };
};

export const dynamic = 'force-dynamic';

export default async function ProjectDetailsPage({ params }: PageProps) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const projectId = params.id;

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/auth/login?redirect_to=/projects/${projectId}`);
  }

  // Busca os detalhes do projeto, incluindo as informações da empresa
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`*, company:profiles!company_id (id, full_name, company_name, avatar_url)`)
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    notFound(); // Se o projeto não existe, mostra uma página 404
  }

  // Busca o perfil do usuário logado para saber se ele é freelancer
  const { data: profile } = await supabase.from("profiles").select("id, user_type").eq("id", session.user.id).single();

  // Verifica se o freelancer já enviou uma proposta para este projeto
  let existingProposal = null;
  if (profile?.user_type === 'freelancer') {
    const { data } = await supabase.from('proposals').select('id').eq('project_id', projectId).eq('freelancer_id', session.user.id).single();
    existingProposal = data;
  }

  return <ProjectDetailsClientPage project={project} userProfile={profile} hasExistingProposal={!!existingProposal} />;
}