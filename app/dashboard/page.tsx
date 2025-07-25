// Caminho: app/dashboard/page.tsx

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClientPage from './DashboardClientPage.tsx' // Vamos mover a lógica do cliente para este novo arquivo

// Tipagem para os perfis
interface FreelancerProfile {
  id: string;
  full_name: string;
  skills: string[];
}

interface CompanyProfile {
  id: string;
  company_name: string;
}

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  // Usar getUser() é mais seguro pois valida a sessão com o servidor da Supabase.
  const { data: { user } } = await supabase.auth.getUser()

  // Se não houver usuário, redireciona para o login.
  if (!user) {
    redirect('/auth/login')
  }

  // Precisamos da sessão para obter o access_token para as chamadas de API no cliente.
  const { data: { session } } = await supabase.auth.getSession();

  const userId = user.id
  let userProfile: FreelancerProfile | CompanyProfile | null = null;
  let userType: 'freelancer' | 'company' | null = null;

  // 1. Tenta buscar o perfil de freelancer
  const { data: freelancerProfile } = await supabase.from('freelancers').select('*').eq('id', userId).single()

  if (freelancerProfile) {
    userProfile = freelancerProfile;
    userType = 'freelancer';
  } else {
    // 2. Se não for freelancer, tenta buscar o perfil de empresa
    const { data: companyProfile } = await supabase.from('companies').select('*').eq('id', userId).single()
    if (companyProfile) {
      userProfile = companyProfile;
      userType = 'company';
    }
  }

  if (!userProfile) {
    // Isso pode acontecer por um breve momento se o perfil ainda não foi criado.
    // Em um app de produção, você pode querer mostrar uma tela de "Finalize seu perfil".
    return <div>Perfil não encontrado. Por favor, contate o suporte.</div>
  }

  // Não passe o objeto `session` inteiro. Passe apenas o que é necessário.
  // Passamos os dados buscados no servidor como props para o componente de cliente.
  return <DashboardClientPage 
            accessToken={session?.access_token} 
            userEmail={user.email} 
            profile={userProfile} 
            userType={userType} />
}
