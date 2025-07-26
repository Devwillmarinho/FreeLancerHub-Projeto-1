import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClientPage from "./DashboardClientPage";

// Garante que a página seja sempre renderizada dinamicamente
export const dynamic = 'force-dynamic';

// Helper para tentar buscar o perfil, lidando com o lag do gatilho do banco de dados
async function getProfileWithRetry(supabase: any, userId: string, retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*, user_type")
      .eq("id", userId)
      .single();
    
    if (profile) return profile;

    // Não tenta novamente em caso de erros reais, apenas se não encontrar o perfil
    if (error && error.code !== 'PGRST116') throw error;

    if (i < retries - 1) await new Promise(res => setTimeout(res, delay));
  }
  return null; // Perfil não encontrado após as tentativas
}

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Esta é uma rota protegida, se não houver sessão, volta para o login.
    redirect("/auth/login");
  }

  // Tenta buscar o perfil com algumas tentativas
  const profile = await getProfileWithRetry(supabase, session.user.id);

  // Se o perfil não for encontrado ou não tiver um tipo, redireciona para a página de completar o perfil.
  if (!profile || !profile.user_type) {
    console.log("Perfil incompleto, redirecionando para /auth/complete-profile");
    redirect('/auth/complete-profile');
  }

  // Se o perfil foi encontrado e está completo, renderiza o dashboard.
  return (
    <DashboardClientPage
      userEmail={session.user.email}
      profile={profile}
      userType={profile.user_type}
    />
  );
}
