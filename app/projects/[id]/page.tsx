import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ProjectDetailsClientPage from "./ProjectDetailsClientPage";
import { Database } from "@/types/supabase";

type PageProps = {
  params: { id: string };
};

export const dynamic = 'force-dynamic';

export default async function ProjectDetailsPage({ params }: PageProps) {
  const supabase = createClient();
  const projectId = params.id;

  // Otimização: Busca a sessão e os detalhes do projeto em paralelo
  const [
    { data: { session } },
    { data: project, error: projectError }
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase
      .from("projects")
      .select(`*, company:profiles!company_id (id, full_name, company_name, avatar_url)`)
      .eq("id", projectId)
      .single()
  ]);

  if (!session) {
    redirect(`/auth/login?redirect_to=/projects/${projectId}`);
  }

  if (projectError || !project) {
    notFound(); // Se o projeto não existe, mostra uma página 404
  }

  // Otimização: Busca o perfil e a proposta existente em paralelo
  const { data: profile } = await supabase.from("profiles").select("id, user_type, full_name, company_name, avatar_url").eq("id", session.user.id).single();

  // Verifica se o freelancer já enviou uma proposta para este projeto
  let existingProposal = null;
  if (profile?.user_type === 'freelancer') {
    // Usar `select` com `head: true` é mais eficiente para apenas verificar a existência
    const { error: proposalError, count } = await supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('freelancer_id', session.user.id);
    if (!proposalError) {
      existingProposal = count && count > 0;
    }
  }

  return <ProjectDetailsClientPage project={project} userProfile={profile} hasExistingProposal={!!existingProposal} />;
}