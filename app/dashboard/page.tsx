import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClientPage from "./DashboardClientPage";

// Garante que a página seja sempre renderizada dinamicamente
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Esta é uma rota protegida, se não houver sessão, volta para o login.
    redirect("/auth/login");
  }

  // Busca o perfil do usuário no banco de dados.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  // Se o perfil não for encontrado (ex: lag do banco de dados após um novo cadastro),
  // criamos um objeto de perfil "reserva" com os dados da sessão.
  // Isso evita que o usuário veja um erro e permite que ele prossiga.
  if (!profile) {
    console.warn("Perfil não encontrado, criando um perfil reserva para o dashboard. Isso é esperado para novos cadastros.");
    
    // Esta é a chave para resolver o problema.
    // Em vez de mostrar um erro, construímos um perfil temporário.
    const fallbackProfile = {
      id: session.user.id,
      full_name: session.user.user_metadata.full_name || session.user.email,
      company_name: session.user.user_metadata.company_name || null,
      avatar_url: session.user.user_metadata.avatar_url || null,
      user_type: session.user.user_metadata.user_type || 'freelancer', // Padrão para um tipo
      bio: null,
      skills: [],
      updated_at: new Date().toISOString(),
    };

    return (
      <DashboardClientPage
        accessToken={session.access_token}
        userEmail={session.user.email}
        profile={fallbackProfile}
        userType={fallbackProfile.user_type as 'freelancer' | 'company'}
      />
    );
  }

  // Se o perfil foi encontrado, renderiza o dashboard com os dados reais.
  return (
    <DashboardClientPage
      accessToken={session.access_token}
      userEmail={session.user.email}
      profile={profile}
      userType={profile.user_type}
    />
  );
}
